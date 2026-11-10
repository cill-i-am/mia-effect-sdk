import assert from "node:assert/strict";
import test from "node:test";
import { Effect, Layer, Redacted, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";
import { MiaClient } from "../src/client.js";
import { MiaConfig } from "../src/config.js";
import { Credentials, MiaCredentials } from "../src/credentials.js";
import { defineOperation, execute } from "../src/operation.js";

const operation = defineOperation<void, boolean>({
  id: "fixture.authenticated", service: "platform", method: "GET", path: () => "/fixture",
  responseMode: "envelope", responseSchema: Schema.Boolean,
});
const machine = Credentials.machine({
  identityUrl: "https://identity.invalid/exact-machine-endpoint",
  clientId: Redacted.make("fixture-client"), clientSecret: Redacted.make("fixture-secret"),
});
const config = { services: { platform: { baseUrl: "https://platform.invalid/lyaptf/api", credential: "machine" } } };
const appLayer = (http: HttpClient.HttpClient) => MiaClient.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(MiaConfig.layer(config), MiaCredentials.layer({ machine }))),
  Layer.provide(Layer.succeed(HttpClient.HttpClient, http)),
);

test("machine auth follows the supplied JSON contract and caches until explicit invalidation", async () => {
  let identityCalls = 0;
  let businessCalls = 0;
  const http = HttpClient.make((request, url) => Effect.sync(() => {
    if (url.origin === "https://identity.invalid") {
      identityCalls++;
      assert.equal(url.pathname, "/exact-machine-endpoint");
      assert.equal(request.method, "POST");
      assert.equal(request.headers["content-type"], "application/json");
      assert.equal(request.headers.authorization, undefined);
      assert.equal(request.body._tag, "Uint8Array");
      if (request.body._tag === "Uint8Array") {
        assert.deepEqual(JSON.parse(new TextDecoder().decode(request.body.body)), { clientId: "fixture-client", clientSecret: "fixture-secret" });
      }
      return HttpClientResponse.fromWeb(request, Response.json({ body: { token: `fixture-token-${identityCalls}` } }));
    }
    businessCalls++;
    assert.equal(request.headers.authorization, `Bearer fixture-token-${identityCalls}`);
    return HttpClientResponse.fromWeb(request, Response.json({ success: true, body: true }));
  }));
  const result = await Effect.runPromise(Effect.gen(function* () {
    // Concurrent first calls share one token request; no expiry is invented.
    yield* Effect.all([execute(operation, undefined), execute(operation, undefined)], { concurrency: "unbounded" });
    yield* (yield* MiaCredentials).invalidate("machine");
    return yield* execute(operation, undefined);
  }).pipe(Effect.provide(appLayer(http))));
  assert.equal(result, true);
  assert.equal(identityCalls, 2);
  assert.equal(businessCalls, 3);
});

test("authentication failures never send the business request and sensitive bodies are redacted", async () => {
  for (const body of [{ success: false, body: { token: "fixture-sensitive" } }, { body: { unexpected: "fixture-sensitive" } }]) {
    let count = 0;
    const http = HttpClient.make((request) => Effect.sync(() => {
      count++;
      return HttpClientResponse.fromWeb(request, Response.json(body));
    }));
    const error = await Effect.runPromise(execute(operation, undefined).pipe(Effect.flip, Effect.provide(appLayer(http))));
    assert.equal(count, 1);
    assert.ok(error._tag === "MiaEnvelopeError" || error._tag === "MiaSchemaError");
    assert.equal(JSON.stringify(error).includes("fixture-sensitive"), false);
    assert.equal(JSON.stringify(machine).includes("fixture-secret"), false);
  }
});

test("business 401 does not reacquire a token or replay the operation", async () => {
  let identityCalls = 0;
  let businessCalls = 0;
  const http = HttpClient.make((request, url) => Effect.sync(() => {
    if (url.origin === "https://identity.invalid") {
      identityCalls++;
      return HttpClientResponse.fromWeb(request, Response.json({ body: { token: "fixture-token" } }));
    }
    businessCalls++;
    return HttpClientResponse.fromWeb(request, Response.json({ reason: "expired" }, { status: 401 }));
  }));
  const error = await Effect.runPromise(execute(operation, undefined).pipe(Effect.flip, Effect.provide(appLayer(http))));
  assert.equal(error._tag, "MiaHttpError");
  assert.equal(identityCalls, 1);
  assert.equal(businessCalls, 1);
});
