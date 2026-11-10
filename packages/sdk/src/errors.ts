import { Data, Redacted } from "effect";

/** Configuration never falls back to a production host. */
export class MiaConfigurationError extends Data.TaggedError("MiaConfigurationError")<{
  readonly message: string;
  readonly service?: string;
}> {}

export class MiaAuthenticationError extends Data.TaggedError("MiaAuthenticationError")<{
  readonly credential: string;
  readonly message: string;
}> {}

/** No request or underlying transport cause is retained: either may contain credentials. */
export class MiaTransportError extends Data.TaggedError("MiaTransportError")<{
  readonly operationId: string;
  readonly message: string;
}> {}

export class MiaHttpError extends Data.TaggedError("MiaHttpError")<{
  readonly operationId: string;
  readonly status: number;
  readonly message: string;
  readonly response: Redacted.Redacted<unknown>;
  readonly retryAfter?: string;
}> {}

/** Invalid JSON or an invalid response envelope, before application DTO decoding. */
export class MiaProtocolError extends Data.TaggedError("MiaProtocolError")<{
  readonly operationId: string;
  readonly message: string;
}> {}

/** A valid LYA envelope with success:false, including when HTTP status is 200. */
export class MiaEnvelopeError extends Data.TaggedError("MiaEnvelopeError")<{
  readonly operationId: string;
  readonly message: string;
  readonly response: Redacted.Redacted<unknown>;
}> {}

export class MiaSchemaError extends Data.TaggedError("MiaSchemaError")<{
  readonly operationId: string;
  readonly phase: "request" | "response";
  readonly message: string;
  readonly issue: Redacted.Redacted<unknown>;
}> {}

export class MiaRequestError extends Data.TaggedError("MiaRequestError")<{
  readonly operationId: string;
  readonly message: string;
}> {}

export type MiaError =
  | MiaConfigurationError
  | MiaAuthenticationError
  | MiaTransportError
  | MiaHttpError
  | MiaProtocolError
  | MiaEnvelopeError
  | MiaSchemaError
  | MiaRequestError;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
