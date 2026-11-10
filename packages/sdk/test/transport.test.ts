import assert from "node:assert/strict";
import test from "node:test";
import { Effect, Exit, Layer, Redacted, Schema } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";
import { MiaClient } from "../src/client.js";
import { MiaConfig, type MiaConfigOptions } from "../src/config.js";
import { Credentials, MiaCredentials, type CredentialsOptions } from "../src/credentials.js";
import { Body, defineOperation, execute, type Operation } from "../src/operation.js";
import type { MiaError } from "../src/errors.js";

const config: MiaConfigOptions = {
  services: {
    platform: { baseUrl: "https://fixture.invalid/lyaptf/api", credential: "fixture" },
    public: { baseUrl: "https://public.invalid/lyaform" },
  },
};
const credentials: CredentialsOptions = { fixture: Credentials.bearer(Redacted.make("fixture-only-token")) };
const read = defineOperation<void, { readonly numero: string }>({
  id: "fixture.read", service: "platform", method: "GET", path: () => "/courtage/projet/lire/SANT-TEST",
  responseMode: "envelope", responseSchema: Schema.Struct({ numero: Schema.String }), effect: "read",
});

const httpFixture = (handler: (request: HttpClientRequest.HttpClientRequest, url: URL) => Response) =>
  HttpClient.make((request, url) => Effect.sync(() => HttpClientResponse.fromWeb(request, handler(request, url))));

const fixtureLayer = (http: HttpClient.HttpClient, options: MiaConfigOptions = config, auth: CredentialsOptions = credentials) =>
  MiaClient.layer.pipe(
    Layer.provideMerge(Layer.mergeAll(MiaConfig.layer(options), MiaCredentials.layer(auth))),
    Layer.provide(Layer.succeed(HttpClient.HttpClient, http)),
  );

const failure = async <A>(program: Effect.Effect<A, MiaError, MiaClient>, http: HttpClient.HttpClient) =>
  Effect.runPromise(program.pipe(Effect.flip, Effect.provide(fixtureLayer(http))));

test("relative routes retain service prefix, bearer authorization and language", async () => {
  const seen: string[] = [];
  const http = httpFixture((request, url) => {
    seen.push(url.href);
    assert.equal(request.headers.authorization, "Bearer fixture-only-token");
    assert.equal(request.headers["lya-language"], "FR");
    return Response.json({ success: true, body: { numero: "SANT-TEST" } });
  });
  const effect = execute(read, undefined);
  assert.equal(seen.length, 0, "effects must remain lazy");
  assert.deepEqual(await Effect.runPromise(effect.pipe(Effect.provide(fixtureLayer(http)))), { numero: "SANT-TEST" });
  assert.deepEqual(seen, ["https://fixture.invalid/lyaptf/api/courtage/projet/lire/SANT-TEST"]);
});

test("HTTP, envelope, protocol and response schema failures remain distinct", async () => {
  const cases = [
    [new Response("not-json", { status: 503 }), "MiaHttpError"],
    [Response.json({ success: false, libelleMessage: "Fixture refused", body: null }), "MiaEnvelopeError"],
    [new Response("not-json", { status: 200 }), "MiaProtocolError"],
    [Response.json({ body: { numero: "X" } }), "MiaProtocolError"],
    [Response.json({ success: true, body: { numero: 42 } }), "MiaSchemaError"],
  ] as const;
  for (const [response, expected] of cases) {
    const error = await failure(execute(read, undefined), httpFixture(() => response));
    assert.equal(error._tag, expected);
    if (error._tag === "MiaHttpError") assert.equal(error.status, 503);
    if (error._tag === "MiaEnvelopeError") assert.equal(error.message, "Fixture refused");
    if (error._tag === "MiaSchemaError") assert.equal(error.phase, "response");
  }
});

