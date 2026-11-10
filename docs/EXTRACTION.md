# Reproducing the observed API catalogue

The catalogue is reconstructed from public frontend source and the supplied Postman collection. It records request interfaces that the inspected clients construct. It does not claim to describe every backend route, establish server validation rules, or prove that a particular integration credential can call a route.

The application bundles are parsed as JavaScript syntax. They are never evaluated by these scripts. The acquisition step fetches explicit static asset URLs; it does not authenticate, submit a quote, generate a document, start a signature, send a message, or call any other business endpoint.

## Files and responsibilities

| File | Purpose |
| --- | --- |
| `spec/source-manifest.json` | Explicit source URLs, cache locations, SHA-256 hashes, discovery provenance, and analysis scope. |
| `spec/observed-endpoints.json` | Normalized operations, service roots, request observations, response modes, source locations, and coverage counts. |
| `spec/unresolved-calls.json` | Calls that cannot be converted conservatively into a fixed business request, plus excluded generic transport implementations. |
| `scripts/download-public-sources.mjs` | Downloads only manifest-listed static assets and checks their hashes. |
| `scripts/index-public-sources.cjs` | Uses Acorn to index declarations, function scopes, assignments, and known HTTP client callsites. |
| `scripts/extract-observed-api.cjs` | Resolves service aliases and URL expressions, records request and response semantics, and deduplicates operations. |
| `scripts/validate-observed-spec.cjs` | Checks catalogue consistency and, when supplied source files, verifies bytes and call locations. |
| `scripts/generate-sdk.mjs` | Produces the TypeScript catalogue consumed by the advanced observed-operation API. |

The original bundles and private Postman examples are not distributed with the SDK. The generated files retain interface facts and narrow request expressions. `.cache/` is ignored by Git.

## Rebuild the recorded snapshot

Use the Node and pnpm versions declared by the workspace. Acorn is pinned to `8.19.0` in the root development dependencies and lockfile.

```sh
pnpm install --frozen-lockfile
node scripts/download-public-sources.mjs
```

The downloader uses plain HTTPS GETs, without SDK credentials or browser cookies. It checks each result against the recorded SHA-256 hash and rejects redirects and changed assets. A changed hash means the source release must be reviewed explicitly; the script does not silently treat a different release as the recorded one.

The original user-supplied collection is required to reproduce the merged catalogue. Place it at the path printed by the downloader:

```sh
cp /path/to/original-postman-collection.json .cache/sources/supplied-postman.json
```

Then run the static pipeline:

```sh
node --max-old-space-size=4096 scripts/index-public-sources.cjs
node --max-old-space-size=4096 scripts/extract-observed-api.cjs
node scripts/validate-observed-spec.cjs --source-dir .cache/sources
node scripts/generate-sdk.mjs
```

The indexer and extractor accept `--source-dir`, `--index-dir`, and `--manifest`. The extractor also accepts `--out-dir`; the validator accepts `--spec-dir` and `--source-dir`. This allows rebuilding in a separate directory and reviewing a diff before replacing checked-in interface metadata.

Recorded asset URLs may eventually stop being available. Preserve an authorized local cache when long-term reproduction of this release matters. A hash identifies the exact inspected bytes; it cannot make an upstream asset permanently available.

## What the resolver does

The resolver follows lexical declarations and enclosing function scopes. It handles string literals, template literals, string concatenation, `.concat(...)`, local URL variables, runtime service-base lookups, and simple pure route factories with argument substitution. It also handles finite conditional URL variants, compacted path arrays, URLSearchParams object literals, explicit URI encoding, and the observed optional query-string append pattern.

Unknown values inside a known route become positional parameters such as `p1` and `q1`. Each parameter preserves its original source expression, encoding operation, and enclosing function parameters. For example, a generic parameter may correspond to `e.numeroInterne`, `encodeURIComponent(t)`, or an expression that converts a date to epoch seconds. Supplying a positional parameter means supplying that expression's resulting value; the SDK does not evaluate the application expression.

An entire unknown URL is not converted into a wildcard business endpoint. Returned download URLs, data URLs, arbitrary document locations, unrecognized external origins, and unresolved generic fetch wrappers remain in the unresolved report. The public customer portal's login server action is recorded there as a server-action reference, not represented as a stable REST endpoint.

Operations are deduplicated by service, method, and canonical path/query template. Placeholder names are normalized by position; each original expression remains attached to its source evidence. Different static query variants can therefore create more operation records than distinct method/path pairs.

## Source locations and checks

JavaScript locations use **zero-based UTF-16 string offsets**, matching Acorn and JavaScript string slicing. They are not UTF-8 byte offsets. Postman evidence uses JSON pointers because it originates from structured collection data.

