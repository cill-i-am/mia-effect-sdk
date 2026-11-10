# Curated MIA / LYA request and response reference

This reference covers all **58 curated operation descriptors** and their namespace methods. It is generated from the current authored SDK's route, method, service, effect and schema metadata. It does not execute the downloaded LYA application or call an insurance endpoint.

## Reading the reference

Every operation method in the tables returns a lazy `Effect<Result, MiaError, MiaClient>`. Calling the function constructs an Effect; the request occurs when the Effect is run with a configured client. All curated operations use the SDK's **envelope** response mode: the result shown in the tables is the decoded `body`, not the outer HTTP envelope. The observed successful envelope is:

```json
{
  "statusHttp": "OK",
  "success": true,
  "codeMessage": null,
  "libelleMessage": null,
  "body": {}
}
```

The common error union distinguishes configuration, authentication, transport, HTTP, malformed protocol/envelope, business-envelope, request-construction and schema failures. A transport acknowledgement is not proof of carrier acceptance, completed signature or issued cover. These curated calls perform **no automatic retries**, including operations implemented as GET. See [transport and errors](../packages/sdk/src/errors.ts) and [operation execution](../packages/sdk/src/operation.ts).

An `unknown` result is intentional: the route or caller is observed, but its body schema is not established. Named models contain known fields and preserve unrecognized extension fields. Most fields in frontend DTOs are optional and nullable. That reflects incomplete client evidence and form state; it does not declare the backend's mandatory fields. Dates are wire strings, not automatically converted Date instances. Arrays are readonly in inferred TypeScript types.

## Explicit service prefixes

Paths in the tables are **relative to the configured service base**, which must already contain its service prefix. Origins and credentials are supplied by the caller; the SDK has no production URL defaults. A configured credential is scoped to the services that name it.

| Service key | Synthetic example base | Curated use |
| --- | --- | --- |
| `platform` | `https://platform.example.test/lyaptf/api` | Parcours, projects, quotes, contracts, customers, reference data, platform document/signature operations |
| `ged` | `https://documents.example.test/lyaGed/api` | Document URL/download resolution |
| `signature` | `https://signature.example.test/lyasign/api` | Procedure, signer, signature-document and proof operations |
| `message` | `https://messages.example.test/lyamsg/api` | Observed task-save sample; the collection used a separate, undeclared `msgUrl` |

The collection's `{{ptfUrl}}/api/v1/parcours/...` becomes `platform` + `/v1/parcours/...`. It is not the separate frontend `/lyaptf/v1` prefix. `Lya-Language` defaults through service/client configuration; document generation can override it explicitly.

## Identifier factories

`Schemas.encodedProjectId(value)`, `projectNumber(value)`, `quoteNumber(value)`, `contractId(value)`, `policyNumber(value)`, `customerNumber(value)`, `signatureProcedureId(value)` and `documentId(value)` validate nonempty strings and return distinct branded types. All of these factories are accessed through the Schemas namespace. The functions do not convert between identifier domains. They throw on invalid input; use the corresponding Schema with `Schema.decodeUnknownEffect` when validation should remain inside Effect.

| Type | Source / meaning | Used by |
| --- | --- | --- |
| `EncodedProjectId` | Integration read DTO's `encodedNumeroProjet` | `Parcours.readProject` |
| `ProjectNumber` | `numeroProjet` or internal project's `numero` | Project stages, quote listing, main payroll generator |
| `QuoteNumber` | Quote's `numeroInterne` | Choice, carrier actions, enterprise payroll generator |
| `ContractId` | Contract's `numeroInterne` | Internal contract read/document routes |
| `PolicyNumber` | Contract's `numeroCompagnie` | Insurer policy reference; not a contract-record path ID |
| `ProjectCreationReference` | Creation result's `body.value` | Kept distinct: equivalence to an encoded project ID is unverified |

Path components are percent-encoded once by the SDK. Some optional response references also accept an empty string because frontend form DTOs can be blank; path factories remain nonempty. To use a nonblank returned reference in another operation, check it and keep its existing brand rather than assigning a different identifier type.

## Operations

Each table states its namespace and service key. The evidence cell uses `main:<offset>` for zero-based Unicode-code-point offsets in `index-CV_sfL5W.js`; enterprise offsets are JavaScript UTF-16 offsets. Collection references identify the supplied Postman example. The machine-readable snapshot includes the full descriptor evidence.

