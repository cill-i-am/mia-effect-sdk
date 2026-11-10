import assert from "node:assert/strict";
import test from "node:test";
import { Effect, Layer, Redacted, Schema, Stream } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";
import { MiaClient } from "../src/client.js";
import { MiaConfig } from "../src/config.js";
import { Credentials, MiaCredentials } from "../src/credentials.js";
import { Body } from "../src/operation.js";
import * as Observed from "../src/observed.js";

const readId = "platform_get_lyaptf_api_courtage_projet_lire_param_56d354e0";
const transmitId = "platform_post_lyaptf_api_courtage_projet_souscription_transmettre_param_b184a99e";
const signatureId = "signature_put_lyasign_api_procedures_init_param_0e287f23";

const fixture = (handler: (request: HttpClientRequest.HttpClientRequest, url: URL) => Response) =>
  MiaClient.layer.pipe(
    Layer.provide(Layer.mergeAll(
      MiaConfig.layer({ services: {
        platform: { baseUrl: "https://fixture.invalid/lyaptf/api", credential: "fixture" },
        signature: { baseUrl: "https://signature.invalid/lyasign/api", credential: "fixture" },
        platformFlux: { baseUrl: "https://fixture.invalid/lyaptf/flux", credential: "fixture" },
        forms: { baseUrl: "https://forms.invalid/lyaform" },
      } }),
      MiaCredentials.layer({ fixture: Credentials.bearer(Redacted.make("synthetic-test-token")) }),
    )),
    Layer.provide(Layer.succeed(HttpClient.HttpClient, HttpClient.make((request, url) =>
      Effect.sync(() => HttpClientResponse.fromWeb(request, handler(request, url))),
    ))),
  );

test("generated route encodes an identifier once, uses its service root and retains unknown DTO fields", async () => {
  let actualUrl = "";
  const result = await Effect.runPromise(Observed.request(readId, { params: { p1: "SANT/A?B" } }).pipe(
    Effect.provide(fixture((_request, url) => {
      actualUrl = url.href;
      return Response.json({ success: true, body: { numero: "SANT/A?B", futureField: { retained: true } } });
    })),
  ));
  assert.equal(actualUrl, "https://fixture.invalid/lyaptf/api/courtage/projet/lire/SANT%2FA%3FB");
  assert.deepEqual(result, { numero: "SANT/A?B", futureField: { retained: true } });
});

test("generated transmission preserves the observed JSON boolean and static signature query", async () => {
  const seen: { method: string; url: string; text: string }[] = [];
  const program = Effect.gen(function* () {
    yield* Observed.request(transmitId, { params: { p1: "SANT-TEST" }, body: Body.json(false) });
    yield* Observed.request(signatureId, { params: { p1: "PROC-TEST" } });
  });
  await Effect.runPromise(program.pipe(Effect.provide(fixture((request, url) => {
    seen.push({ method: request.method, url: url.href,
      text: request.body._tag === "Uint8Array" ? new TextDecoder().decode(request.body.body) : "" });
    return Response.json({ success: true, body: {} });
  }))));
  assert.deepEqual(seen, [
    { method: "POST", url: "https://fixture.invalid/lyaptf/api/courtage/projet/souscription/transmettre/SANT-TEST", text: "false" },
    { method: "PUT", url: "https://signature.invalid/lyasign/api/procedures/init/PROC-TEST?sync=false&avecEmail=true", text: "" },
  ]);
});

test("caller-supplied response decoder fails explicitly instead of asserting a DTO type", async () => {
  const error = await Effect.runPromise(Observed.request(readId, { params: { p1: "SANT-TEST" } },
    Schema.Struct({ numero: Schema.String }),
  ).pipe(Effect.flip, Effect.provide(fixture(() => Response.json({ success: true, body: { numero: 123 } })))));
  assert.equal(error._tag, "MiaSchemaError");
});

test("incomplete JavaScript inputs fail before transport; unsupported stream entries remain non-callable", async () => {
  let calls = 0;
  const layer = fixture(() => { calls++; return Response.json({ success: true, body: {} }); });
  // Deliberately exercise JavaScript callers as well as the compile-time API.
  // @ts-expect-error A path parameter is mandatory.
  const missing = Observed.request(readId, {});
  // @ts-expect-error SSE has no JSON request mapping.
  const unsupported = Observed.request("socket_get_sse_events_efd7a141", {});
  // @ts-expect-error Observed transmission has a request body.
  const noBody = Observed.request(transmitId, { params: { p1: "SANT-TEST" } });
  // @ts-expect-error JavaScript caller supplies null instead of an input object.
  const nullInput = Observed.request(readId, null);
  // @ts-expect-error Path values are primitives, never objects or null.
  const invalidValue = Observed.request(readId, { params: { p1: null } });
  for (const effect of [missing, unsupported, noBody, nullInput, invalidValue]) {
    const error = await Effect.runPromise(effect.pipe(Effect.flip, Effect.provide(layer)));
    assert.equal(error._tag, "MiaRequestError");
  }
  assert.equal(calls, 0);
});

test("generated NDJSON operations use the flux service and stream records", async () => {
  let actualUrl = "";
  const stream = Observed.stream("platform_post_lyaptf_flux_bordereaux_ligne_saisir_donnees_manquantes_c02353f6",
    { body: Body.json({ synthetic: true }) }, Schema.Struct({ value: Schema.Int }),
  );
  const records = await Effect.runPromise(stream.pipe(Stream.runCollect, Effect.provide(fixture((_request, url) => {
    actualUrl = url.href;
    return new Response('{"value":1}\n{"value":2}\n');
  }))));
  assert.equal(actualUrl, "https://fixture.invalid/lyaptf/flux/bordereaux/ligne/saisir-donnees-manquantes");
  assert.deepEqual(records, [{ value: 1 }, { value: 2 }]);
});

test("generated form clients retain their raw response contract and optional auth", async () => {
  const result = await Effect.runPromise(Observed.request("forms_get_lyaform_api_cabinet_77eaa9f1", {}).pipe(
    Effect.provide(fixture((request, url) => {
      assert.equal(url.href, "https://forms.invalid/lyaform/api/cabinet");
      assert.equal(request.headers.authorization, undefined);
      return Response.json({ success: false, rawFormResponse: true });
    })),
  ));
  assert.deepEqual(result, { success: false, rawFormResponse: true });
});

test("quote selection retains mutation metadata even though its HTTP method is GET", () => {
  const operation = Observed.catalogue.platform_get_lyaptf_api_courtage_projet_choisir_param_b334e4df;
  assert.equal(operation.method, "GET");
  assert.equal(operation.effect, "mutation");
});
