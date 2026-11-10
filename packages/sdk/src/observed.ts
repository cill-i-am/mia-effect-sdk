/**
 * Advanced, source-derived operation surface. Payloads are deliberately unknown.
 * Prefer curated service functions where available; inspect spec/ for provenance.
 */
import { Effect, Schema, Stream } from "effect";
import type { MiaClient } from "./client.js";
import { MiaRequestError, type MiaError } from "./errors.js";
import { defineOperation, defineStreamOperation, execute, executeStream, type AuthMode, type Query, type RequestBody, type ResponseMode, type StreamResponseMode } from "./operation.js";
import type { HttpMethod } from "effect/http/HttpMethod";
import { catalogue } from "./generated/catalogue.js";

export { catalogue, coverage } from "./generated/catalogue.js";
export type OperationId = keyof typeof catalogue;
export type ExecutableOperationId = {
  [K in OperationId]: (typeof catalogue)[K]["transport"] extends "request" ? K : never;
}[OperationId];
export type StreamOperationId = {
  [K in OperationId]: (typeof catalogue)[K]["transport"] extends "stream" ? K : never;
}[OperationId];
export type CallableOperationId = ExecutableOperationId | StreamOperationId;

type Slots<S extends string> = S extends `${string}{${infer Name}}${infer Rest}` ? Name | Slots<Rest> : never;
type ParameterNames<Id extends OperationId> = Slots<(typeof catalogue)[Id]["path"]> | Slots<(typeof catalogue)[Id]["query"]>;
type ParameterValue = string | number | boolean;
export type Input<Id extends CallableOperationId> = {
  /** Extra query parameters; template values come from params and are encoded once. */
  readonly query?: Query;
  /** Override only when you have established the operation's authentication contract. */
  readonly auth?: AuthMode;
} & ([ParameterNames<Id>] extends [never]
  ? { readonly params?: Readonly<Record<string, never>> }
  : { readonly params: { readonly [Key in ParameterNames<Id>]: ParameterValue } })
  & ((typeof catalogue)[Id]["bodyEncoding"] extends "none"
    ? { readonly body?: never }
    : { readonly body: RequestBody });

interface RuntimeInput {
  readonly params?: Readonly<Record<string, ParameterValue>>;
  readonly body?: RequestBody;
  readonly query?: Query;
  readonly auth?: AuthMode;
}

interface RuntimeEntry {
  readonly executable: boolean;
  readonly service: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly query: string;
  readonly responseMode: ResponseMode | "unsupported";
  readonly streamResponseMode: StreamResponseMode | "unsupported";
  readonly transport: "request" | "stream" | "catalogue";
  readonly bodyEncoding: string;
  readonly auth: AuthMode;
  readonly effect: "read" | "mutation" | "unknown";
}

const fill = (template: string, values: Readonly<Record<string, ParameterValue>> | undefined): string =>
  template.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = values?.[name];
    if (!["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) {
      throw new Error("Missing or invalid observed-route parameter");
    }
    return encodeURIComponent(String(value));
  });