test("JSON booleans, raw strings, multipart and absent bodies keep distinct wire encodings", async () => {
  const multipart = new FormData();
  multipart.append("fileContent", new Blob(["fixture"]), "fixture.txt");
  multipart.append("fileUploadedName", "fixture.txt");
  const bodies = [Body.json(false), Body.text(" ", "application/json"), Body.formData(multipart), Body.none()];
  const seen: HttpClientRequest.HttpClientRequest[] = [];
  const http = httpFixture((request) => { seen.push(request); return Response.json({ success: true, body: true }); });
  const program = Effect.gen(function* () {
    for (const body of bodies) {
      yield* execute(defineOperation<void, boolean>({
        id: "fixture.body", service: "platform", method: "POST", path: () => "/body", body: () => body,
        responseMode: "envelope", responseSchema: Schema.Boolean,
      }), undefined);
    }
  });
  await Effect.runPromise(program.pipe(Effect.provide(fixtureLayer(http))));
  assert.equal(seen[0]?.headers["content-type"], "application/json");
  assert.equal(seen[0]?.body._tag, "Uint8Array");
  if (seen[0]?.body._tag === "Uint8Array") assert.equal(new TextDecoder().decode(seen[0].body.body), "false");
  if (seen[1]?.body._tag === "Uint8Array") assert.equal(new TextDecoder().decode(seen[1].body.body), " ");
  assert.equal(seen[1]?.headers["content-type"], "application/json");
  assert.equal(seen[2]?.body._tag, "FormData");
  assert.equal(seen[2]?.headers["content-type"], undefined, "runtime must generate the multipart boundary");
  assert.equal(seen[3]?.body._tag, "Empty");
});

test("raw JSON, text, bytes and no-content responses are decoded without envelope assumptions", async () => {
  const ops: readonly Operation<void, unknown>[] = [
    defineOperation({ ...read, id: "fixture.raw", responseMode: "json", responseSchema: Schema.Unknown }),
    defineOperation({ ...read, id: "fixture.text", responseMode: "text", responseSchema: Schema.String }),
    defineOperation({ ...read, id: "fixture.bytes", responseMode: "bytes", responseSchema: Schema.Uint8Array }),
    defineOperation({ ...read, id: "fixture.void", responseMode: "void", responseSchema: Schema.Void }),
  ];
  const responses = [Response.json({ success: false, arbitrary: true }), new Response("hello"), new Response(new Uint8Array([1, 2])), new Response(null, { status: 204 })];
  let count = 0;
  const http = httpFixture(() => responses[count++]!);
  const values = await Effect.runPromise(Effect.all(ops.map((op) => execute(op, undefined))).pipe(Effect.provide(fixtureLayer(http))));
  assert.deepEqual(values, [{ success: false, arbitrary: true }, "hello", new Uint8Array([1, 2]), undefined]);
});

test("public form json-or-text follows Content-Type and never unwraps a raw success field", async () => {
  const operation = defineOperation({ ...read, id: "fixture.publicForm", responseMode: "json-or-text", responseSchema: Schema.Unknown });
  const cases: ReadonlyArray<readonly [Response, unknown]> = [
    [Response.json({ success: false, body: { retained: true } }), { success: false, body: { retained: true } }],
    [new Response("true", { headers: { "Content-Type": "text/plain" } }), true],
    [new Response("false", { headers: { "Content-Type": "text/plain" } }), false],
    [new Response(" true ", { headers: { "Content-Type": "text/plain" } }), " true "],
    [new Response('{"key":"text"}', { headers: { "Content-Type": "text/plain" } }), '{"key":"text"}'],
    [new Response(null, { status: 204 }), ""],
  ];
  for (const [response, expected] of cases) {
    const value = await Effect.runPromise(execute(operation, undefined).pipe(Effect.provide(fixtureLayer(httpFixture(() => response)))));
    assert.deepEqual(value, expected);
  }
});

test("malformed JSON advertised by public form responses remains a typed protocol error", async () => {
  const operation = defineOperation({ ...read, id: "fixture.publicFormMalformed", responseMode: "json-or-text", responseSchema: Schema.Unknown });
  const error = await failure(execute(operation, undefined), httpFixture(() => new Response("not-json", { headers: { "Content-Type": "application/json; charset=UTF-8" } })));
  assert.equal(error._tag, "MiaProtocolError");
});

test("mutation GETs are never retried automatically, including 401 and 503", async () => {
  for (const status of [401, 503]) {
    let count = 0;
    const http = httpFixture(() => { count++; return Response.json({ message: "fixture" }, { status }); });
    const mutation = defineOperation({ ...read, id: "fixture.mutationGet", effect: "mutation" });
    const error = await failure(execute(mutation, undefined), http);
    assert.equal(error._tag, "MiaHttpError");
    assert.equal(count, 1);
  }
});

