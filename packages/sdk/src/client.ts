import { Context, Effect, Layer, Redacted, Schema, Stream } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";
import { MiaConfig, type MiaConfigOptions } from "./config.js";
import { MiaCredentials, type CredentialsOptions } from "./credentials.js";
import {
  isRecord, MiaAuthenticationError, MiaConfigurationError, MiaEnvelopeError, MiaHttpError,
  MiaProtocolError, MiaRequestError, MiaSchemaError, MiaTransportError, type MiaError,
} from "./errors.js";
import type { MiaRequest, MiaStreamRequest } from "./operation.js";

export interface MiaClientService {
  readonly request: <A>(request: MiaRequest<A>) => Effect.Effect<A, MiaError>;
  readonly stream: <A>(request: MiaStreamRequest<A>) => Stream.Stream<A, MiaError>;
}

type WireRequest = MiaRequest<unknown> | MiaStreamRequest<unknown>;

const relativeUrl = (baseUrl: string, path: string, operationId: string): Effect.Effect<string, MiaRequestError> =>
  Effect.try({
    try: () => {
      // Never let a generated path override the configured service or escape its prefix.
      if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) throw new Error("Invalid relative route");
      const decodedPath = decodeURIComponent(path.split("?")[0] ?? "");
      if (decodedPath.split(/[\\/]/).some((segment) => segment === "." || segment === "..")) throw new Error("Dot segment in route");
      const base = new URL(baseUrl);
      const full = new URL(baseUrl.replace(/\/+$/, "") + path);
      const prefix = base.pathname.replace(/\/+$/, "");
      if (full.origin !== base.origin || full.hash || (prefix && full.pathname !== prefix && !full.pathname.startsWith(prefix + "/"))) {
        throw new Error("Route escaped service prefix");
      }
      return full.toString();
    },
    catch: () => new MiaRequestError({ operationId, message: "Operation path must stay within its configured service prefix" }),
  });