/** An unvalidated DTO remains unknown. Supply a decoder to strengthen it explicitly. */
export function request<Id extends ExecutableOperationId>(
  id: Id, input: Input<NoInfer<Id>>,
): Effect.Effect<unknown, MiaError, MiaClient>;
export function request<Id extends ExecutableOperationId, A>(
  id: Id, input: Input<NoInfer<Id>>, responseSchema: Schema.Decoder<A>,
): Effect.Effect<A, MiaError, MiaClient>;
export function request(
  id: ExecutableOperationId, input: RuntimeInput, responseSchema: Schema.Decoder<unknown> = Schema.Unknown,
): Effect.Effect<unknown, MiaError, MiaClient> {
  return Effect.suspend(() => {
    // Keep the runtime guard as well as the compile-time union for JavaScript consumers.
    const entry: RuntimeEntry | undefined = (catalogue as Readonly<Record<string, RuntimeEntry>>)[id];
    if (entry === undefined || entry.transport !== "request" || entry.responseMode === "unsupported") {
      return Effect.fail(new MiaRequestError({
        operationId: id,
        message: "This catalogue entry lacks an executable mapping; inspect its evidence and use defineOperation explicitly",
      }));
    }
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      return Effect.fail(new MiaRequestError({ operationId: id, message: "Operation input must be an object" }));
    }
    if (entry.bodyEncoding !== "none" && input.body === undefined) {
      return Effect.fail(new MiaRequestError({
        operationId: id, message: "Observed operation requires an explicit Body encoding",
      }));
    }
    if (entry.bodyEncoding === "none" && input.body !== undefined) {
      return Effect.fail(new MiaRequestError({
        operationId: id, message: "The observed operation has no request body",
      }));
    }
    return execute(defineOperation<RuntimeInput, unknown>({
      id,
      service: entry.service,
      method: entry.method,
      path: (value) => fill(entry.path, value.params) + (entry.query ? `?${fill(entry.query, value.params)}` : ""),
      ...(input.query === undefined ? {} : { query: (value: RuntimeInput) => value.query ?? [] }),
      ...(input.body === undefined ? {} : { body: (value: RuntimeInput) => value.body! }),
      auth: input.auth ?? entry.auth,
      responseMode: entry.responseMode,
      responseSchema,
      effect: entry.effect,
      description: "Frontend-observed route. DTO schema and credential access are unverified.",
    }), input);
  });
}

type DefaultStreamOutput<Id extends StreamOperationId> =
  (typeof catalogue)[Id]["streamResponseMode"] extends "byte-stream" ? Uint8Array : unknown;

/** Consume NDJSON records or raw byte chunks without buffering the entire response. */
export function stream<Id extends StreamOperationId>(
  id: Id, input: Input<NoInfer<Id>>,
): Stream.Stream<DefaultStreamOutput<Id>, MiaError, MiaClient>;
export function stream<Id extends StreamOperationId, A>(
  id: Id, input: Input<NoInfer<Id>>, responseSchema: Schema.Decoder<A>,
): Stream.Stream<A, MiaError, MiaClient>;
export function stream(
  id: StreamOperationId, input: RuntimeInput, responseSchema?: Schema.Decoder<unknown>,
): Stream.Stream<unknown, MiaError, MiaClient> {
  return Stream.unwrap(Effect.suspend(() => {
    const entry: RuntimeEntry | undefined = (catalogue as Readonly<Record<string, RuntimeEntry>>)[id];
    if (entry === undefined || entry.transport !== "stream" || entry.streamResponseMode === "unsupported") {
      return Effect.fail(new MiaRequestError({ operationId: id, message: "This entry has no streaming transport mapping" }));
    }
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      return Effect.fail(new MiaRequestError({ operationId: id, message: "Operation input must be an object" }));
    }
    if (entry.bodyEncoding !== "none" && input.body === undefined) {
      return Effect.fail(new MiaRequestError({ operationId: id, message: "Observed stream requires an explicit Body encoding" }));
    }
    if (entry.bodyEncoding === "none" && input.body !== undefined) {
      return Effect.fail(new MiaRequestError({ operationId: id, message: "The observed stream has no request body" }));
    }
    return Effect.succeed(executeStream(defineStreamOperation<RuntimeInput, unknown>({
      id, service: entry.service, method: entry.method,
      path: (value) => fill(entry.path, value.params) + (entry.query ? `?${fill(entry.query, value.params)}` : ""),
      ...(input.query === undefined ? {} : { query: (value: RuntimeInput) => value.query ?? [] }),
      ...(input.body === undefined ? {} : { body: (value: RuntimeInput) => value.body! }),
      auth: input.auth ?? entry.auth,
      responseMode: entry.streamResponseMode,
      responseSchema: responseSchema ?? (entry.streamResponseMode === "byte-stream" ? Schema.Uint8Array : Schema.Unknown),
      effect: entry.effect,
      description: "Frontend-observed streaming route. DTO schema and credential access are unverified.",
    }), input));
  }));
}