### Parcours

Service: **platform**. [Implementation](../packages/sdk/src/services/parcours.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Parcours.price(request: PricingRequest)` | `POST /v1/parcours/tarif` | JSON PricingProduct[] | `PricingResponse = PartnerPricingResult[]` | **read**; collection: 0/0..0/3 |
| `Parcours.createProject(request: CreateProjectRequest)` | `POST /v1/parcours/devis` | JSON CreateProjectRequest | `CreatedProject { value: ProjectCreationReference }` | **mutation**; collection: 3/0..3/3 |
| `Parcours.readProject(encodedProjectId: EncodedProjectId)` | `GET /v1/parcours/projet/{encodedProjectId}` | None | `ParcoursProject` | **read**; collection: 3/4 |

### Projects

Service: **platform**. [Implementation](../packages/sdk/src/services/projects.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Projects.read(projectNumber: ProjectNumber)` | `GET /courtage/projet/lire/{projectNumber}` | None | `InternalProject` | **read**; main:9611848 (readProject$1) |
| `Projects.readState(projectNumber: ProjectNumber)` | `GET /courtage/projet/etat/lire/{projectNumber}` | None | `ProjectState` | **read**; main:9611159 (lireEtatProjet) |
| `Projects.enterSubscription(projectNumber: ProjectNumber)` | `PUT /courtage/projet/souscrire/{projectNumber}` | None | `ProjectState` | **mutation**; main:9613065 (souscrireProjet$1) |
| `Projects.readSubscription(projectNumber: ProjectNumber)` | `GET /courtage/projet/souscription/lire/{projectNumber}` | None | `Subscription` | **read**; main:9948226 (readProjectSouscription$1) |
| `Projects.initializeSubscription(projectNumber: ProjectNumber)` | `POST /courtage/projet/souscription/initier/{projectNumber}` | None | `Subscription` | **mutation**; main:9948443 (initProjectSouscription$1) |
| `Projects.saveSubscription(projectNumber: ProjectNumber, subscription: Subscription)` | `POST /courtage/projet/souscription/enregistrer/{projectNumber}` | JSON subscription object | `Subscription` | **mutation**; main:9948318 (saveProjectSouscription$1) |
| `Projects.transmitSubscription(projectNumber: ProjectNumber, isUsingWebApp: boolean)` | `POST /courtage/projet/souscription/transmettre/{projectNumber}` | JSON boolean: true or false | `ProjectState` | **mutation**; main:9948632 (sendSouscription$1) |
| `Projects.validateSubscription(projectNumber: ProjectNumber)` | `PUT /courtage/projet/souscription/valider/{projectNumber}` | None | `ProjectState` | **mutation**; main:9613233 (validerProjetSouscription$1) |
| `Projects.transformToContract(projectNumber: ProjectNumber, transformation: TransformProjectRequest)` | `PUT /courtage/projet/souscription/transformer/{projectNumber}` | JSON transformation object | `Contract` | **mutation**; main:9615105 (transformProject$1) |
| `Projects.readAdministration(projectNumber: ProjectNumber)` | `GET /courtage/projet/miseEnGestion/lire/{projectNumber}` | None | `Administration` | **read**; main:9929492 (readProjectMiseEnGestion$1) |
| `Projects.saveAdministration(projectNumber: ProjectNumber, administration: Administration)` | `POST /courtage/projet/miseEnGestion/enregistrer/{projectNumber}` | JSON administration object | `Administration` | **mutation**; main:9929586 (saveProjectMiseEnGestion$1) |
| `Projects.enterAdministration(projectNumber: ProjectNumber)` | `PUT /courtage/projet/mettreEnGestion/{projectNumber}` | None | `ProjectState` | **mutation**; main:9613143 (mettreEnGestionProjet$1) |
| `Projects.transmitAdministration(projectNumber: ProjectNumber)` | `GET /courtage/projet/miseEnGestion/transmettre/{projectNumber}` | None | `unknown; acknowledgement shape unestablished` | **mutation**; main:9929300 (sendGestion$1) |

### Quotes

Service: **platform**. [Implementation](../packages/sdk/src/services/quotes.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Quotes.listForProject(projectNumber: ProjectNumber)` | `GET /courtage/projet/devis/lister/{projectNumber}` | None | `Quote[]` | **read**; main:9941054 (listProjectQuoteApi) |
| `Quotes.read(quoteNumber: QuoteNumber)` | `GET /courtage/projet/devis/lire/{quoteNumber}` | None | `Quote` | **read**; main:9942072 (readQuote$1) |
| `Quotes.selectForProposal(projectNumber: ProjectNumber, quoteNumbers: readonly QuoteNumber[])` | `PUT /courtage/projet/devis/selectionner/{projectNumber}` | JSON array of quote numbers | `unknown` | **mutation**; main:9941137 (saveSelectedQuote$1) |
| `Quotes.choose(quoteNumber: QuoteNumber)` | `GET /courtage/projet/choisir/{quoteNumber}` | None | `ProjectState` | **mutation**; main:9942224 (selectProjectQuote$1) |
| `Quotes.chooseAndSave(quoteNumber: QuoteNumber, choice: QuoteChoice)` | `PUT /courtage/projet/choisir/{quoteNumber}` | JSON choice; fills missing/empty devis.type | `{ devis: Quote, ...unknownFields }` | **mutation**; main:9942380 (selectAndSaveProjectQuote$1) |
| `Quotes.subscribeWithInsurer(quoteNumber: QuoteNumber)` | `GET /scrapping/projet/souscrire/{quoteNumber}/false` | None | `unknown; reread quote state for outcome` | **mutation**; main:9943082 (subscribeQuote$1) |
| `Quotes.subscribeManually(quoteNumber: QuoteNumber)` | `GET /scrapping/projet/souscrire/manuel/{quoteNumber}` | None | `unknown; reread quote state for outcome` | **mutation**; main:9943166 (subscribeManualQuote$1) |
| `Quotes.checkSubscription(quoteNumber: QuoteNumber)` | `GET /scrapping/projet/souscrire/{quoteNumber}/true` | None | `unknown; this is an action, not a safe read probe` | **mutation**; main:9943354 (controlSubscribtionQuote) |
| `Quotes.activateAdministrator(quoteNumber: QuoteNumber, comments?: string)` | `PUT /scrapping/projet/mettreEnGestion/{quoteNumber}` | Raw comments string; absent/empty becomes one space | `unknown; reread quote/subscription/administration` | **mutation**; main:9943445 (manageQuote$1) |

### Contracts

Service: **platform**. [Implementation](../packages/sdk/src/services/contracts.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Contracts.read(contractId: ContractId)` | `GET /courtage/contrat/lire/{contractId}` | None | `Contract` | **read**; main:6028383 (readContrat$1) |
| `Contracts.listForCustomer(customerNumber: CustomerNumber)` | `GET /courtage/contrat/listerParClient/{customerNumber}` | None | `unknown; list wrapper not established` | **read**; main:6028113 (listerContratsClient) |
| `Contracts.search(request: SearchRequest)` | `POST /courtage/contrat/rechercher` | JSON SearchRequest | `ContractPage { content: Contract[], totalElements: number }` | **read**; main:6027581 (searchContrats$1 / searchContrats) |
| `Contracts.save(contract: Contract)` | `POST /courtage/contrat/enregistrer` | JSON contract DTO; extension fields retained | `Contract` | **mutation**; main:6028453 (saveContrat$1) |

### Documents

Service: **platform / ged, explicitly shown per row**. [Implementation](../packages/sdk/src/services/documents.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Documents.generate(request: GenerateDocumentRequest, language?: string)` | `POST /documents/generer` [platform] | JSON generation request; language becomes Lya-Language header | `GeneratedDocument` | **mutation**; main:9816152 (genererDocuments) |
| `Documents.generateEnterprisePayrollSheet(quoteNumber: QuoteNumber)` | `GET /assure/projet/parcours/genererFicheParametragePaie/{quoteNumber}` [platform] | None | `StringValue { value: document URL }` | **mutation**; enterprise:91947; caller:272729 |
| `Documents.resolveDownload(fileName: string)` | `POST /documents/download/NULL` [ged] | Raw fileName string, not JSON quoted | `StringValue { value: download URL }` | **read**; main:2315604 (downloadDocument$1) |
| `Documents.resolveUrl(completeKey: string)` | `POST /documents/url` [ged] | Raw completeKey string, not JSON quoted | `StringValue { value: document URL }` | **read**; main:2315790 (lireUrl) |
| `Documents.listForContract(contractId: ContractId)` | `GET /courtage/contrat/documents/lister/{contractId}` [platform] | None | `Document[]` | **read**; main:6029259 (listContratDocument) |
| `Documents.searchForContracts(request: SearchRequest)` | `POST /courtage/contrat/documents/lister` [platform] | JSON SearchRequest | `{ content: Document[], totalElements: number, ...unknownFields }` | **read**; main:6029979 (searchContratDocuments) |
| `Documents.listForAdhesion(projectNumber: ProjectNumber)` | `GET /courtage/projet/adhesion/documents/lister/{projectNumber}` [platform] | None | `Document[]` | **read**; main:9918283 (listProjectAdhesionDocuments$1) |
| `Documents.validateForAdhesion(documentId: DocumentId)` | `PUT /courtage/projet/adhesion/documents/valider/{documentId}` [platform] | None | `ProjectState` | **mutation**; main:9919562 (validateProjectAdhesionDocument$1) |
| `Documents.listForAdministration(projectNumber: ProjectNumber)` | `GET /courtage/projet/miseEnGestion/documents/lister/{projectNumber}` [platform] | None | `Document[]` | **read**; main:9928272 (listProjectGestionDocuments$1) |

### Customers

Service: **platform**. [Implementation](../packages/sdk/src/services/customers.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Customers.create(request: CreateCustomerRequest)` | `POST /courtage/client/creer` | JSON customer DTO | `unknown; no saved response supplied` | **mutation**; collection: client/create individual, company, company linked to existing contact |
| `Customers.read(customerNumber: CustomerNumber)` | `GET /courtage/client/lire/{customerNumber}` | None | `Customer` | **read**; collection: client/read |
| `Customers.searchPeople(request: SearchRequest)` | `POST /courtage/contact/personne/rechercher` | JSON SearchRequest | `unknown; no page shape is promised` | **read**; collection: contact/personne/rechercher |
| `Customers.searchCompanies(request: SearchRequest)` | `POST /courtage/contact/entreprise/rechercher` | JSON SearchRequest | `unknown; no page shape is promised` | **read**; collection: contact/entreprise/rechercher |

### Reference

Service: **platform**. [Implementation](../packages/sdk/src/services/reference.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Reference.listCodifications(category: string, context?: string)` | `GET /codifications/lister/{context}/{category}` | None; context defaults to literal NULL | `Codification[]` | **read**; collection: codifications/lister/NULL/RACE_ANIMAL_CHIEN |
| `Reference.listInsurers()` | `GET /referentiel/assureur/lister` | None | `Insurer[]` | **read**; collection: referentiel/assureur/lister |

### Tasks

Service: **messaging**. [Implementation](../packages/sdk/src/services/tasks.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Tasks.saveObservedPayload(request: TaskRequest)` | `POST /taches/enregistrer` | JSON sample keys, including etat* and propriétés* | `unknown; literal sample acceptance unverified` | **mutation**; collection: Créer Tache; literal etat* and propriétés* are unresolved |

### Signatures

Service: **platform / signature, explicitly shown per row**. [Implementation](../packages/sdk/src/services/signatures.ts).

| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |
| --- | --- | --- | --- | --- |
| `Signatures.createForAdhesion(projectNumber: ProjectNumber)` | `PUT /courtage/projet/adhesion/signature/create/{projectNumber}` [platform] | None | `InternalProject` | **mutation**; main:9919460 (createSignatureAdhesion$1) |
| `Signatures.resetForAdhesion(projectNumber: ProjectNumber)` | `PUT /courtage/projet/adhesion/signature/init/{projectNumber}` [platform] | None | `InternalProject; resets/cancels existing procedure` | **mutation**; main:9919362 (reinitSignatureAdhesion) |
| `Signatures.transmitAdhesion(projectNumber: ProjectNumber)` | `GET /courtage/projet/adhesion/transmettre/{projectNumber}` [platform] | None | `unknown; sends signature communications` | **mutation**; main:9919276 (sendAdhesion$1) |
| `Signatures.createProcedure(customerNumber: CustomerNumber, title: string)` | `POST /courtage/signature/initier/{customerNumber}` [platform] | Raw title string, not JSON quoted | `CreatedSignatureProcedure { value: SignatureProcedureId }` | **mutation**; main:9890494 (createProcedure) |
| `Signatures.addSigner(procedureId: SignatureProcedureId, customerNumber: CustomerNumber)` | `POST /courtage/signature/{procedureId}/signataires/{customerNumber}` [platform] | None | `Signer` | **mutation**; main:9890573 (addProcedureSignataire) |
| `Signatures.readProcedure(procedureId: SignatureProcedureId)` | `GET /procedures/lire/{procedureId}` [signature] | None | `SignatureProcedure` | **read**; main:6196193 (getProcedureById) |
| `Signatures.launchProcedure(procedureId: SignatureProcedureId)` | `PUT /procedures/init/{procedureId}?sync=false&avecEmail=true` [signature] | None; fixed sync=false and avecEmail=true query | `unknown; asynchronous launch acknowledgement` | **mutation**; main:6196958 (launchProcedure) |
| `Signatures.remindProcedure(procedureId: SignatureProcedureId)` | `POST /procedures/relancer/{procedureId}` [signature] | None | `unknown` | **mutation**; main:6197065 (remindProcedure) |
| `Signatures.abandonProcedure(procedureId: SignatureProcedureId)` | `PUT /procedures/abandonner/{procedureId}` [signature] | None | `unknown; reread procedure to establish state` | **mutation**; main:6196871 (cancelProcedure) |
| `Signatures.updateProcedure(procedure: SignatureProcedure)` | `PUT /procedures/modifier` [signature] | JSON procedure DTO | `SignatureProcedure` | **mutation**; main:6196390 (updateProcedure) |
| `Signatures.updateSigner(procedureId: SignatureProcedureId, signer: Signer)` | `PUT /signataires/modifier/{procedureId}` [signature] | JSON signer DTO | `Signer` | **mutation**; main:6197446 (updateSignataire) |
| `Signatures.uploadDocument(procedureId: SignatureProcedureId, form: FormData)` | `POST /documents/ajouter/{procedureId}` [signature] | Multipart FormData; field names supplied by caller | `unknown` | **mutation**; main:9891069 (ajouterDocument) |
| `Signatures.readProof(procedureId: SignatureProcedureId)` | `GET /procedures/proof/{procedureId}` [signature] | None | `SignatureProof { value: base64 ZIP }` | **read**; main:6197151 (getProcedureProofFile) |

## Additional helpers using those operations

These helpers do not introduce additional endpoints.

### Payroll setup sheet

`Documents.generatePayrollSheet(projectNumber: ProjectNumber, language?: string)` calls `Documents.generate` with this exact payload:

```json
{
  "stockage": false,
  "typeDocument": "FICHE_PARAMETRAGE_PAIE:TYPE_DOCUMENT_GENERE",
  "typeNumero": "PROJET_NUMERO",
  "numero": "PROJECT-EXAMPLE",
  "test": false
}
```

Its result may contain `fileName`; pass that unchanged to `Documents.resolveDownload` and read the returned `value` URL. This is separate from `Documents.generateEnterprisePayrollSheet(quoteNumber)`, whose GET path takes the selected quote's `numeroInterne` and returns the URL in `value`. The enterprise caller explicitly uses `getDevisChoisi().numeroInterne`.

### Contract pagination

`Contracts.stream(request: SearchRequest)` returns `Stream<Contract, MiaError, MiaClient>`. It starts at `pageNumero`, requests one page at a time and emits individual contracts. It advances while the observed `totalElements` indicates more pages and stops immediately on an empty page. It does not prefetch or retry. Concurrent server changes can affect a paged result; no snapshot/cursor guarantee was observed.

`SearchRequest` requires `criteres`, integer `pageNumero >= 0` and integer `nbParPage >= 1`; `ordres` is optional and its element schema remains unknown. A criterion has `reference: string`, `valeur: unknown` and optional `operation: string`. Actual contract callers omit `operation` for some filters, so it is not made mandatory. The API-wide supported operator/reference combinations are not established.

```json
{
  "criteres": [
    { "reference": "contrat.etats", "valeur": ["SOUSCRIT:ETAT_CONTRAT"] }
  ],
  "pageNumero": 0,
  "nbParPage": 50
}
```

## Request and response models

The [schema source](../packages/sdk/src/schemas/index.ts) is exported as the `Schemas` namespace. `GenerateDocumentRequest`, `GeneratedDocument`, `QuoteChoice` and `ContractPage` are additionally exported from their service modules. The [native Effect JSON Schema snapshots](../spec/curated-schema-snapshots.json) contain **57 named models** and input/response documents for all 58 descriptors, including exact known field constraints. An operation's input snapshot describes its **descriptor argument**, which may wrap a body and path parameters; it is not an inferred server request-body specification.

| Model / area | Known shape and interpretation |
| --- | --- |
| `PricingProduct` / `PricingRequest` | An array of product objects: `codeProduit`, `parametres: Criterion[]`, optional `critereElligibilite` map. The eligibility key is deliberately spelled exactly as observed. |
| `Criterion` | `reference`, optional `critereRef`, nullable optional `stringValue`, `booleanValue`, `integerValue`, `decimalValue`, `dateValue`, `parentRef`, `orderIndex`, `valeurInString`; optional `nullValue`. Values are not coerced. |
| `PricingResponse` | Array of partner results. Known fields include `partenaire`, `status`, `message`, `duration`, and `resultat.simulations[]`. Simulation fields include product/formula/status, criteria and contribution basis/rates. |
| `CreateProjectRequest` | `besoin: ProjectNeed`, `codeProduit`, `parametres[]`, optional `critereElligibilite`. The SDK requires these primary fields for its creation helper; this is not a complete declaration of server requiredness. |
| `ProjectNeed` | `type`; optional company, contact, personnas, consent, current-policy, desired date, employee demographics, contribution and coverage fields. The Syntec key `sinitresEnCours` is preserved with its observed spelling. |
| `ContributionBasis` / `ContributionRate` | Known contribution-type, chosen-basis, employer-share, amount and PMSS fields. Numeric values and nulls remain distinct. |
| `CreatedProject` | `value: ProjectCreationReference`. No automatic conversion to an encoded project ID. |
| `ParcoursProject` | `numeroProjet`, `encodedNumeroProjet`; known optional quote, selected-quotes, need, insured, state, proposal documents and signature URL fields. Full sanitized saved response round-trips in tests. |
| `InternalProject` / `ProjectState` | Known project, selected-quote, state and signature-procedure fields; full DTOs are not established. Earlier `numeroProcedureSignatureElectronique` and final `numeroProcedureSignatureElectroniqueAdhesion` remain distinct. |
| `Quote` / `QuoteChoice` | Known quote/project/customer references, product, formula, state, amount, contribution and launch-information fields. A choice requires `devis` and retains other fields. Missing/null/empty `devis.type` is filled with `projetDevisDTO`; an existing nonempty discriminator is preserved. |
| `Subscription` | Known send/validation/receipt dates, `contratLie`, status, refusal/reason and internal-validation fields; extensions retained. `contratLie` remains an unbranded string because caller semantics vary. |
| `Administration` | Known `dateEnvoiMiseEnGestion` and `numeroContratGestionnaire`, plus extensions. |
| `TransformProjectRequest` | Optional known `numeroDevisChoisi`, `numeroCompagnie`, dates, renewal type, premiums, commission fields, `typeMontant`, and `souscription`; see exact list below. UI-only requiredness is not imposed as server requiredness. |
| `Contract` | Known internal, carrier, broker, insured, membership and administrator references, states/dates/premiums; unknown fields preserved. A saved contract object may include many additional provider fields. |
| `GenerateDocumentRequest` | `typeDocument`; optional `typeNumero`, `numero`, `stockage`, `test` and extensions. |
| `GeneratedDocument` / `Document` | Known filename/upload-name/URL and document metadata fields; generation result fields may differ by requested type. |
| `CreateCustomerRequest` / `Customer` | Creation requires `type` and `personne` with `personne.type`. Known individual, company, address and linked-contact fields are modeled. Existing contact's customer number and numeric person `identifiant` remain different fields. |
| `SignatureProcedure` / `Signer` | Known procedure number/state/error, signers and documents; signer state, emitter flag and signature link. The decoder keeps unknown state strings and additional provider fields. |
| `SignatureProof` | `value: string` contains base64 ZIP bytes. It is not a URL. |
| `TaskRequest` | Optional sample fields including literal `etat*` and accented `propriétés*`. These may be documentation artefacts; the helper does not normalize them or claim server acceptance. |

### Transformation fields

`TransformProjectRequest` models these exact wire names: `numeroDevisChoisi`, `numeroCompagnie`, `souscriptionDate`, `effetDate`, `renouvellementTypeCode`, `echeanceDate`, `resiliationDate`, `primeAnnuelleTTC`, `primeAnnuelleHT`, `commissionMontant`, `commissionNextMontant`, `commissionTaux`, `commissionNextTaux`, `typeMontant`, `souscription`. The browser dialog maps form `devisNumeroInterne` to wire `numeroDevisChoisi`, and form `typeCode` to wire `renouvellementTypeCode`. Its normal completion caller includes `souscription.statutProjetCode = "SOUSCRIT:STATUT_PROJET"`; the SDK does not silently set workflow state for callers.

### Policy and contract reference fields

| Field | Interpretation |
| --- | --- |
| `Contract.numeroInterne` | Internal LYA contract record ID; `ContractId` |
| `Contract.numeroCompagnie` | Carrier policy/contract reference; `PolicyNumber` |
| `Contract.numeroCourtier` | Broker's reference |
| `Contract.assureNumero` | Carrier insured/customer reference |
| `Contract.adhesionNumero` | Carrier membership/enrolment reference |
| `Contract.risqueDetaille.delegataireNumero` | Administrator reference |
| `Administration.numeroContratGestionnaire` | Contract number produced by the administrator |
| `Subscription.contratLie` | Overloaded across UI callers; do not assume it always means the carrier policy number |

## Wire details that matter

- **Transmit subscription:** sends the JSON scalar `false` or `true`, not `{ isUsingWebApp: ... }` and not a quoted string.
- **Raw text:** administrator comments, GED file/key lookup and signature title are sent as raw text with observed `application/json` content type. They are not wrapped in JSON quotes. Empty administrator comments become exactly one space.
- **Multipart:** signature uploads take caller-supplied `FormData`. The HTTP client supplies the multipart boundary; no undocumented upload field schema is invented.
- **Product criteria:** pricing and project creation use different names/encodings for some criteria. Supplied Syntec pricing uses `OBSEQUES: "true"`, `MONTANT_OBSEQUE`, `FORMULE_AT`, and commission `"0.055"`; the create sample uses boolean `EST_OBSEQUE`, amount `OBSEQUES`, `INCAPACITE_INVALIDITE`, and commission `"10%"`. The SDK preserves the input rather than converting between those representations.
- **Proposal versus chosen quote:** `selectForProposal` sends an array and selects proposal quotes; `choose` identifies the final selected quote. They are distinct operations.
- **Asynchronous work:** carrier subscription and signature launch acknowledgements do not establish terminal state. Read quote/procedure state. The SDK does not hard-code the browser's polling interval or turn it into a provider completion guarantee.
- **Workflow order:** the collective UI can place administration before or after contractualization, depending on product/account settings. The SDK exposes individual operations and does not impose one universal workflow.

## Snapshot format and reproducibility

The snapshot uses Effect's native `{ dialect, schema, definitions }` container, with draft 2020-12 schema content. To materialize one named model as a standalone JSON Schema, combine its `schema` with a root `$defs: definitions` and `$schema: "https://json-schema.org/draft/2020-12/schema"`. JSON Schema is an approximate exported representation of the client decoder; the Effect decoder is the final authority. TypeScript brands share the same JSON string representation. FormData input is omitted rather than represented as a fabricated JSON object.

Regenerate from the current SDK after building:

```sh
pnpm --filter @mia/sdk build
node scripts/generate-curated-reference.mjs
# For CI or review, compare without writing:
node scripts/generate-curated-reference.mjs --check
```

The reference generator imports only authored SDK modules. Endpoint evidence is also recorded in [observed endpoints](../spec/observed-endpoints.json); broader static findings are explained in [reverse-engineering notes](REVERSE_ENGINEERING.md). The [sanitized fixture module](../packages/sdk/test/fixtures/postman.ts) uses synthetic names, contact details, company identifiers, project references and URLs. Tests verify full saved pricing/project envelope round-trips, identifier separation, raw/scalar/multipart bodies, payroll identifier roles and pagination. Neither fixtures nor passing tests constitute a live integration result.
