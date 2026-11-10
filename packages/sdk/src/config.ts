import { Context, Effect, Layer } from "effect";
import { MiaConfigurationError } from "./errors.js";

export interface ServiceEndpoint {
  /** Complete service prefix, e.g. https://sandbox.example/lyaptf/api. */
  readonly baseUrl: string;
  /** Name in MiaCredentials. Omit only for explicitly unauthenticated operations. */
  readonly credential?: string;
  readonly language?: string;
}

export interface MiaConfigOptions {
  /** Arbitrary keys allow each discovered microservice and API version to have its own prefix. */
  readonly services: Readonly<Record<string, ServiceEndpoint>>;
  /** The platform browser sends FR by default. */
  readonly language?: string;
}

/** Validate without including the supplied URL in error messages. */
export const validateHttpUrl = (value: string, context: string): Effect.Effect<string, MiaConfigurationError> =>
  Effect.try({
    try: () => {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new Error("Invalid service URL");
      }
      return url.toString().replace(/\/+$/, "");
    },
    catch: () => new MiaConfigurationError({ message: `${context} must be an absolute HTTP(S) URL without credentials, query or fragment` }),
  });

export class MiaConfig extends Context.Service<MiaConfig, MiaConfigOptions>()("@mia/sdk/MiaConfig") {
  static readonly layer = (options: MiaConfigOptions): Layer.Layer<MiaConfig, MiaConfigurationError> =>
    Layer.effect(MiaConfig, Effect.gen(function* () {
      const services: Record<string, ServiceEndpoint> = {};
      for (const [name, endpoint] of Object.entries(options.services)) {
        const baseUrl = yield* validateHttpUrl(endpoint.baseUrl, `Service ${name}`);
        services[name] = Object.freeze({ ...endpoint, baseUrl });
      }
      return Object.freeze({ ...options, services: Object.freeze(services) });
    }));
}
