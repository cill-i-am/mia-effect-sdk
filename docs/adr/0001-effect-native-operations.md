# ADR 0001: Effect-native operations with an explicit transport

Status: accepted for the initial SDK implementation

## Context

The goal is a TypeScript MIA SDK with the programming model demonstrated by
[Distilled](https://distilled.cloud/): composable Effect operations, schemas,
typed failures and injectable dependencies. The available upstream contracts
are a supplied Postman collection and calls recovered from public LYA browser
applications. LYA has its own response envelope and several service roots.

## Decision

Use Effect 4 directly. Each curated operation is an immutable definition and an
Effect-returning function. The transport uses Effect's HttpClient, not a Promise
client wrapped after the fact. Configuration, credentials and the HTTP client
are provided through Layers. An application can replace the HTTP client in tests
without talking to an insurance service.

Keep the transport small and specific to the observed protocol. Distilled is the
design reference; this package is not an official Distilled provider and does not
claim to be an official MIA or LYA SDK. No upstream application implementation is
copied into the SDK.

Service base URLs and credential assignments are explicit. There is no default
production endpoint and no automatic cross-service credential reuse. The main
platform API root, public form root and streaming root are different resources.

## Consequences

- Operations remain lazy, cancellable and composable through Effect.
- Schema failures, network failures, HTTP failures and application-envelope
  failures can be handled separately.
- Unknown parts of a response stay visibly unknown instead of receiving invented
  types.
- Adding a provider-maintained OpenAPI specification later does not require
  replacing the transport or the application's Effect programs.

## Sources

- https://distilled.cloud/
- https://github.com/alchemy-run/distilled
- Supplied `API LYA pour MIA.postman_collection (3).json`, root pre-request script.
- Main application asset and source hashes listed in `spec/source-manifest.json`.
