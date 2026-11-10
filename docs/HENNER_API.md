# Henner API findings

Henner exposes separate broker and employer APIs. The employer frontend contains
specific operations to consult, download, and request reissue of a DSN setup
sheet. The broker frontend contains subscription submissions, contract-reference
lookups, document downloads, and links into the employer portal.

**The MIA SDK currently wraps LYA interfaces. It does not implement these Henner
APIs.** The earlier LYA findings do not establish that one MIA API account can
complete a purchase, obtain the final Henner policy reference, and download the
Henner DSN sheet.

These findings come from public frontend assets inspected on **10 November
2026**. No authentication or business API was called. Request and response
descriptions below are observations of what the frontend sends or consumes;
they are not a complete server specification or a successful integration test.

## Find the operation you need

| Requirement | What the sources establish | What still needs validation |
| --- | --- | --- |
| Purchase insurance | LYA has subscription actions. Henner MyHSC separately has subscription submission operations. | Which route the MIA product uses, prerequisites, account entitlement, and the point at which the insurer accepts and binds cover. |
| Retrieve policy numbers | LYA stores insurer references. Henner broker responses contain contract numbers; the employer API exposes several contract identifiers and a DSN contract reference. | Which identifier is required by the business, when it becomes final, and whether LYA synchronizes it automatically. |
| Retrieve the scheme setup sheet | Henner's employer frontend has explicit DSN consult/download/reissue operations and decodes the downloaded document. | Access for the relevant account and scheme, returned document format, and agreement between its references and the issued contract. |

The separate portals do not prove that LYA cannot integrate with Henner behind
its own API. They do mean that LYA's generic contract fields and payroll document
generator are insufficient evidence of complete Henner coverage.

## Identify the portal and API root

