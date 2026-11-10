import assert from "node:assert/strict";
import test from "node:test";
import { Effect, Layer, Schema, Stream } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";
import { MiaClient } from "../src/client.js";
import { MiaConfig } from "../src/config.js";
import { MiaCredentials } from "../src/credentials.js";
import { defineStreamOperation, executeStream } from "../src/operation.js";

const records = defineStreamOperation<void, { readonly value: string }>({
  id: "fixture.ndjson", service: "flux", method: "POST", path: () => "/imports/fixture", auth: "none",
  responseMode: "ndjson", responseSchema: Schema.Struct({ value: Schema.String }), effect: "mutation",
});
const layer = (response: () => Response) => MiaClient.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(
    MiaConfig.layer({ services: { flux: { baseUrl: "https://fixture.invalid/lyaptf/flux" } } }),
    MiaCredentials.layer({}),
  )),
  Layer.provide(Layer.succeed(HttpClient.HttpClient,
    HttpClient.make((request) => Effect.sync(() => HttpClientResponse.fromWeb(request, response()))),
  )),
);

test("NDJSON decoding preserves UTF-8 and records across byte chunks, including final unterminated line", async () => {
  const bytes = new TextEncoder().encode('{"value":"été"}\n\n{"value":"second"}');
  const split = bytes.indexOf(0xc3) + 1;
  const chunks = [bytes.slice(0, split), bytes.slice(split, split + 5), bytes.slice(split + 5)];
  const response = () => new Response(new ReadableStream<Uint8Array>({
    start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); },
  }));
  const values = await Effect.runPromise(executeStream(records, undefined).pipe(Stream.runCollect, Effect.provide(layer(response))));
  assert.deepEqual(values, [{ value: "été" }, { value: "second" }]);
});

test("invalid NDJSON and record schema mismatches fail with distinct error tags without replay", async () => {
  for (const [text, tag] of [["not-json\n", "MiaProtocolError"], ['{"value":42}\n', "MiaSchemaError"]]) {
    let count = 0;
    const failure = await Effect.runPromise(executeStream(records, undefined).pipe(
      Stream.runCollect, Effect.flip,
      Effect.provide(layer(() => { count++; return new Response(text); })),
    ));
    assert.equal(failure._tag, tag);
    assert.equal(count, 1);
  }
});

test("raw byte streaming remains lazy and early termination cancels the response body", async () => {
  let requested = 0;
  let cancelled = false;
  const bytes = defineStreamOperation({ ...records, id: "fixture.bytes", responseMode: "byte-stream", responseSchema: Schema.Uint8Array });
  const stream = executeStream(bytes, undefined);
  const response = () => {
    requested++;
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array([1, 2, 3])); },
      cancel() { cancelled = true; },
    }));
  };
  assert.equal(requested, 0);
  const chunks = await Effect.runPromise(stream.pipe(Stream.take(1), Stream.runCollect, Effect.provide(layer(response))));
  assert.deepEqual(chunks, [new Uint8Array([1, 2, 3])]);
  assert.equal(requested, 1);
  assert.equal(cancelled, true);
});
