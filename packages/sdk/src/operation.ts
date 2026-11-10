import { Effect, Redacted, Schema, Stream } from "effect";
import type { HttpMethod } from "effect/http/HttpMethod";
import type * as UrlParams from "effect/http/UrlParams";
import { MiaClient } from "./client.js";
import { MiaRequestError, MiaSchemaError, type MiaError } from "./errors.js";

export type Query = UrlParams.Input;
export type AuthMode = "required" | "optional" | "none";
export type ResponseMode = "envelope" | "json" | "json-or-text" | "text" | "bytes" | "void";
export type StreamResponseMode = "ndjson" | "byte-stream";

export type RequestBody =
  | { readonly _tag: "None" }
  | { readonly _tag: "Json"; readonly value: unknown }
  | { readonly _tag: "Text"; readonly value: string; readonly contentType?: string }
  | { readonly _tag: "FormData"; readonly value: FormData };

export const Body = {
  none: (): RequestBody => ({ _tag: "None" }),
  json: (value: unknown): RequestBody => ({ _tag: "Json", value }),
  text: (value: string, contentType?: string): RequestBody => ({
    _tag: "Text", value, ...(contentType === undefined ? {} : { contentType }),
  }),
  formData: (value: FormData): RequestBody => ({ _tag: "FormData", value }),
} as const;

export interface MiaRequest<A> {
  readonly id: string;
  readonly service: string;
  readonly method: HttpMethod;
  /** Relative to the explicitly configured service prefix. */
  readonly path: string;
  readonly query?: Query;
  readonly body?: RequestBody;
  readonly headers?: Readonly<Record<string, string>>;
  readonly auth?: AuthMode;
  readonly responseMode: ResponseMode;
  readonly responseSchema: Schema.Decoder<A>;
}

export interface Operation<I, A> {
  readonly id: string;
  readonly service: string;
  readonly method: HttpMethod;
  readonly path: (input: I) => string;
  readonly query?: (input: I) => Query;
  readonly body?: (input: I) => RequestBody;
  readonly headers?: (input: I) => Readonly<Record<string, string>>;
  readonly inputSchema?: Schema.Decoder<I>;
  readonly responseSchema: Schema.Decoder<A>;
  readonly responseMode: ResponseMode;
  readonly auth?: AuthMode;
  /** Metadata only. It never triggers retries, even for GET. */
  readonly effect?: "read" | "mutation" | "unknown";
  readonly evidence?: readonly unknown[];
  readonly description?: string;
}

export interface MiaStreamRequest<A> extends Omit<MiaRequest<A>, "responseMode"> {
  readonly responseMode: StreamResponseMode;
}

export interface StreamOperation<I, A> extends Omit<Operation<I, A>, "responseMode"> {
  /** Each NDJSON record or raw Uint8Array chunk is decoded with responseSchema. */
  readonly responseMode: StreamResponseMode;
}

export const defineOperation = <I, A>(definition: Operation<I, A>): Operation<I, A> =>
  Object.freeze(definition);

export const defineStreamOperation = <I, A>(definition: StreamOperation<I, A>): StreamOperation<I, A> =>
  Object.freeze(definition);

/** Lazy, typed Effect; request preparation and validation run only when the Effect runs. */
export const execute = <I, A>(operation: Operation<I, A>, input: I): Effect.Effect<A, MiaError, MiaClient> =>
  Effect.gen(function* () {
    const value = operation.inputSchema === undefined
      ? input
      : yield* Schema.decodeUnknownEffect(operation.inputSchema)(input).pipe(
          Effect.mapError((issue) => new MiaSchemaError({
            operationId: operation.id, phase: "request", message: "Request did not match the declared schema", issue: Redacted.make(issue),
          })),
        );
    const request = yield* Effect.try({
      try: (): MiaRequest<A> => ({
        id: operation.id,
        service: operation.service,
        method: operation.method,
        path: operation.path(value),
        responseMode: operation.responseMode,
        responseSchema: operation.responseSchema,
        ...(operation.auth === undefined ? {} : { auth: operation.auth }),
        ...(operation.query === undefined ? {} : { query: operation.query(value) }),
        ...(operation.body === undefined ? {} : { body: operation.body(value) }),
        ...(operation.headers === undefined ? {} : { headers: operation.headers(value) }),
      }),
      catch: () => new MiaRequestError({ operationId: operation.id, message: "Could not construct the operation request" }),
    });
    return yield* (yield* MiaClient).request(request);
  }).pipe(Effect.withSpan(`mia.${operation.id}`, {
    attributes: { "mia.operation.id": operation.id, "mia.service": operation.service, "http.request.method": operation.method },
  }));

/** A scoped Effect Stream; stopping consumption releases the HTTP response. */
export const executeStream = <I, A>(operation: StreamOperation<I, A>, input: I): Stream.Stream<A, MiaError, MiaClient> =>
  Stream.unwrap(Effect.gen(function* () {
    const value = operation.inputSchema === undefined
      ? input
      : yield* Schema.decodeUnknownEffect(operation.inputSchema)(input).pipe(
          Effect.mapError((issue) => new MiaSchemaError({
            operationId: operation.id, phase: "request", message: "Request did not match the declared schema", issue: Redacted.make(issue),
          })),
        );
    const request = yield* Effect.try({
      try: (): MiaStreamRequest<A> => ({
        id: operation.id, service: operation.service, method: operation.method,
        path: operation.path(value), responseMode: operation.responseMode, responseSchema: operation.responseSchema,
        ...(operation.auth === undefined ? {} : { auth: operation.auth }),
        ...(operation.query === undefined ? {} : { query: operation.query(value) }),
        ...(operation.body === undefined ? {} : { body: operation.body(value) }),
        ...(operation.headers === undefined ? {} : { headers: operation.headers(value) }),
      }),
      catch: () => new MiaRequestError({ operationId: operation.id, message: "Could not construct the streaming request" }),
    });
    return (yield* MiaClient).stream(request);
  })).pipe(Stream.withSpan(`mia.${operation.id}`, {
    attributes: { "mia.operation.id": operation.id, "mia.service": operation.service, "http.request.method": operation.method },
  }));
