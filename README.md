# MIA Effect SDK

An **Effect 4 TypeScript SDK for MIA / LYA**, following the operation-oriented
approach of [Distilled](https://distilled.cloud/).

This is an initial integration SDK built from the supplied MIA Postman collection
and interfaces recovered from public LYA application assets. It is not an official
MIA, LYA or Distilled package. Its transport and fixtures are tested; live
authentication, tenant permissions and insurance transactions require validation
against an authorized MIA/LYA environment.

## What is included

| Surface | Contents |
| --- | --- |
| Curated SDK | **58 operations** across pricing/projects, quotes, subscription, contracts, documents, customers, reference data, tasks and signatures |
| Observed API catalogue | **1,707 operation variants**, representing **1,696 distinct method/path pairs**; query and response variants are retained |
| Generated callable surface | **1,628 request mappings** and **35 streaming mappings**, with typed parameter slots and explicit wire bodies |
| Remaining evidence | **44 catalogue-only variants** and **35 unresolved call sites**, with reasons instead of invented signatures |
| Frontend metadata | 99 code-bearing constants, 80 code categories, 306 templates, 425 named and 251 inline UI validation schemas |
| Runtime | Native Effect HttpClient, Layers, typed failures, runtime schemas, redacted credentials, tracing, cancellation, NDJSON and byte streams |

The curated operations overlap the catalogue; the two counts should not be added.
The broad catalogue describes the observed LYA applications, which are wider
than MIA's supplied integration collection. A callable mapping means the SDK can
construct the observed request; it does not establish authorization or successful
server acceptance.

## Develop and verify

Use Node 24+ and the pnpm version pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm generate:check
pnpm check
pnpm test
pnpm build
```

The package is `packages/sdk`, named `@mia/sdk`. It is intentionally not published
to npm by this repository. Use it as a workspace dependency, or build a local
tarball:

```sh
pnpm build
pnpm --filter @mia/sdk pack --pack-destination ./artifacts
```

Then install the resulting tarball and a compatible Effect 4 in your application.
The library declares Effect as a peer dependency so it shares your application's
Effect installation.

## Read a project

The service base URL includes the API root. For example, a supplied platform
prefix ending in `/lyaptf/api` is combined with `/v1/parcours/projet/...`.
Configuration has no default production host.

```ts
import { Config, Effect } from "effect";
import { Credentials, makeMiaLayer, Parcours, Schemas } from "@mia/sdk";

const program = Effect.gen(function* () {
  const baseUrl = yield* Config.String("MIA_PLATFORM_API_URL");
  const token = yield* Config.Redacted("MIA_TOKEN");
  const id = yield* Config.String("MIA_ENCODED_PROJECT_ID");

  const MiaLive = makeMiaLayer(
    { services: { platform: { baseUrl, credential: "mia" } } },
    { mia: Credentials.bearer(token) },
  );

  return yield* Parcours.readProject(Schemas.encodedProjectId(id)).pipe(
    Effect.provide(MiaLive),
  );
});

const project = await Effect.runPromise(program);
```

The equivalent read-only runnable example is in
[`packages/sdk/examples/read-project.ts`](packages/sdk/examples/read-project.ts).
After `pnpm test` compiles it, an explicitly configured environment can run
`node packages/sdk/dist-test/examples/read-project.js`.

### Machine credentials

The collection's pre-request script sends JSON `{clientId, clientSecret}` to the
configured `identityUrl` and reads `body.token`. The SDK implements that contract:

```ts
import { Redacted } from "effect";
import { Credentials, makeMiaLayer } from "@mia/sdk";

const MiaLive = makeMiaLayer(
  { services: {
    platform: { baseUrl: platformApiUrl, credential: "mia-machine" },
  } },
  { "mia-machine": Credentials.machine({
    identityUrl: exactTokenEndpoint,
    clientId: Redacted.make(clientId),
    clientSecret: Redacted.make(clientSecret),
  }) },
);
```

The variables above are supplied by your application's configuration. The
identity URL is the complete token endpoint, not an inferred OAuth path. The
Postman environment does not specify its value or a token lifetime. Concurrent
authentication shares a cached token; use `MiaCredentials.invalidate(name)` for
explicit invalidation. A failed business request is never automatically replayed
after authentication.

Credentials are assigned to each service explicitly. A platform credential is
not implicitly sent to document, signature, public-form or other service hosts.
Use the service prefixes and authentication arrangements provided for your tenant.

## Curated services

Import a namespace from `@mia/sdk`, or a module such as
`@mia/sdk/services/documents`.

| Namespace | Main operations |
| --- | --- |
| `Parcours` | Price products, create a quote/project, read by encoded project ID |
| `Projects` | Read state, initialize/save/validate/transmit subscription, manage administration, transform to an internal contract |
| `Quotes` | Read/list, select proposals, choose a quote, start/control carrier subscription, activate an administrator |
| `Contracts` | Read/search/save, list for a customer, stream paginated search results |
| `Documents` | Generate documents/payroll sheets, resolve downloads, list and validate project/contract documents |
| `Customers` | Create/read customers and search people/companies |
| `Reference` | Insurers and supplied codification lookup |
| `Tasks` | Save tasks while preserving the collection's unresolved literal field names |
| `Signatures` | Project signature actions, procedure state, initiation/reminders/abandonment, proof and uploads |

See [`docs/CURATED_API.md`](docs/CURATED_API.md) for all methods, paths, request
encodings and response types. Client decoder snapshots are in
[`spec/curated-schema-snapshots.json`](spec/curated-schema-snapshots.json).

### Policy numbers and payroll setup sheets

The SDK keeps these identifier domains separate:

- `EncodedProjectId`: integration lookup identifier.
- `ProjectNumber`: internal project workflow number.
- `QuoteNumber`: a quote's `numeroInterne`.
- `ContractId`: the internal LYA contract identifier.
- `PolicyNumber`: `numeroCompagnie`, the insurer policy/contract reference.

`Documents.generatePayrollSheet(projectNumber)` reproduces the main application's
`FICHE_PARAMETRAGE_PAIE` document request. The separate
`Documents.generateEnterprisePayrollSheet(quoteNumber)` takes the **selected
quote's ID** and returns the enterprise document link.

The payroll document content was not retrieved. These are observed setup/payroll
document routes, not a claim that the output is a standardized DSN file.

### Workflow actions

Subscription, signature transmission, administrator activation and internal
contract transformation are separate operations. Their order can vary by tenant
and product. The SDK does not infer that transforming a record or receiving a
policy-number field proves carrier acceptance.

Some actions use **GET** upstream, including choosing a quote and initiating
carrier subscription. All SDK operations execute without automatic retries. See
[`ADR 0003`](docs/adr/0003-actions-and-retries.md).

### Pagination

`Contracts.stream(search)` returns an Effect `Stream<Contract, MiaError, MiaClient>`
and requests pages as needed. It uses the observed `content`/`totalElements`
response shape and zero-based `pageNumero`. An empty page ends consumption even
when the reported total is stale.

## Use the wider observed API

The generated surface is deliberately an advanced API. The operation ID, path
and query slots are typed; incomplete DTOs remain `unknown`. Body encoding is
explicit, including the many frontend calls that pass an opaque value to fetch.

```ts
import { Schema } from "effect";
import * as Observed from "@mia/sdk/observed";

const readInternalProject = Observed.request(
  "platform_get_lyaptf_api_courtage_projet_lire_param_56d354e0",
  { params: { p1: "PROJECT_NUMBER" } },
  Schema.Struct({ numero: Schema.String }),
);
```

Without the third argument, the result type is `unknown`. Supplying your own
decoder validates the returned DTO; configure it to preserve extra fields if you
need them. For calls with bodies, use `Body.json(...)`,
`Body.text(..., "application/json")`, `Body.formData(...)` or `Body.none()` as
appropriate for the recorded request. The SDK does not guess how an opaque body
was encoded.

`Observed.stream(id, input, decoder?)` supports the recorded NDJSON and raw byte
stream routes. NDJSON decodes one record at a time; byte streams return
`Uint8Array` chunks. Ending consumption closes the response. Entries with
conflicting response modes, unresolved query construction or SSE framing remain
catalogue-only; define an operation explicitly once the missing contract is
established.

`Observed.catalogue` contains every normalized variant, including excluded ones.
The full [`spec/observed-endpoints.json`](spec/observed-endpoints.json) additionally
records request expressions, observed fields, authentication markers, source
hashes, offsets and execution limitations. `@mia/sdk/codes` exports observed
literal code values grouped by category; those lists are not exhaustive server
enums.

## Errors and extension fields

Failures use separate tags: `MiaConfigurationError`, `MiaAuthenticationError`,
`MiaTransportError`, `MiaHttpError`, `MiaEnvelopeError`, `MiaProtocolError`,
`MiaSchemaError` and `MiaRequestError`.

An HTTP 200 response containing `success:false` is an application failure for
enveloped platform calls. Public-form responses retain their separate raw
JSON/text contract. Request and response schemas validate known fields while
curated object models retain unknown extension fields. Dates and code values
remain wire strings; misspelled source keys are preserved.

Error response payloads and schema diagnostics are held in `Redacted` values.
Avoid logging full insurance records or unwrapping diagnostics into general
application logs. Operation spans identify the operation, service and method.

## Evidence and regeneration

- [`docs/REVERSE_ENGINEERING.md`](docs/REVERSE_ENGINEERING.md): workflow findings,
  identifier semantics, policy references and payroll-sheet evidence.
- [`docs/EXTRACTION.md`](docs/EXTRACTION.md): extraction scope, source acquisition,
  static parsing and reproduction commands.
- [`spec/source-manifest.json`](spec/source-manifest.json): source URLs and hashes.
- [`spec/unresolved-calls.json`](spec/unresolved-calls.json): unresolved expressions
  and why no request mapping was invented.
- [`spec/frontend-metadata/`](spec/frontend-metadata/): structured frontend
  templates, enums, discriminator and validation evidence.
- [`docs/adr/`](docs/adr/): architecture and protocol decisions.

`pnpm generate` regenerates SDK catalogue/code constants from the checked-in
evidence. A source re-extraction is a separate explicit step. Downloaded
application bundles and the original uploaded Postman collection are not part of
this repository.

## Validation status

The local suite checks request wire shapes, full sanitized saved-response
round-trips, unknown-field preservation, identifiers, pagination, authentication,
typed error handling, streams and cancellation. Tests use mocks and synthetic
credentials. CI repeats the generation check, TypeScript check, tests and build
without insurance credentials.

Before using write operations against a live tenant, establish the exact service
URLs, authentication scopes, authoritative payload schemas and product workflow
requirements in an authorized test environment. The initial PR is a draft so
those integration findings can be reviewed separately from the SDK mechanics.