With `--source-dir`, the validator checks the SHA-256 of the actual input files. For every normalized JavaScript call it then slices the original source at the recorded offsets, verifies the callee, and verifies that the URL expression occurs in that exact call. Catalogue validation also checks unique operation IDs, canonical deduplication keys, sorted placeholder/parameter mappings, service-prefix stripping, and coverage arithmetic.

The integration checks include the ordinary contract read, document generation, payroll-sheet generation, mail attachment URL factory, platform NDJSON route, byte-stream mode, public-form authentication prefix, and the supplied pricing request. These checks exercise important normalization boundaries. They do not send those requests.

## Service roots

An evidence `pathTemplate` includes the complete observed service prefix. `sdkPathTemplate` is relative to the service URL that the SDK expects you to configure.

| SDK service | Configured URL prefix |
| --- | --- |
| `platform` | Platform origin plus `/lyaptf/api` |
| `platformFlux` | Platform origin plus `/lyaptf/flux` |
| `platformFile` | Platform origin plus `/lyaptf/file` |
| `ged` | GED origin plus `/lyaGed/api` |
| `signature` | Signature origin plus `/lyasign/api` |
| `messaging` | Messaging origin plus `/lyamsg/api` |
| `forms` | Form origin plus `/lyaform` |
| `insuredPortal` | Insured-portal origin plus `/lyaptfassure/api` |

Other service prefixes are recorded in the service metadata. The forms root deliberately stops at `/lyaform`, because observed routes include both `/api/...` and `/auth/...`. Mail operations include `/api/...` and `/file/...`, so their configured service URL is the mail origin.

The manifest's public frontend uses PRO defaults. The supplied collection contains a PPR platform URL. These observations do not establish environment equivalence or shared permissions. The SDK uses explicit service configuration and named credentials; source discovery does not choose an environment or credential for the caller.

## Request and response observations

Request bodies have an observed encoding, expression, and any directly visible field names. `json` means serialization is visible in the source. `form-data` means a FormData construction or the explicit upload helper is visible. `opaque` means a value is passed through unchanged and its wire encoding cannot be established from that declaration alone. It could be a raw filename, already serialized JSON, or a multipart body. The advanced API requires a tagged `Body` value so the caller makes that choice explicitly.

Observed fields do not assert that the server requires them. UI validation rules and supplied examples are separate evidence, and must not be promoted automatically into an authoritative server schema. Sample personal data and credential values from the collection are omitted.

| Source transport | Recorded response mode | Interpretation |
| --- | --- | --- |
| `myFetch` | `envelope-body` | Parse a LYA success envelope and return its `body`. |
| `simpleApiFetch` | `json` | Return parsed JSON without the envelope-body selection. |
| `fetchFile` | `blob` | Read a buffered binary response; SDK mapping is buffered bytes. |
| `fetchFlux` | `ndjson` | Parse newline-delimited JSON records incrementally. |
| `fetchStream` | `byte-stream` | Deliver raw byte chunks incrementally. |
| Public adhesion form client | `json-or-text` | Parse JSON by Content-Type; otherwise preserve exact boolean literals or text. |
| Event-source hook | `sse` | Server-sent events; retained as observed metadata until an explicit SSE transport is selected. |

`executable` describes the buffered request mapping. `streamExecutable` separately identifies supported NDJSON or byte-stream mappings. Multiple response modes on one canonical route, dynamic query fragments, custom auto-assignment status handling, and unresolved response handling require an explicit operation definition. These flags describe known client transport mechanics; they do not imply successful backend access or verified DTO schemas.

The `effect` field is a conservative, name-based inference. Some observed GET routes generate documents, transmit projects, or start workflow actions. The field is metadata only and never causes automatic retries or an assumption that a GET is harmless.

## Snapshot coverage

The recorded snapshot contains **1,735 normalized callsites**, producing **1,707 canonical operations** and **1,696 distinct method/path pairs** when query variants are ignored. There are **35 unresolved callsites** and **6 excluded generic transport implementations**. The exact per-source and per-service counts are stored in `observed-endpoints.json`.

All 1,577 main-client helper invocations are accounted for: 1,576 resolve to a rooted operation, while the generic external-document download helper remains unresolved. The main client additionally contributes two native business fetches and the SSE hook. Supplemental evidence includes the enterprise app, adhesion/EER forms, general public forms, the public customer login shell, and the 18 supplied Postman request examples.

The collection's token pre-request script is also accounted for. It sends `clientId` and `clientSecret` and reads `body.token`, but its `identityUrl` variable is unset. That call stays unresolved; the extractor does not invent a token URL.