export class MiaClient extends Context.Service<MiaClient, MiaClientService>()("@mia/sdk/MiaClient") {
  static readonly layer: Layer.Layer<MiaClient, never, HttpClient.HttpClient | MiaConfig | MiaCredentials> =
    Layer.effect(MiaClient, Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient;
      const config = yield* MiaConfig;
      const credentials = yield* MiaCredentials;

      const prepareRequest = (options: WireRequest): Effect.Effect<HttpClientRequest.HttpClientRequest, MiaError> => Effect.gen(function* () {
        const endpoint = config.services[options.service];
        if (endpoint === undefined) {
          return yield* new MiaConfigurationError({ service: options.service, message: "Operation service URL is not configured" });
        }
        const url = yield* relativeUrl(endpoint.baseUrl, options.path, options.id);
        let outgoing = HttpClientRequest.make(options.method)(url);
        outgoing = HttpClientRequest.setHeader(outgoing, "Lya-Language", endpoint.language ?? config.language ?? "FR");
        if (options.responseMode === "envelope" || options.responseMode === "json" || options.responseMode === "json-or-text") {
          outgoing = HttpClientRequest.setHeader(outgoing, "Accept", "application/json");
        }
        if (options.query !== undefined) outgoing = HttpClientRequest.appendUrlParams(outgoing, options.query);
        if (options.headers !== undefined) {
          for (const [name, value] of Object.entries(options.headers)) {
            if (["authorization", "proxy-authorization", "cookie", "host"].includes(name.toLowerCase())) {
              return yield* new MiaRequestError({ operationId: options.id, message: "Authentication and host headers must be configured through the SDK services" });
            }
            outgoing = HttpClientRequest.setHeader(outgoing, name, value);
          }
        }

        switch (options.body?._tag) {
          case "Json":
            outgoing = yield* HttpClientRequest.bodyJson(outgoing, options.body.value).pipe(
              Effect.mapError(() => new MiaRequestError({ operationId: options.id, message: "Request body is not JSON serializable" })),
            );
            break;
          case "Text":
            outgoing = HttpClientRequest.bodyText(outgoing, options.body.value, options.body.contentType ?? "text/plain");
            break;
          case "FormData":
            outgoing = HttpClientRequest.bodyFormData(outgoing, options.body.value);
            break;
          case "None":
          case undefined:
            break;
        }

        const auth = options.auth ?? "required";
        if (auth !== "none") {
          if (endpoint.credential === undefined && auth === "required") {
            return yield* new MiaAuthenticationError({ credential: options.service, message: "Authenticated operation requires a named credential on its service configuration" });
          }
          if (endpoint.credential !== undefined) {
            const token = yield* credentials.get(endpoint.credential);
            outgoing = HttpClientRequest.setHeader(outgoing, "Authorization", `Bearer ${Redacted.value(token)}`);
          }
        }
        return outgoing;
      });

      const checkStatus = (response: HttpClientResponse.HttpClientResponse, operationId: string) => Effect.gen(function* () {
        if (response.status < 200 || response.status >= 300) {
          const body = yield* response.text.pipe(Effect.catch(() => Effect.succeed(undefined)));
          const retryAfter = response.headers["retry-after"];
          return yield* new MiaHttpError({
            operationId, status: response.status, message: `Operation returned HTTP ${response.status}`,
            response: Redacted.make(body), ...(retryAfter === undefined ? {} : { retryAfter }),
          });
        }
        return response;
      });

      const request = <A>(options: MiaRequest<A>): Effect.Effect<A, MiaError> => Effect.gen(function* () {
        const outgoing = yield* prepareRequest(options);
        // Deliberately no retry, authentication replay, or GET-is-safe assumption.
        const received = yield* http.execute(outgoing).pipe(
          Effect.mapError(() => new MiaTransportError({ operationId: options.id, message: "HTTP transport failed" })),
        );
        const response = yield* checkStatus(received, options.id);

        let value: unknown;
        if (options.responseMode === "void") {
          value = undefined;
        } else if (options.responseMode === "bytes") {
          value = new Uint8Array(yield* response.arrayBuffer.pipe(
            Effect.mapError(() => new MiaTransportError({ operationId: options.id, message: "Could not read binary response" })),
          ));
        } else {
          const text = yield* response.text.pipe(
            Effect.mapError(() => new MiaTransportError({ operationId: options.id, message: "Could not read response body" })),
          );
          if (options.responseMode === "text") {
            value = text;
          } else if (options.responseMode === "json-or-text" && !response.headers["content-type"]?.includes("application/json")) {
            // Public adhesion/EER client: JSON by Content-Type, otherwise exact boolean literals or text.
            value = text === "true" ? true : text === "false" ? false : text;
          } else {
            value = yield* Effect.try({
              try: (): unknown => JSON.parse(text),
              catch: () => new MiaProtocolError({ operationId: options.id, message: "Expected a valid JSON response" }),
            });
            if (options.responseMode === "envelope") {
              if (!isRecord(value) || typeof value.success !== "boolean") {
                return yield* new MiaProtocolError({ operationId: options.id, message: "Expected a LYA response envelope with boolean success" });
              }
              if (!value.success) {
                return yield* new MiaEnvelopeError({
                  operationId: options.id,
                  message: typeof value.libelleMessage === "string" ? value.libelleMessage : "API reported success:false",
                  response: Redacted.make(value),
                });
              }
              value = value.body;
            }
          }
        }
        return yield* Schema.decodeUnknownEffect(options.responseSchema)(value).pipe(
          Effect.mapError((issue) => new MiaSchemaError({
            operationId: options.id, phase: "response", message: "Response did not match the declared schema", issue: Redacted.make(issue),
          })),
        );
      });

      const stream = <A>(options: MiaStreamRequest<A>): Stream.Stream<A, MiaError> => Stream.unwrap(Effect.gen(function* () {
        const outgoing = yield* prepareRequest(options);
        const received = yield* HttpClient.withScope(http).execute(outgoing).pipe(
          Effect.mapError(() => new MiaTransportError({ operationId: options.id, message: "Streaming HTTP transport failed" })),
        );
        const response = yield* checkStatus(received, options.id);
        const bytes = response.stream.pipe(Stream.mapError(() => new MiaTransportError({ operationId: options.id, message: "Could not read response stream" })));
        const values: Stream.Stream<unknown, MiaError> = options.responseMode === "byte-stream"
          ? bytes
          : bytes.pipe(
              Stream.decodeText,
              Stream.splitLines,
              Stream.filter((line) => line.trim().length > 0),
              Stream.mapEffect((line) => Effect.try({
                try: (): unknown => JSON.parse(line),
                catch: () => new MiaProtocolError({ operationId: options.id, message: "Response stream contained an invalid NDJSON record" }),
              })),
            );
        return values.pipe(Stream.mapEffect((value) => Schema.decodeUnknownEffect(options.responseSchema)(value).pipe(
          Effect.mapError((issue) => new MiaSchemaError({
            operationId: options.id, phase: "response", message: "Stream record did not match the declared schema", issue: Redacted.make(issue),
          })),
        )));
      }));

      return { request, stream } satisfies MiaClientService;
    }));
}

/** Convenience live layer; lower-level layers allow injecting any Effect HttpClient. */
export const makeMiaLayer = (config: MiaConfigOptions, credentials: CredentialsOptions) =>
  MiaClient.layer.pipe(
    Layer.provideMerge(Layer.mergeAll(MiaConfig.layer(config), MiaCredentials.layer(credentials))),
    Layer.provide(FetchHttpClient.layer),
  );
