# MIA / LYA API findings

This SDK combines the supplied integration collection with static analysis of
public browser assets retrieved on 2026-11-10. No discovered insurance operation
was invoked during development. Source locations, hashes and call-site offsets
are recorded in the discovery files under `spec/`.

## What the evidence establishes

The integration collection covers pricing, quote/project creation, an encoded
project lookup, customer creation/read, contact search, reference data and task
creation. Its root pre-request script posts `{clientId, clientSecret}` to the
configured `identityUrl` and reads `response.body.token`. The supplied environment
values are empty. Token lifetime and refresh behavior are not documented there.

The main browser application contains additional project, subscription,
administrator-management, contract, document and signature operations. These are
frontend-observed contracts. Machine-token access, tenant entitlements and
production compatibility have not been validated.

The official [MIA case study](https://www.lyaprotect.com/ressources/cas-usage/mia-assurances)
describes a collective-insurance process that includes quote documents,
application signature, final contract documents and transmission to an
administrator through an API. That is supporting business context, not technical
authorization or a specification for the recovered routes.

## Quoting and contracting

Paths in this table are relative to the platform API root, normally `/lyaptf/api`.

| Method | Path | Observed purpose |
| --- | --- | --- |
| POST | `/v1/parcours/tarif` | Price one or more supplied product/risk requests |
| POST | `/v1/parcours/devis` | Create a quote/project from the supplied collection payload |
| GET | `/v1/parcours/projet/{encodedProjectId}` | Read the integration project representation |
| GET | `/courtage/projet/devis/lister/{projectNumber}` | List project quotes |
| GET | `/courtage/projet/choisir/{quoteNumber}` | Choose a quote; **mutates state** |
| PUT | `/courtage/projet/souscrire/{projectNumber}` | Enter the subscription stage |
| POST | `/courtage/projet/souscription/initier/{projectNumber}` | Initialize subscription information |
| GET | `/courtage/projet/souscription/lire/{projectNumber}` | Read subscription information |
| POST | `/courtage/projet/souscription/enregistrer/{projectNumber}` | Save subscription information |
| PUT | `/courtage/projet/souscription/valider/{projectNumber}` | Validate the subscription step |
| POST | `/courtage/projet/souscription/transmettre/{projectNumber}` | Transmit subscription information; body is a JSON boolean |
| GET | `/scrapping/projet/souscrire/{quoteNumber}/false` | Start the carrier subscription action; **mutates state** |
| GET | `/scrapping/projet/souscrire/manuel/{quoteNumber}` | Start the manual carrier-subscription flow; **mutates state** |
| PUT | `/scrapping/projet/mettreEnGestion/{quoteNumber}` | Start administrator activation; body is a raw comments string |
| PUT | `/courtage/projet/souscription/transformer/{projectNumber}` | Create/link the internal LYA contract |

The browser routes above use a project **number**, or a quote's `numeroInterne`.
They do not use the encoded project ID used by the integration lookup.

`transformer` consumes policy-reference, effective-date, renewal and premium
fields and returns internal contract references used by the UI. This does not by
itself prove that a carrier accepted or bound the risk. A policy field may be
manually editable or temporarily populated; reconcile state as well as the value.

## Policy numbers and references

| Field | Meaning established by the UI |
| --- | --- |
| `numeroInterne` | LYA internal contract ID |
| `numeroCompagnie` | Insurer contract/policy number |
| `assureNumero` | Insurer customer or insured reference |
| `adhesionNumero` | Membership reference |
| `risqueDetaille.delegataireNumero` | Administrator reference |
| `numeroContratGestionnaire` | Contract number in the management workflow |
| `numeroCourtier` | Broker reference |

Contract read is `GET /courtage/contrat/lire/{contractId}`. Contract search is
`POST /courtage/contrat/rechercher` with `criteres`, `pageNumero`, `nbParPage` and
`ordres`; the UI consumes `content` and `totalElements`. The field `contratLie` is
not treated as an insurer policy number: its meaning is overloaded across callers.

## Payroll setup sheets

Two separate routes were found.

The main broker application posts this body to `/documents/generer`:

```json
{
  "stockage": false,
  "typeDocument": "FICHE_PARAMETRAGE_PAIE:TYPE_DOCUMENT_GENERE",
  "typeNumero": "PROJET_NUMERO",
  "numero": "PROJECT_NUMBER",
  "test": false
}
```

The UI labels the document “Fiche Information paie”. The visible feature is gated
by collective-project state, a selected quote, tenant feature configuration and
the insurer (1SURE or CIPRES). The caller reads `fileName`; the document service
can resolve that filename through its download endpoint.

The enterprise application also calls
`GET /assure/projet/parcours/genererFicheParametragePaie/{quoteNumber}` on the
platform API. Despite `projet` in the path, its caller passes the **selected
quote's `numeroInterne`**. It consumes `response.data.body.value` as a document
link. These routes are not interchangeable.

Neither document's content was downloaded. A payroll-information/setup document
is established; a standardized DSN setup file, its fields and its compliance
requirements are not.

## Signatures and workflow order

The platform has project-specific adhesion signature routes; the signature
service has procedure read/initiation/reminder/abandonment/proof and participant
operations. An operation whose source name contains `init` may reset or cancel
an existing project signature state: names alone are not enough to infer effects.

The public application contains configuration for administration before
contractualization and product-specific automatic management. It also has
special conditions for some 1SURE collective products and delegated/background
subscription. Consequently the SDK exposes steps without asserting one universal
order or starting a complete purchase workflow on behalf of the application.

## Extraction scope and limits

- Public app assets were parsed as syntax, not executed.
- Source offsets from the AST catalogue use zero-based JavaScript UTF-16 indices.
  Older narrow research files explicitly label Python Unicode character offsets.
- Full proprietary application bundles are not included in the repository.
  The manifests and extraction tools support retrieval and re-analysis.
- The catalogue records observed client routes, including duplicate call sites,
  unresolved dynamic URLs and non-JSON protocols separately.
- UI defaults and Yup rules are reference evidence; they are not authoritative
  server-side requiredness or complete DTO specifications.
- Public portal login bundles do not reveal APIs hidden behind authenticated,
  lazy-loaded application routes. Backend-only endpoints are outside this evidence.
- Tests use synthetic responses and the collection's saved shapes. No claim of
  successful live MIA authentication, carrier binding or policy issuance is made.

For exact counts and supported operation names, see the generated catalogue and
the SDK README. For design decisions, see `docs/adr/`.