test("request schemas and circular JSON fail before any network call", async () => {
  let count = 0;
  const http = httpFixture(() => { count++; return Response.json({ success: true, body: true }); });
  const inputOperation = defineOperation<{ readonly id: string }, unknown>({
    id: "fixture.validate", service: "platform", method: "POST", inputSchema: Schema.Struct({ id: Schema.NonEmptyString }),
    path: ({ id }) => `/thing/${id}`, responseMode: "envelope", responseSchema: Schema.Unknown,
  });
  const invalid = await failure(execute(inputOperation, { id: "" }), http);
  assert.equal(invalid._tag, "MiaSchemaError");
  if (invalid._tag === "MiaSchemaError") assert.equal(invalid.phase, "request");
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  const error = await failure(execute(defineOperation({ ...read, method: "POST", body: () => Body.json(circular) }), undefined), http);
  assert.equal(error._tag, "MiaRequestError");
  assert.equal(count, 0);
});

test("configured service prefixes reject absolute and decoded dot-segment escapes", async () => {
  let count = 0;
  const http = httpFixture(() => { count++; return Response.json({ success: true, body: {} }); });
  for (const path of ["https://other.invalid/steal", "//other.invalid/steal", "/../outside", "/%2e%2e/outside", "/%2e%2e%2foutside", "/a\\..\\outside"]) {
    const error = await failure(execute(defineOperation({ ...read, path: () => path }), undefined), http);
    assert.equal(error._tag, "MiaRequestError", path);
  }
  assert.equal(count, 0);
});

test("a credential is only attached to explicitly configured services, and auth:none suppresses it", async () => {
  const seen: Array<string | undefined> = [];
  const http = httpFixture((request) => { seen.push(request.headers.authorization); return Response.json({ success: true, body: { numero: "X" } }); });
  const publicOperation = defineOperation({ ...read, service: "public" });
  const error = await failure(execute(publicOperation, undefined), http);
  assert.equal(error._tag, "MiaAuthenticationError");
  await Effect.runPromise(execute(defineOperation({ ...read, auth: "none" }), undefined).pipe(Effect.provide(fixtureLayer(http))));
  assert.deepEqual(seen, [undefined]);
});

test("query arrays remain repeated parameters and language is overridable without auth override", async () => {
  const http = httpFixture((request, url) => {
    assert.deepEqual(url.searchParams.getAll("codeDistributeur"), ["A B", "C"]);
    assert.equal(url.searchParams.get("page"), "0");
    assert.equal(url.searchParams.has("absent"), false);
    assert.equal(request.headers["lya-language"], "EN");
    return Response.json({ success: true, body: { numero: "X" } });
  });
  const operation = defineOperation({ ...read, query: () => ({ codeDistributeur: ["A B", "C"], page: 0, absent: undefined }), headers: () => ({ "Lya-Language": "EN" }) });
  await Effect.runPromise(execute(operation, undefined).pipe(Effect.provide(fixtureLayer(http))));
  const error = await failure(execute(defineOperation({ ...read, headers: () => ({ Authorization: "uncontrolled" }) }), undefined), http);
  assert.equal(error._tag, "MiaRequestError");
});

test("interruption aborts the Effect FetchHttpClient request without a retry", async () => {
  let aborted = false;
  let count = 0;
  let started!: () => void;
  const whenStarted = new Promise<void>((resolve) => { started = resolve; });
  const fakeFetch: typeof fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    count++;
    init?.signal?.addEventListener("abort", () => { aborted = true; reject(new DOMException("aborted", "AbortError")); }, { once: true });
    started();
  });
  const httpLayer = FetchHttpClient.layer.pipe(Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fakeFetch)));
  const app = MiaClient.layer.pipe(
    Layer.provideMerge(Layer.mergeAll(MiaConfig.layer(config), MiaCredentials.layer(credentials))),
    Layer.provide(httpLayer),
  );
  const controller = new AbortController();
  const running = Effect.runPromiseExit(execute(read, undefined).pipe(Effect.provide(app)), { signal: controller.signal });
  await whenStarted;
  controller.abort();
  const exit = await running;
  assert.equal(Exit.isFailure(exit), true);
  assert.equal(aborted, true);
  assert.equal(count, 1);
});
