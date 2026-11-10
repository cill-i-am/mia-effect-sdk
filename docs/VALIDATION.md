# Initial SDK validation

Recorded on 2026-11-10. This records local SDK and source-extraction validation;
it is not a report of live MIA/LYA integration testing.

## Environment

- Node 24.22.1
- pnpm 11.25.0
- TypeScript 7.0.2
- Effect 4.1.2 (exact development version; peer range `^4.1.2`)
- Acorn 8.19.0

Effect 4.1.2 was selected because the newer same-day release did not meet pnpm's
normal release-age policy. The repository contains no release-age exception.
A fresh resolution and a subsequent frozen-lockfile install both succeeded.

## Checks performed

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed with the normal policy |
| `pnpm generate:check` | Catalogue/constants current; structural source-spec invariants passed |
| `pnpm check` | Strict TypeScript checks passed, including tests and the runnable example |
| `pnpm test` | 40 tests passed; no failures or skipped tests |
| `pnpm build` | ESM JavaScript, declarations and source maps emitted |
| `node scripts/generate-curated-reference.mjs --check` | Reference and 57 named schema snapshots match the 58 descriptors |
| Source validation with the downloaded source directory | SHA-256 hashes and exact UTF-16 call-site locations passed |
| `pnpm --filter @mia/sdk pack --pack-destination ./artifacts` | Local tarball created with compiled SDK and source |
| Public fixture review | 69 nonempty sensitive collection fields compared; zero original values retained at matching paths |

## Test coverage that matters for this protocol

The tests validate different request body encodings: JSON arrays/objects, JSON
booleans, unquoted text with JSON Content-Type, absent bodies and multipart
uploads. They check the two payroll generators use different identifier domains,
that quote choice preserves existing discriminator values, and that supplied
wire spellings and unusual criterion values survive round-trips.

The saved pricing and project response shapes are sanitized fixtures. They
decode and re-encode without losing unknown fields, including nested extensions.
Contract pagination requests only the required pages and stops on an empty page
despite a stale total.

Transport checks distinguish HTTP failure, application-envelope rejection,
malformed JSON, schema failure and request failure. They verify that HTTP 200
with `success:false` fails for envelope APIs, while the public-form raw-response
contract remains separate. No retry or authentication replay occurs for mutating
GET requests or ambiguous failures.

Authentication checks reproduce the collection's machine-token request and
`body.token` selection, coalesce concurrent initial authentication, verify
explicit invalidation, and prevent implicit token reuse across unconfigured
services. Credentials and retained diagnostics are redacted.

Cancellation is tested before response headers and during consumption. NDJSON
tests split UTF-8 sequences and records across transport chunks, include an
unterminated final line, and distinguish malformed data from a DTO schema error.
Early termination of byte streams closes the response.

## What remains for integration validation

No insurance business endpoint or machine-auth endpoint was invoked. The SDK
therefore does not establish credentials, entitlements, complete DTO schemas,
product workflow requirements, token lifetime, carrier binding, policy issuance,
signature delivery or the contents of generated payroll documents.

Obtain the tenant's exact service URLs and an authorized test account, then
validate one read-only operation from each intended service before validating
the relevant product workflow. Preserve sanitized fixtures and source provenance
when strengthening schemas or changing operation behavior.
