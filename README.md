# MIA Effect SDK

Use TypeScript and Effect 4 to price insurance, start a quote's subscription,
read insurer references stored in LYA, and generate LYA payroll information
sheets. The SDK wraps MIA / LYA interfaces with named operations, runtime schemas,
typed failures, and injectable HTTP and credential services. Its operation-based
design follows
[Distilled](https://distilled.cloud/).

The SDK combines the supplied MIA Postman collection with interfaces recovered
from public LYA application code. It is an unofficial integration package.
Local tests verify the SDK's behavior with mocks and sanitized fixtures. Access
with MIA credentials, completed insurance purchases, and generated document
contents still need validation in an authorized test environment.

## Supported insurance operations

The three requested insurance workflows have different levels of coverage:

| Task | SDK entry point | Result |
| --- | --- | --- |
| [Purchase insurance](#purchase-insurance) | `Quotes.subscribeWithInsurer(quoteNumber)` | Starts LYA's observed insurer subscription action; product support and final binding remain unverified |
| [Retrieve a policy number](#retrieve-a-policy-number) | `Contracts.read(contractId)` | Reads insurer references stored on a LYA contract; Henner issuance and synchronization remain unverified |
| [Generate a LYA payroll information sheet](#get-a-scheme-setup-sheet) | `Documents.generatePayrollSheet(projectNumber)` or `Documents.generateEnterprisePayrollSheet(quoteNumber)` | Requests a LYA payroll information sheet and returns a filename or document URL; equivalence to Henner's DSN/FPOC sheet remains unverified |

These calls return lazy Effects. A request runs when you execute the Effect with
a configured client. The [setup example](#get-started) shows how to provide one.

### Purchase insurance

To start the subscription action observed in LYA for a selected quote, call
`Quotes.subscribeWithInsurer(quoteNumber)`. It sends this request on the
`platform` service:

```http
GET /lyaptf/api/scrapping/projet/souscrire/{quoteNumber}/false
```

`quoteNumber` is the selected quote's `numeroInterne`, represented by
`Schemas.QuoteNumber`. It is distinct from the project number and the encoded
project ID used by the Postman integration.

The launch response has no established result schema, so the SDK returns
`unknown`. The application reloads the quotes to inspect subscription state.
Use `Quotes.read(quoteNumber)` or `Quotes.listForProject(projectNumber)` to read
that state; successful request completion alone does not establish policy
issuance. Support for a particular MIA product and the point at which cover
becomes bound still need validation.

The SDK exposes the surrounding operations separately:

| Action | SDK method |
| --- | --- |
| Choose the quote | `Quotes.choose(quoteNumber)` |
| Enter the subscription stage | `Projects.enterSubscription(projectNumber)` |
| Initialize or save application details | `Projects.initializeSubscription(projectNumber)` / `Projects.saveSubscription(projectNumber, subscription)` |
| Validate or transmit the subscription | `Projects.validateSubscription(projectNumber)` / `Projects.transmitSubscription(projectNumber, isUsingWebApp)` |
| Create the adhesion signature procedure | `Signatures.createForAdhesion(projectNumber)` |
| Start administrator activation | `Quotes.activateAdministrator(quoteNumber, comments)` |
| Create or link the internal contract | `Projects.transformToContract(projectNumber, transformation)` |

This table lists available actions, not a fixed execution sequence. Product and
tenant configuration determine the required details, signatures, and order.
`transformToContract` can create or link an internal LYA record using an entered
insurer reference; it does not independently establish carrier acceptance.

Quote choice and insurer subscription use **GET requests that change state**.
The SDK does not retry business requests or replay them after authentication.
Read the [subscription and signature findings](docs/REVERSE_ENGINEERING.md)
and [action/retry decision](docs/adr/0003-actions-and-retries.md) before composing
a product workflow.

### Retrieve a policy number

To read a contract, call `Contracts.read(contractId)`. It sends this request on
the `platform` service:

```http
GET /lyaptf/api/courtage/contrat/lire/{contractId}
```

Pass the internal LYA contract ID as `contractId`. Read the stored insurer
reference from **`contract.numeroCompagnie`** in the SDK result. The equivalent
field in the HTTP response is `body.numeroCompagnie`; the SDK unwraps `body`.
Check for an absent, `null`, or empty value before using the reference.

This field is editable in LYA and can be supplied when creating or linking the
internal contract. A stored value does not establish final Henner issuance.
Automatic synchronization of policy references from Henner remains unverified.

The contract carries several identifiers with different purposes:

| Field | Meaning |
| --- | --- |
| `numeroInterne` | Internal LYA contract ID, used in the read URL |
| `numeroCompagnie` | Insurer policy/contract reference stored in LYA |
| `adhesionNumero` | Membership or enrollment reference |
| `assureNumero` | Insurer's reference for the insured |
| `risqueDetaille.delegataireNumero` | Administrator reference |

If you need to locate the contract, use `Contracts.search(request)`, which returns
`content` and `totalElements`. `Contracts.listForCustomer(customerNumber)` also
exists, but its response shape remains `unknown`. An entered policy reference
can be temporary; confirm the contract's state as well as its reference.
See the [contract API reference](docs/CURATED_API.md#contracts).

### Get a scheme setup sheet

The SDK exposes two flows for generating a LYA payroll information sheet, called
**Fiche Information paie** in the main application. Its equivalence to Henner's
DSN/FPOC setup sheet has not been established. Use the flow supported by your
tenant and product.

#### Generate from a project

Configure both `platform` and `ged` before using this flow. Their API roots
include `/lyaptf/api` and `/lyaGed/api`, respectively. Assign an authorized
credential to each service explicitly.

1. Call `Documents.generatePayrollSheet(projectNumber)` with the internal
   project number. The helper sends `POST /lyaptf/api/documents/generer` with
   the payload below.
2. If the result contains a nonempty `fileName`, pass it unchanged to
   `Documents.resolveDownload(fileName)`. If it does not, handle the missing
   filename before requesting a download. The resolver sends the filename as
   raw text to `POST /lyaGed/api/documents/download/NULL` and returns
   `{ value: downloadUrl }`.

The generation helper supplies this payload, with `PROJECT_NUMBER` replaced by
your internal project number:

```json
{
  "stockage": false,
  "typeDocument": "FICHE_PARAMETRAGE_PAIE:TYPE_DOCUMENT_GENERE",
  "typeNumero": "PROJET_NUMERO",
  "numero": "PROJECT_NUMBER",
  "test": false
}
```

Use the returned URL to retrieve the document. In the inspected main application,
the button appears for collective projects with a selected quote, an enabled
tenant feature, and insurer code `1SURE` or `CIPRES`.

#### Generate from the enterprise flow

Call `Documents.generateEnterprisePayrollSheet(quoteNumber)`. It sends this
request on the `platform` service and returns `{ value: documentUrl }` directly:

```http
GET /lyaptf/api/assure/projet/parcours/genererFicheParametragePaie/{quoteNumber}
```

Despite `projet` in the URL, the caller passes the **selected quote's
`numeroInterne`**, not the project number.

No generated document was inspected. The routes and UI labels establish a LYA
payroll information workflow; the document's contents still need validation.
Verify that the output meets your integration's requirements. See the
[payroll document evidence](docs/REVERSE_ENGINEERING.md#payroll-setup-sheets).

### Henner portal boundary

Henner has a separate [employer portal](https://hr.henner.com/). Its public
frontend exposes separate operations to consult, download, and request reissue
of DSN setup sheets. These operations have not been tested with authenticated
access and are not included in this SDK. See the
[Henner API findings](docs/HENNER_API.md) for their routes and evidence.

LYA may integrate with Henner behind its own APIs. The observed subscription
actions, stored references, and payroll generator do not establish complete
coverage of Henner's policy issuance and DSN document workflows.

## Get started

Use Node 24 or later and the pnpm version pinned in `package.json`. The package
lives in `packages/sdk` and is named `@mia/sdk`. It is private and unpublished;
consume it as a workspace dependency or a local tarball.

From this checkout, install dependencies and build the package:

```sh
pnpm install --frozen-lockfile
pnpm build
```

To use it outside the workspace, create a tarball and install the resulting file
in your application:

```sh
pnpm --filter @mia/sdk pack --pack-destination ./artifacts
```

Install a compatible Effect version alongside the SDK. The tested development
version is Effect **4.1.2**, and the peer range is `^4.1.2`. Using a peer dependency
lets the SDK share your application's Effect installation.

### Read a project

Set `MIA_PLATFORM_API_URL` to your tenant's complete platform API root, including
`/lyaptf/api`. Set `MIA_TOKEN` to an authorized bearer token and
`MIA_ENCODED_PROJECT_ID` to the integration project's encoded ID. The SDK has no
default production host.

This example reads a project with those settings:

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

The same read-only example is in
[`packages/sdk/examples/read-project.ts`](packages/sdk/examples/read-project.ts).
After `pnpm test` compiles it, run it with your configured environment:

```sh
node packages/sdk/dist-test/examples/read-project.js
```

The SDK keeps encoded project IDs, project numbers, quote numbers, internal
contract IDs, and insurer policy numbers as distinct types. Use the matching
factory under `Schemas`; the factories validate nonempty strings and do not
convert one identifier into another. See the
[identifier reference](docs/CURATED_API.md#identifier-factories).

### Configure machine credentials

The Postman pre-request script sends JSON `{clientId, clientSecret}` to
`identityUrl` and reads `body.token`. To use that flow, configure a machine
credential with the complete token endpoint supplied for your tenant:

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

Supply `platformApiUrl`, `exactTokenEndpoint`, `clientId`, and `clientSecret`
through your application's configuration. The collection leaves the identity
URL unset and does not document token lifetime. Concurrent authentication shares
a cached token; use the `MiaCredentials` service's `invalidate(name)` method for
explicit invalidation.

Assign credentials to each service. A `platform` credential is not implicitly
sent to document, signature, public-form, or other service hosts. Use your
tenant's service URLs and authentication arrangements when adding those services.

## API coverage

The curated SDK has **58 operations** across these namespaces:

| Namespace | Main operations |
| --- | --- |
| `Parcours` | Price products, create a quote/project, read by encoded project ID |
| `Projects` | Read state, manage subscription and administration, create/link an internal contract |
| `Quotes` | Read/list, select proposals, choose a quote, start/control insurer subscription |
| `Contracts` | Read/search/save, list for a customer, stream paginated search results |
| `Documents` | Generate LYA documents/payroll information sheets, resolve downloads, list and validate documents |
| `Customers` | Create/read customers and search people/companies |
| `Reference` | List insurers and look up codifications |
| `Tasks` | Save the observed task payload, including unresolved literal field names |
| `Signatures` | Manage project signatures, procedures, signers, documents, and proof |

Import a namespace from `@mia/sdk` or a module such as
`@mia/sdk/services/documents`. The [curated API reference](docs/CURATED_API.md)
lists every method, path, request encoding, and response type.
[Schema snapshots](spec/curated-schema-snapshots.json) record the client decoders.

The supplied Postman collection has **18 examples covering 10 business
endpoints**. All 10 have curated SDK methods. Seven also appear in the inspected
frontend: six direct route matches and one parameterized codification route.
The three `/v1/parcours/` routes are supported from the collection; they were not
independently found in the frontend.

The broader catalogue combines both sources and records these counts:

| Evidence | Coverage |
| --- | --- |
| Observed API catalogue | 1,707 operation variants; 1,696 distinct method/path pairs, retaining query and response variants |
| Generated request/stream APIs | 1,628 request mappings and 35 streaming mappings |
| Catalogue-only variants | 44 variants whose transport or parameters need more evidence |
| Unresolved calls | 35 call sites with recorded reasons |
| Frontend metadata | 99 code-bearing constants, 80 code categories, 306 templates, 425 named and 251 inline UI validation schemas |

The 58 curated operations overlap the catalogue; do not add the counts. The
broader LYA applications expose more than MIA's supplied collection. A generated
mapping means the SDK can construct an observed request. It does not establish
that your credentials can call it or that the server accepts a particular payload.

## Use the wider observed API

The generated API types operation IDs and parameter slots. Incomplete request
and response models remain `unknown`. Supply a response schema when you have a
contract to validate, as in this example:

```ts
import { Schema } from "effect";
import * as Observed from "@mia/sdk/observed";

const readInternalProject = Observed.request(
  "platform_get_lyaptf_api_courtage_projet_lire_param_56d354e0",
  { params: { p1: "PROJECT_NUMBER" } },
  Schema.Struct({ numero: Schema.String }),
);
```

Replace `PROJECT_NUMBER` with the internal project number. Without the third
argument, the result type is `unknown`. Configure your decoder to preserve extra
fields if you need them.

For requests with bodies, choose the recorded encoding explicitly:
`Body.json(...)`, `Body.text(..., "application/json")`, `Body.formData(...)`, or
`Body.none()`. The SDK does not infer the encoding of an opaque body.

`Observed.stream(id, input, decoder?)` supports newline-delimited JSON (NDJSON)
and byte streams. NDJSON decodes one record at a time; byte streams emit
`Uint8Array` chunks. Ending consumption closes the response. Variants with
conflicting response modes, unresolved query construction, or server-sent event
(SSE) framing remain catalogue-only.

`Observed.catalogue` includes every normalized variant. The full
[observed endpoint specification](spec/observed-endpoints.json) records request
expressions, authentication markers, source locations, and execution limits.
`@mia/sdk/codes` exports observed code values by category; these are not
exhaustive server enums.

## Runtime behavior

The SDK uses Effect HttpClient, Layers, tracing, and cancellation. Curated object
schemas validate known fields and retain unknown extension fields. Dates and code
values remain wire strings, and observed misspellings remain unchanged.

Failures use separate tags: `MiaConfigurationError`, `MiaAuthenticationError`,
`MiaTransportError`, `MiaHttpError`, `MiaEnvelopeError`, `MiaProtocolError`,
`MiaSchemaError`, and `MiaRequestError`. An HTTP 200 response with `success:false`
fails for envelope APIs. Public-form responses retain their raw JSON/text format.

Credentials, retained error payloads, and schema diagnostics use `Redacted`
values. Keep full insurance records and unwrapped diagnostics out of general
application logs. Operation spans identify the operation, service, and method.

`Contracts.stream(search)` returns an Effect
`Stream<Contract, MiaError, MiaClient>`. It requests pages as needed using
`content`, `totalElements`, and zero-based `pageNumero`. An empty page ends
consumption even when the reported total is stale.

## Develop and verify

After installing dependencies, run the repository checks:

```sh
pnpm generate:check
pnpm check
pnpm test
pnpm build
node scripts/generate-curated-reference.mjs --check
```

The local suite covers request encodings, sanitized saved responses, extension
fields, identifiers, pagination, authentication, errors, streaming, and
cancellation. Tests use mocks and synthetic credentials. The CI workflow is
configured to run these checks without insurance credentials. See the
[recorded local validation results](docs/VALIDATION.md).

Before running a product workflow against a tenant, validate its service URLs,
authentication scopes, required payloads, and completion states in an authorized
test environment. The SDK tests do not establish carrier binding, policy
issuance, or the contents of the generated payroll information sheets.

## Evidence and regeneration

Use these documents to inspect or extend the recovered interfaces:

- [Reverse-engineering findings](docs/REVERSE_ENGINEERING.md): workflow behavior,
  identifiers, policy references, and setup-sheet evidence.
- [Extraction guide](docs/EXTRACTION.md): source acquisition, parsing, and
  reproduction commands.
- [Source manifest](spec/source-manifest.json): public source URLs and hashes.
- [Unresolved calls](spec/unresolved-calls.json): expressions that could not be
  mapped and the reasons.
- [Frontend metadata](spec/frontend-metadata/): templates, codes, discriminators,
  and UI validation evidence.
- [Architecture decisions](docs/adr/): operation design, evidence, and retries.

`pnpm generate` regenerates catalogue and code constants from the checked-in
evidence. Re-extracting source is a separate step described in the extraction
guide. The repository excludes downloaded application bundles and the original
uploaded Postman collection.
