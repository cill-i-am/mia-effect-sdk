import { Context, Effect, Layer, Redacted, Schema, Semaphore } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { validateHttpUrl } from "./config.js";
import {
  isRecord, MiaAuthenticationError, MiaEnvelopeError, MiaHttpError, MiaProtocolError,
  MiaRequestError, MiaSchemaError, MiaTransportError, type MiaError,
} from "./errors.js";

export interface BearerCredential {
  readonly _tag: "Bearer";
  readonly token: Redacted.Redacted<string>;
}

export interface MachineCredential {
  readonly _tag: "Machine";
  /** Exact token endpoint URL supplied by the integrator; no guessed /oauth path. */
  readonly identityUrl: string;
  readonly clientId: Redacted.Redacted<string>;
  readonly clientSecret: Redacted.Redacted<string>;
}

export type Credential = BearerCredential | MachineCredential;
export type CredentialsOptions = Readonly<Record<string, Credential>>;

export const Credentials = {
  bearer: (token: Redacted.Redacted<string>): BearerCredential => ({ _tag: "Bearer", token }),
  machine: (options: Omit<MachineCredential, "_tag">): MachineCredential => ({ _tag: "Machine", ...options }),
} as const;

/** The supplied Postman collection's root prerequest script reads jsonResponse.body.token. */
const MachineTokenResponse = Schema.Struct({ body: Schema.Struct({ token: Schema.NonEmptyString }) });

export interface MiaCredentialsService {
  readonly get: (name: string) => Effect.Effect<Redacted.Redacted<string>, MiaError>;
  /** Explicit invalidation only. A 401 never automatically replays a business mutation. */
  readonly invalidate: (name?: string) => Effect.Effect<void>;
}

export class MiaCredentials extends Context.Service<MiaCredentials, MiaCredentialsService>()("@mia/sdk/MiaCredentials") {
  static readonly layer = (options: CredentialsOptions): Layer.Layer<MiaCredentials, never, HttpClient.HttpClient> =>
    Layer.effect(MiaCredentials, Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient;
      const semaphore = yield* Semaphore.make(1);
      const tokens = new Map<string, Redacted.Redacted<string>>();
      const specs = Object.freeze({ ...options });

      const authenticate = (name: string, spec: MachineCredential): Effect.Effect<Redacted.Redacted<string>, MiaError> =>
        Effect.gen(function* () {
          const operationId = "identity.authenticateMachine";
          const url = yield* validateHttpUrl(spec.identityUrl, "Machine identityUrl");
          const request = yield* HttpClientRequest.bodyJson(
            HttpClientRequest.post(url),
            { clientId: Redacted.value(spec.clientId), clientSecret: Redacted.value(spec.clientSecret) },
          ).pipe(Effect.mapError(() => new MiaRequestError({ operationId, message: "Could not encode machine authentication request" })));
          const response = yield* http.execute(request).pipe(
            Effect.mapError(() => new MiaTransportError({ operationId, message: "Machine authentication transport failed" })),
          );
          if (response.status < 200 || response.status >= 300) {
            // HTTP status remains the primary failure even if the error body is malformed.
            const body = yield* response.text.pipe(Effect.catch(() => Effect.succeed(undefined)));
            return yield* new MiaHttpError({ operationId, status: response.status, message: "Machine authentication returned an HTTP error", response: Redacted.make(body) });
          }
          const raw = yield* response.text.pipe(
            Effect.mapError(() => new MiaTransportError({ operationId, message: "Could not read machine authentication response" })),
          );
          const json: unknown = yield* Effect.try({
            try: () => JSON.parse(raw),
            catch: () => new MiaProtocolError({ operationId, message: "Machine authentication response was not valid JSON" }),
          });
          if (isRecord(json) && json.success === false) {
            return yield* new MiaEnvelopeError({ operationId, message: "Machine authentication was rejected", response: Redacted.make(json) });
          }
          const decoded = yield* Schema.decodeUnknownEffect(MachineTokenResponse)(json).pipe(
            Effect.mapError((issue) => new MiaSchemaError({ operationId, phase: "response", message: "Machine authentication response must contain body.token", issue: Redacted.make(issue) })),
          );
          if (!decoded.body.token.trim()) {
            return yield* new MiaAuthenticationError({ credential: name, message: "Authentication returned an empty token" });
          }
          return Redacted.make(decoded.body.token);
        });

      return {
        get: (name: string) => Semaphore.withPermits(semaphore, 1)(Effect.gen(function* () {
          const spec = specs[name];
          if (spec === undefined) {
            return yield* new MiaAuthenticationError({ credential: name, message: "Named credential is not configured" });
          }
          if (spec._tag === "Bearer") {
            if (!Redacted.value(spec.token).trim()) {
              return yield* new MiaAuthenticationError({ credential: name, message: "Bearer credential is empty" });
            }
            return spec.token;
          }
          const cached = tokens.get(name);
          if (cached !== undefined) return cached;
          const token = yield* authenticate(name, spec);
          tokens.set(name, token);
          return token;
        })),
        invalidate: (name?: string) => Semaphore.withPermits(semaphore, 1)(Effect.sync(() => {
          if (name === undefined) tokens.clear();
          else tokens.delete(name);
        })),
      } satisfies MiaCredentialsService;
    }));
}
