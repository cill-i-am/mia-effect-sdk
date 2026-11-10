# ADR 0002: Preserve evidence and distinguish inferred contracts

Status: accepted for the initial SDK implementation

## Context

Browser source identifies many more operations than the supplied integration
collection. It proves that the client builds a particular request. It does not
prove that a MIA machine token can invoke it, that a payload is complete, or that
the service returned the shape expected by the frontend.

The original collection also contains JSON-with-comments, sparse saved
responses and empty environment variables. Frontend validation rules may be
conditional on the product, tenant, state or user role.

## Decision

Maintain a normalized discovery specification with source hashes, source offsets,
method, service, path, body expression, response handling and confidence. Retain
unresolved expressions in a separate report. Generate the broad operation index
from this specification; maintain curated schemas and business names explicitly.

Do not turn UI-required fields into universal server requirements. Do not turn a
single saved response into a closed-world enumeration. Preserve additional
response fields and use unknown types where evidence stops.

Keep identifier types separate:

| Identifier | Evidence and purpose |
| --- | --- |
| Encoded project ID | Supplied `/v1/parcours/projet/{id}` integration lookup |
| Project number | Main application project, subscription and management routes |
| Quote number | `devis.numeroInterne`, including quote choice and enterprise payroll sheet |
| Contract ID | LYA `numeroInterne`, internal contract lookup |
| Insurer policy number | `numeroCompagnie`, separate from LYA's contract ID |
| Public form context | Form URL/session context; equality with other project identifiers is unproven |

The full discovery catalogue is an advanced interface. It must not conceal
unknown encodings, stream protocols or incomplete path expressions behind a
plausible JSON function. Such entries remain available as evidence until the
necessary mapping is supplied or validated.

## Consequences

The SDK supports progressive strengthening: a successful sandbox fixture or an
official schema can replace a partial shape without rewriting its provenance.
Coverage numbers distinguish call sites, normalized routes and executable SDK
operations. They do not claim to describe every server endpoint.
