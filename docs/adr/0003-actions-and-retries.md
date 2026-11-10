# ADR 0003: Never infer retry safety from HTTP method

Status: accepted for the initial SDK implementation

## Context

The main public client invokes quote selection, carrier subscription,
administration transmission and signature transmission through GET requests.
Repeating one of these calls can repeat a business action. Creating an internal
LYA contract is also distinct from confirming carrier acceptance.

## Decision

The SDK performs one request per operation execution and adds no automatic
request retries. HTTP method is not treated as proof of idempotence. Definitions
carry business-effect metadata: read, mutation or unknown.

Do not retry an action automatically after token refresh or after an ambiguous
network error. A caller can explicitly compose retry behavior for a read after
checking its semantics. An action requires reconciliation with upstream state
before any repeat; a provider-supported idempotency mechanism would need its own
validated contract.

Expose individual workflow actions. Do not provide a one-shot `purchaseQuote`
that silently chooses a quote, starts a signature procedure, contacts a carrier
and transforms a contract. The public UI has product-specific and tenant-specific
branches, including administration before or after final signature.

## Consequences

Failures remain visible. An interrupted request can have an unknown business
outcome; cancellation does not undo an upstream action. The SDK does not promise
exactly-once execution or that a populated policy-number field establishes
issuance.