| Surface | Portal | Observed API root | Role established by the inspected client |
| --- | --- | --- | --- |
| MIA / LYA | `app.lyaprotect.com` and LYA enterprise app | LYA platform paths under `/lyaptf/api` | Quote and subscription workflows; stored contract references; LYA payroll information generation |
| Henner employer | [hr.henner.com](https://hr.henner.com/) | `https://apim.henner.com/site_rh/1.0/api-rh/{codeSite}/{lang}` | Existing contracts, employees, contributions, documents, and DSN administration |
| Henner broker / MyHSC | [courtage.henner.com](https://courtage.henner.com/) | `https://apim.henner.com/courtier/1.0` | Quoting, subscription submissions, contract portfolio, documents, and employer-portal handoff |
| Henner member | [clients.henner.com](https://clients.henner.com/) | Not investigated | Member portal; outside this investigation |

Henner's [official collective-product announcement](https://www.henner.com/wp-content/uploads/2024/04/cp_henner-solutions-entreprise-sante_veo5_vdef-1.pdf)
also distinguishes MyHSC sales/subscription from the employer space's contract,
DSN, and document administration. It would be too strong to say Henner handles
only administration: MyHSC also supports quoting and subscription.

For `hr.henner.com`, the inspected hostname mapper defaults to `codeSite: 12`.
French uses `lang: fr`, giving:

```text
https://apim.henner.com/site_rh/1.0/api-rh/12/fr
```

The same frontend supports other hostnames and site codes. The default above
identifies the observed portal configuration; it does not grant access to any
employer or contract.

## Retrieve Henner's DSN setup sheet

All paths in this section are relative to the employer API root.

| Method | Path | Frontend behavior |
| --- | --- | --- |
| GET | `/utilisateur/contrats` | Load the user's available contract collections |
| POST | `/utilisateur/contrat` | Read contract information using `numeroClient`, `typeClient`, and `numeroContrat` |
| POST | `/dsn/parametrage/consulter-fiche` | Read setup-sheet availability, DSN configuration, and contract-reference details |
| POST | `/dsn/parametrage/telecharger-fiche` | Download a document represented by base64 content and file metadata |
| POST | `/dsn/parametrage/reemettre-fiche` | Request reissue; this is a business action |
| POST | `/dsn/mouvement/historique` | Search DSN movements; full request schema not established here |

### Select the contract

The DSN screen obtains its contracts from:

```js
Object.values(response.data.listeTotale)
```

It initially selects an item with truthy `estEligibitleConsultationDSN`.
That spelling is copied exactly from the source. The selector displays
`libelle + " - " + identifiantExterne`.

The list and contract-detail operations are separate from policy issuance. They
read contracts already available to the authenticated user.

### Build the DSN request

Consult, download, and reissue all use this body mapping:

```js
const body = {
  numeroContrat: selectedContract.numeroContrat,
  numeroClient: selectedContract.numeroClient,
  typeClient: selectedContract.typeClient,
  trigramme: selectedContract.trigramme,
  numeroContratExterne: parseInt(selectedContract.numeroExterne, 10)
};
```

This records the observed mapping. Except for the explicit integer conversion,
it does not establish server-side types or requiredness. A future adapter should
validate the selected record and the conversion before sending it.

### Read the consultation response

The UI expects an envelope containing `status`, `message`, and `data`, and uses
`status === "OK"` for the successful consultation branch.

| Data group | Fields consumed by the frontend |
| --- | --- |
| `ficheParametrage` | `dateEmission`, `dateApplication`, `emailDestinataire`, `accesTelechargement`, `accesReemission`, and messages explaining unavailable actions |
| `combinaisonsParametrage[]` | `referenceContrat`, `codeOrganisme`, `codeDelegataire`, combination, amount, presence flags, and comment |
| `dsnMensuelle`, `dsnEvenementielle` | Movement/contribution state and dates |
| `historique[]` | Reception/declaration/due dates, order number, sender, company SIREN, and declaration types |
| `parametrage` | Monthly/event movement and contribution settings |

The [machine-readable workflow evidence](../spec/henner/employer-key-operations.json)
records all 35 observed DSN data paths, request mappings, and source offsets.
Fields that the frontend does not read may still exist in the response.

### Decode the download

The download caller expects this partial shape. The strings below are
placeholders, not a captured server response:

```json
{
  "status": "OK",
  "data": {
    "flux": "<base64 file content>",
    "typeMime": "<server-supplied MIME type>",
    "nomFichier": "<server-supplied basename>",
    "extension": "<optional extension>"
  }
}
```

It converts `flux` into a Blob using `typeMime` and saves
`nomFichier + (extension ? "." + extension : "")`. This is direct evidence of a
document download, beyond a suggestive endpoint name. The actual MIME type,
format, and contents remain unverified; this route has not been shown to offer
both XML and PDF.

Reissue is separate from download. Its caller reloads the details after the
request. A non-success branch treats error code `1000` specially, but that code's
server meaning is unknown. Do not turn it into an invented success condition or
automatically retry a reissue request.

### Corroborate the workflow with the linked guide

LYA's enterprise frontend explicitly directs users to their separate Henner
extranet for employee enrollment. It links the
[Henner HR guide hosted in LYA's MIA directory](https://lya-public.s3.eu-west-3.amazonaws.com/MIA/Guide+RH_Espace+RH.pdf).

Page 4 identifies `hr.henner.com`, Henner-issued access, and a separate DSN
consultation permission. Page 64 describes selecting a contract under the DSN
configuration menu, then downloading its sheet or requesting reissue. The PDF
was created in December 2022, so its screens may differ from the current client;
the current frontend independently exposes the corresponding operations.

## Retrieve contract references and other documents

The broker paths below use `https://apim.henner.com/courtier/1.0`.

| Method | Path | Request or response observations |
| --- | --- | --- |
| POST | `/contrats-colleges/recherche` | JSON filters; query pagination; response `elements[]`, `numeroPage`, `nombrePageTotale` |
| GET | `/contrats/collectif/{contractId}` | Contract detail including `identifiant`, `numero`, `trigramme`, `colleges`, `acteurs`, offer/risk and dates |
| GET | `/contrats/individuel/{contractId}` | Corresponding individual-contract path |
| GET | `/contrats/{contractSegment}/{trigramme}/{numero}` | Lookup with an existing contract reference; segment is `collectif` or `individuel` |
| GET | `/contrats/collectif/{contractId}/documents` | Document array; optional `typeCollegeCode` query filter; individual variant also observed |
| GET | `/contrats/{contractId}/documents/{documentTypeCode}` | Blob/full HTTP response; filename read from `Content-Disposition` |
| GET | `/contrats/{contractId}/lien-site-rh` | Text URL opened in a new tab; explicit handoff to the employer portal |

Search filters include `populationCibleCode`, `risqueCode`,
`denominationClientSignataire`, `IdentifiantOffresCommerciales`,
`trigrammeContrat`, and `numeroContrat`, plus date and broker/commercial filters.
Query pagination uses `nombreElementPage`, `numeroPage`, and optional `tri`.
These are observed field names, not a complete validated search schema. A
conditional `/back-office/contrats-colleges/recherche` route also exists.

The document list consumes `identifiant`, `titre`, `type.code`, `type.libelle`,
`dateCreation`, `identifiantPropositionCommerciale`, `identifiantDevis`,
`estTeleverse`, `estOav`, and `estDocumentAdhesion`. The download path derives its
type segment by lowercasing `type.code` and replacing underscores with hyphens.
Optional query keys include `idDocument`, `EstOav`, `TypeCollegeCode`,
`EstDocumentAdhesion`, `idPropositionCommerciale`, and `idDevis`. Preserve their
observed casing.

No explicit DSN/FPOC operation or document type was found in decoded strings
across the broker main bundle and 93 lazy chunks. Document types also come from
the API, so this is not proof that the broker document API cannot expose one.
The employer routes provide the positive evidence for the DSN requirement.

### Keep identifier domains separate

| Identifier | Observed meaning or use |
| --- | --- |
| LYA `numeroInterne` | Internal LYA contract ID |
| LYA `numeroCompagnie` | Editable insurer reference stored on a LYA contract |
| Broker `identifiant` | ID used for contract-detail and document operations |
| Broker `trigramme` and `numero` | Concatenated by the UI into its displayed contract reference |
| Employer `numeroContrat` | Contract field copied into the DSN request |
| Employer `numeroExterne` | Parsed into DSN request field `numeroContratExterne` |
| Employer `identifiantExterne` | Displayed and searched in the employer contract selector |
| DSN `referenceContrat` | Reference returned per DSN combination, alongside organism/delegate codes |

These identifiers must remain distinct until a representative authorized case
establishes the mapping. Neither an internal database ID nor a manually supplied
reference proves that the insurer has issued a policy.

## Understand the subscription operations

Henner's broker frontend contains the following submissions. Their existence
does not establish that the user's MIA products follow these paths.

| Method | Broker path | Observed request and result handling |
| --- | --- | --- |
| POST | `/devis/souscription-partenaire` | Company subscription body; UI shows success and returns to dashboard. No issued policy number is consumed at this call site. |
| POST | `/devis/back-office/demandes-adhesion/{id}/souscription` | Empty JSON object; back-office subscription action. No binding/issuance response schema established. |
| POST | `/devis-individuel/{quoteId}/contrat` | Query `identifiant-offre-commerciale`; body contains `indicateurSignatureElectroniqueMail: false`, `indicateurSignatureElectroniqueUrl: false`, and `identifiantPaquet`. UI refreshes membership state. |
| POST | `/devis/{id}/souscription/controle` | Subscription checks; not established as the binding operation. |
| PUT | `/devis/back-office/demandes-adhesion/{id}/saisie-contrat` | Body `{trigrammeContrat, numeroContrat}`; associates a supplied contract reference. |

The company subscription body includes `identifiantApporteur`,
`identifiantCommercial`, `numeroOffreCommerciale`, `clientSignataire`,
`correspondantsEntreprise[]`, and `garantiesSouscrites[]`. Nested mappings cover
company/address/bank details, risk, effective date, formulas, tariffs, and
conditional college and external-reference fields. The
[broker workflow evidence](../spec/henner/broker-key-operations.json) records
these field paths and their source locations. Requiredness, permitted codes,
validation/signature order, acceptance, and issuance timing remain unverified.

The broker client also maps a `onesure` product category to
`GET /redirection/lien-ancien-oav/creer-devis-onesure`. This is a useful connection
clue for a 1SURE quote-tool handoff. It does not prove a particular MIA tenant
shares credentials or returns Henner's downstream documents.

## Authenticate to the correct service

### Employer portal

| Method | Employer path | Observed wire shape |
| --- | --- | --- |
| POST | `/securite/login` | JSON `{identifiant, motDePasse}` |
| GET | `/mfa/generer` | No body; UI consumes `data.codeEnvoye`, `data.tempsMort`, and `message` |
| GET | `/mfa/valider/{code}` | Six-digit code checked by the form; UI checks `status` and `message` |

Login handling reads `data.utilisateur`,
`data.authentificationRenforceeRequise`, `data.changementMotDePasseRequis`,
`data.redirigerVersAutreSite`, and `data.urlSite`, alongside status/error fields.
An integration must account for these branches. Generating an MFA code is an
action despite using GET.

The client sends `withCredentials: true`. A browser cookie/session flow is a
reasonable inference; cookie names, lifetimes, and an authorized service-account
flow were not observed. CSRF helpers exist, but the inspected DSN bodies do not
append them. No required CSRF header or bearer-token contract is inferred from
unused helpers.

### Broker portal

The runtime config uses the separate authentication root
`https://apim-auth.henner.com/oauth/authentication/1.0`, with authorize/login
paths and scopes `openid partenaire.READ partenaire.WRITE`.

The browser flow constructs URLs using `client_id`, `response_type=token`,
`scope`, `lang`, and `redirect_uri`. Its login form uses `UserName` and `Passwd`.
The API interceptor adds a bearer token and enables credentials for configured
broker calls. Public OAuth client IDs identify browser applications; they are
not working access credentials for this project.

MIA machine credentials, Henner broker access, and Henner employer access must
be treated as separate until the providers confirm an authorized integration.
The broker-to-HR link is evidence of a handoff, not a general-purpose
machine-authentication contract.

## What was collected

| Inventory | Observed scope | Count |
| --- | --- | ---: |
| Employer business/auth API | Shared service, cross-checked against main and 19 lazy chunks | 147 call sites; 144 normalized method/path patterns |
| Employer CMS/translation calls | Preserved separately from the business inventory | 18 call sites |
| Broker application | Main and all 93 runtime-listed lazy chunks | 337 HTTP call sites |
| Broker resolved route patterns | 322 broker, 9 nomenclature, 3 auth, 1 CMS | 335 patterns from 326 call sites |
| Broker dynamic/shared-library calls | Runtime URLs and generic OAuth-library behavior | 11 call sites |

Conditional URL branches can produce multiple patterns from one call site.
Conversely, multiple callers can share one pattern. Counts do not represent a
promise of supported or accessible endpoints. The frontend is shared across
brands and includes back-office routes; presence alone does not establish
entitlement. Backend-only and runtime-supplied routes can remain undiscovered.

Use the [readable endpoint inventory](HENNER_ENDPOINTS.md) to browse every
resolved pattern. Use [spec/henner](../spec/henner/) for machine-readable routes,
request/response observations, unresolved cases, source hashes, and offsets.
This research inventory is separate from the existing LYA SDK generator and
does not add callable SDK operations.

### Recheck the evidence

The [source manifest](../spec/henner/source-manifest.json) records exact public
URLs and SHA-256 hashes. Retrieve the matching asset and verify its hash before
using an offset. JavaScript catalogue offsets are zero-based UTF-16 code units;
the workflow evidence additionally labels Python character and byte offsets.

| Evidence | Asset | Location |
| --- | --- | --- |
| Employer API root | `hr.henner.com/assets/extra-vars.js` | Runtime configuration |
| Employer DSN HTTP calls | `chunk-4RNWU2ZH.js` | UTF-16 offsets 1206047, 1207037, 1208004 |
| Employer contract list HTTP call | `chunk-4RNWU2ZH.js` | UTF-16 offset 1209627 |
| DSN body builder and file handling | `chunk-LIFWAF3P.js` | UTF-16 offsets 41808 and 40976 |
| Broker contract detail mapping | `570.fe8f4ee3ecd748b8.js` | UTF-16 offset 430370 |
| Broker contract search mapping | `570.fe8f4ee3ecd748b8.js` | UTF-16 offsets 436388 and 437945 |
| Broker document list/download | `main.779c58275dd244a2.js` | UTF-16 offsets 344568 and 345702 |
| Broker HR handoff | `main.779c58275dd244a2.js` | UTF-16 offsets 309199 and 309935 |

Full application bundles, credentials, and customer records are excluded from
the repository. No live document or issued contract was retrieved during this
investigation.

Before publication, the 125 recorded source hashes and the positions/methods of
all 502 catalogued HTTP call sites were checked against the downloaded assets.
The 22 selected employer workflow evidence locations were also checked. The
existing SDK's generation checks, TypeScript checks, 40 mock tests, and build
passed. Those checks validate the research snapshot and existing SDK; they do
not establish a working Henner connection.

## Validate one complete scheme before claiming coverage

The SDK remains useful for the observed MIA / LYA operations. A direct Henner
integration should be a separate service/adapter with its own authentication,
identifier types, response decoding, and evidence level. Keep the current LYA
document methods; name their output as a LYA payroll information sheet until its
contents are checked.

For a representative authorized test scheme:

1. Confirm the product's quote/subscription route and the provider's accepted or
   bound completion state. Start with existing test records for read operations.
2. Locate the same scheme in Henner and compare LYA's stored reference with the
   broker and employer identifiers. Record which value the business calls the
   policy number.
3. Confirm employer DSN entitlement, consult the sheet, and download it. Check
   its issuer/delegate, contract reference, effective dates, and required format.
4. Establish when those outputs become available after subscription and which
   supported credentials or partner API should be used in production.

There is also a documented alternative for the setup sheet: the
[Net-entreprises API DSN](https://www.net-entreprises.fr/declaration/api-dsn/)
explicitly supports retrieving complementary-organism parameter sheets. Its
[FPOC reference page](https://www.net-entreprises.fr/declaration/fiches-de-parametrages-oc/)
describes contract references, XML/PDF formats, and declarant access. This is a
separate integration with its own declarant/employer relationship requirements;
possession of MIA keys alone does not establish access.

The defensible current conclusion is that the required interfaces are visible
across LYA and Henner, including an explicit Henner DSN document workflow.
End-to-end product coverage and authorized machine access remain to be verified.
