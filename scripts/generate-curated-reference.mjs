import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Executes only the authored, built SDK. Downloaded application code is never imported or executed.
const root = fileURLToPath(new URL("../", import.meta.url));
const sdkRequire = createRequire(new URL("../packages/sdk/package.json", import.meta.url));
const effectPackage = sdkRequire("effect/package.json");
const { Schema } = await import(pathToFileURL(sdkRequire.resolve("effect")).href);
const S = await import("../packages/sdk/dist/schemas/index.js");
const api = await import("../packages/sdk/dist/services/index.js");

// Human-facing argument and model names complement metadata read directly from operation descriptors.
// Columns: operation ID, namespace method/signature, wire-body description, response-model description.
const rows = [
  ["parcours.priceProducts", "Parcours.price(request: PricingRequest)", "JSON PricingProduct[]", "PricingResponse = PartnerPricingResult[]"],
  ["parcours.createProject", "Parcours.createProject(request: CreateProjectRequest)", "JSON CreateProjectRequest", "CreatedProject { value: ProjectCreationReference }"],
  ["parcours.readProjectByEncodedId", "Parcours.readProject(encodedProjectId: EncodedProjectId)", "None", "ParcoursProject"],
  ["projects.read", "Projects.read(projectNumber: ProjectNumber)", "None", "InternalProject"],
  ["projects.readState", "Projects.readState(projectNumber: ProjectNumber)", "None", "ProjectState"],
  ["projects.enterSubscription", "Projects.enterSubscription(projectNumber: ProjectNumber)", "None", "ProjectState"],
  ["projects.readSubscription", "Projects.readSubscription(projectNumber: ProjectNumber)", "None", "Subscription"],
  ["projects.initializeSubscription", "Projects.initializeSubscription(projectNumber: ProjectNumber)", "None", "Subscription"],
  ["projects.saveSubscription", "Projects.saveSubscription(projectNumber: ProjectNumber, subscription: Subscription)", "JSON subscription object", "Subscription"],
  ["projects.transmitSubscription", "Projects.transmitSubscription(projectNumber: ProjectNumber, isUsingWebApp: boolean)", "JSON boolean: true or false", "ProjectState"],
  ["projects.validateSubscription", "Projects.validateSubscription(projectNumber: ProjectNumber)", "None", "ProjectState"],
  ["projects.transformToContract", "Projects.transformToContract(projectNumber: ProjectNumber, transformation: TransformProjectRequest)", "JSON transformation object", "Contract"],
  ["projects.readAdministration", "Projects.readAdministration(projectNumber: ProjectNumber)", "None", "Administration"],
  ["projects.saveAdministration", "Projects.saveAdministration(projectNumber: ProjectNumber, administration: Administration)", "JSON administration object", "Administration"],
  ["projects.enterAdministration", "Projects.enterAdministration(projectNumber: ProjectNumber)", "None", "ProjectState"],
  ["projects.transmitAdministration", "Projects.transmitAdministration(projectNumber: ProjectNumber)", "None", "unknown; acknowledgement shape unestablished"],
  ["quotes.listForProject", "Quotes.listForProject(projectNumber: ProjectNumber)", "None", "Quote[]"],
  ["quotes.read", "Quotes.read(quoteNumber: QuoteNumber)", "None", "Quote"],
  ["quotes.selectForProposal", "Quotes.selectForProposal(projectNumber: ProjectNumber, quoteNumbers: readonly QuoteNumber[])", "JSON array of quote numbers", "unknown"],
  ["quotes.choose", "Quotes.choose(quoteNumber: QuoteNumber)", "None", "ProjectState"],
  ["quotes.chooseAndSave", "Quotes.chooseAndSave(quoteNumber: QuoteNumber, choice: QuoteChoice)", "JSON choice; fills missing/empty devis.type", "{ devis: Quote, ...unknownFields }"],
  ["quotes.subscribeWithInsurer", "Quotes.subscribeWithInsurer(quoteNumber: QuoteNumber)", "None", "unknown; reread quote state for outcome"],
  ["quotes.subscribeManually", "Quotes.subscribeManually(quoteNumber: QuoteNumber)", "None", "unknown; reread quote state for outcome"],
  ["quotes.checkSubscription", "Quotes.checkSubscription(quoteNumber: QuoteNumber)", "None", "unknown; this is an action, not a safe read probe"],
  ["quotes.activateAdministrator", "Quotes.activateAdministrator(quoteNumber: QuoteNumber, comments?: string)", "Raw comments string; absent/empty becomes one space", "unknown; reread quote/subscription/administration"],
  ["contracts.read", "Contracts.read(contractId: ContractId)", "None", "Contract"],
  ["contracts.listForCustomer", "Contracts.listForCustomer(customerNumber: CustomerNumber)", "None", "unknown; list wrapper not established"],
  ["contracts.search", "Contracts.search(request: SearchRequest)", "JSON SearchRequest", "ContractPage { content: Contract[], totalElements: number }"],
  ["contracts.save", "Contracts.save(contract: Contract)", "JSON contract DTO; extension fields retained", "Contract"],
  ["documents.generate", "Documents.generate(request: GenerateDocumentRequest, language?: string)", "JSON generation request; language becomes Lya-Language header", "GeneratedDocument"],
  ["documents.generateEnterprisePayrollSheet", "Documents.generateEnterprisePayrollSheet(quoteNumber: QuoteNumber)", "None", "StringValue { value: document URL }"],
  ["documents.resolveDownload", "Documents.resolveDownload(fileName: string)", "Raw fileName string, not JSON quoted", "StringValue { value: download URL }"],
  ["documents.resolveUrl", "Documents.resolveUrl(completeKey: string)", "Raw completeKey string, not JSON quoted", "StringValue { value: document URL }"],
  ["documents.listForContract", "Documents.listForContract(contractId: ContractId)", "None", "Document[]"],
  ["documents.searchForContracts", "Documents.searchForContracts(request: SearchRequest)", "JSON SearchRequest", "{ content: Document[], totalElements: number, ...unknownFields }"],
  ["documents.listForAdhesion", "Documents.listForAdhesion(projectNumber: ProjectNumber)", "None", "Document[]"],
  ["documents.validateForAdhesion", "Documents.validateForAdhesion(documentId: DocumentId)", "None", "ProjectState"],
  ["documents.listForAdministration", "Documents.listForAdministration(projectNumber: ProjectNumber)", "None", "Document[]"],
  ["customers.create", "Customers.create(request: CreateCustomerRequest)", "JSON customer DTO", "unknown; no saved response supplied"],
  ["customers.read", "Customers.read(customerNumber: CustomerNumber)", "None", "Customer"],
  ["customers.searchPeople", "Customers.searchPeople(request: SearchRequest)", "JSON SearchRequest", "unknown; no page shape is promised"],
  ["customers.searchCompanies", "Customers.searchCompanies(request: SearchRequest)", "JSON SearchRequest", "unknown; no page shape is promised"],
  ["reference.listCodifications", "Reference.listCodifications(category: string, context?: string)", "None; context defaults to literal NULL", "Codification[]"],
  ["reference.listInsurers", "Reference.listInsurers()", "None", "Insurer[]"],
  ["tasks.saveObservedPayload", "Tasks.saveObservedPayload(request: TaskRequest)", "JSON sample keys, including etat* and propriétés*", "unknown; literal sample acceptance unverified"],
  ["signatures.createForAdhesion", "Signatures.createForAdhesion(projectNumber: ProjectNumber)", "None", "InternalProject"],
  ["signatures.resetForAdhesion", "Signatures.resetForAdhesion(projectNumber: ProjectNumber)", "None", "InternalProject; resets/cancels existing procedure"],
  ["signatures.transmitAdhesion", "Signatures.transmitAdhesion(projectNumber: ProjectNumber)", "None", "unknown; sends signature communications"],
  ["signatures.createProcedure", "Signatures.createProcedure(customerNumber: CustomerNumber, title: string)", "Raw title string, not JSON quoted", "CreatedSignatureProcedure { value: SignatureProcedureId }"],
  ["signatures.addSigner", "Signatures.addSigner(procedureId: SignatureProcedureId, customerNumber: CustomerNumber)", "None", "Signer"],
  ["signatures.readProcedure", "Signatures.readProcedure(procedureId: SignatureProcedureId)", "None", "SignatureProcedure"],
  ["signatures.launchProcedure", "Signatures.launchProcedure(procedureId: SignatureProcedureId)", "None; fixed sync=false and avecEmail=true query", "unknown; asynchronous launch acknowledgement"],
  ["signatures.remindProcedure", "Signatures.remindProcedure(procedureId: SignatureProcedureId)", "None", "unknown"],
  ["signatures.abandonProcedure", "Signatures.abandonProcedure(procedureId: SignatureProcedureId)", "None", "unknown; reread procedure to establish state"],
  ["signatures.updateProcedure", "Signatures.updateProcedure(procedure: SignatureProcedure)", "JSON procedure DTO", "SignatureProcedure"],
  ["signatures.updateSigner", "Signatures.updateSigner(procedureId: SignatureProcedureId, signer: Signer)", "JSON signer DTO", "Signer"],
  ["signatures.uploadDocument", "Signatures.uploadDocument(procedureId: SignatureProcedureId, form: FormData)", "Multipart FormData; field names supplied by caller", "unknown"],
  ["signatures.readProof", "Signatures.readProof(procedureId: SignatureProcedureId)", "None", "SignatureProof { value: base64 ZIP }"],
];
const descriptions = new Map(rows.map(([id, ...rest]) => [id, rest]));
const operations = api.curatedOperations;
if (descriptions.size !== operations.length || operations.some((op) => !descriptions.has(op.id))) {
  throw new Error("Curated reference descriptions and exported operations do not match");
}
const samples = Object.fromEntries([
  "projectNumber", "quoteNumber", "contractId", "customerNumber", "encodedProjectId", "procedureId", "documentId", "category", "context",
].map((name) => [name, `__${name}__`]));
const pathOf = (op) => {
  let path = op.path(samples);
  for (const [name, value] of Object.entries(samples)) path = path.replaceAll(value, `{${name}}`);
  const query = op.query?.(samples);
  if (query !== undefined) path += "?" + new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)])).toString();
  return path;
};
const evidenceOf = (op) => (op.evidence ?? []).map((entry) => entry.source === "index-CV_sfL5W.js"
  ? `main:${entry.offset} (${entry.symbol})`
  : entry.source === "enterprise-main.bundle.js"
    ? `enterprise:${entry.definitionOffset}; caller:${entry.callerOffset}`
    : `collection: ${entry.itemPath}`).join("; ");
const nativeDocument = (schema) => Schema.toJsonSchemaDocument(schema);
const registry = { ...S,
  GenerateDocumentRequest: api.GenerateDocumentRequest, GeneratedDocument: api.GeneratedDocument,
  QuoteChoice: api.QuoteChoice, ContractPage: api.ContractPage,
};
const models = Object.fromEntries(Object.entries(registry).filter(([, value]) => Schema.isSchema(value))
  .sort(([a], [b]) => a.localeCompare(b)).map(([name, schema]) => [name, nativeDocument(schema)]));
const snapshots = {
  format: "mia-sdk-curated-schema-snapshots-v1",
  generatedBy: "scripts/generate-curated-reference.mjs",
  effectVersion: effectPackage.version,
  provenance: "Authored SDK runtime schemas informed by supplied collection and static public client analysis; not a server specification",
  notes: [
    "Each model/input/response is the native { dialect, schema, definitions } result of Effect Schema.toJsonSchemaDocument.",
    "The document describes the canonical JSON-encoded side. The SDK Effect decoder remains authoritative.",
    "An operation input is its descriptor argument object, not necessarily its wire request body. Consult bodyEncoding and the Markdown reference.",
    "Known schema fields retain unknown extensions where modeled with openStruct; schema requiredness is an SDK constraint, not a server contract assertion.",
    "Brands distinguish TypeScript identifiers but do not add different JSON primitive representations.",
    "FormData has no faithful JSON representation; the upload operation input snapshot is deliberately omitted.",
    "No API operation or downloaded application JavaScript was executed to generate this file.",
  ],
  modelCount: Object.keys(models).length,
  models,
  operations: operations.map((op) => {
    const [functionSignature, bodyEncoding, resultType] = descriptions.get(op.id);
    return {
      id: op.id, service: op.service, method: op.method, path: pathOf(op), functionSignature,
      bodyEncoding, resultType, effect: op.effect, responseMode: op.responseMode,
      input: op.id === "signatures.uploadDocument" ? null : op.inputSchema ? nativeDocument(op.inputSchema) : null,
      inputOmission: op.id === "signatures.uploadDocument" ? "Multipart FormData is not a JSON body"
        : op.inputSchema ? null : "No input schema; method takes no arguments",
      response: nativeDocument(op.responseSchema), evidence: op.evidence,
    };
  }),
};

const intro = `# Curated MIA / LYA request and response reference

This reference covers all **${operations.length} curated operation descriptors** and their namespace methods. It is generated from the current authored SDK's route, method, service, effect and schema metadata. It does not execute the downloaded LYA application or call an insurance endpoint.

## Reading the reference

Every operation method in the tables returns a lazy \`Effect<Result, MiaError, MiaClient>\`. Calling the function constructs an Effect; the request occurs when the Effect is run with a configured client. All curated operations use the SDK's **envelope** response mode: the result shown in the tables is the decoded \`body\`, not the outer HTTP envelope. The observed successful envelope is:

\`\`\`json
{
  "statusHttp": "OK",
  "success": true,
  "codeMessage": null,
  "libelleMessage": null,
  "body": {}
}
\`\`\`

The common error union distinguishes configuration, authentication, transport, HTTP, malformed protocol/envelope, business-envelope, request-construction and schema failures. A transport acknowledgement is not proof of carrier acceptance, completed signature or issued cover. These curated calls perform **no automatic retries**, including operations implemented as GET. See [transport and errors](../packages/sdk/src/errors.ts) and [operation execution](../packages/sdk/src/operation.ts).

An \`unknown\` result is intentional: the route or caller is observed, but its body schema is not established. Named models contain known fields and preserve unrecognized extension fields. Most fields in frontend DTOs are optional and nullable. That reflects incomplete client evidence and form state; it does not declare the backend's mandatory fields. Dates are wire strings, not automatically converted Date instances. Arrays are readonly in inferred TypeScript types.

## Explicit service prefixes

Paths in the tables are **relative to the configured service base**, which must already contain its service prefix. Origins and credentials are supplied by the caller; the SDK has no production URL defaults. A configured credential is scoped to the services that name it.

| Service key | Synthetic example base | Curated use |
| --- | --- | --- |
| \`platform\` | \`https://platform.example.test/lyaptf/api\` | Parcours, projects, quotes, contracts, customers, reference data, platform document/signature operations |
| \`ged\` | \`https://documents.example.test/lyaGed/api\` | Document URL/download resolution |
| \`signature\` | \`https://signature.example.test/lyasign/api\` | Procedure, signer, signature-document and proof operations |
| \`message\` | \`https://messages.example.test/lyamsg/api\` | Observed task-save sample; the collection used a separate, undeclared \`msgUrl\` |

The collection's \`{{ptfUrl}}/api/v1/parcours/...\` becomes \`platform\` + \`/v1/parcours/...\`. It is not the separate frontend \`/lyaptf/v1\` prefix. \`Lya-Language\` defaults through service/client configuration; document generation can override it explicitly.

## Identifier factories

\`Schemas.encodedProjectId(value)\`, \`projectNumber(value)\`, \`quoteNumber(value)\`, \`contractId(value)\`, \`policyNumber(value)\`, \`customerNumber(value)\`, \`signatureProcedureId(value)\` and \`documentId(value)\` validate nonempty strings and return distinct branded types. All of these factories are accessed through the Schemas namespace. The functions do not convert between identifier domains. They throw on invalid input; use the corresponding Schema with \`Schema.decodeUnknownEffect\` when validation should remain inside Effect.

| Type | Source / meaning | Used by |
| --- | --- | --- |
| \`EncodedProjectId\` | Integration read DTO's \`encodedNumeroProjet\` | \`Parcours.readProject\` |
| \`ProjectNumber\` | \`numeroProjet\` or internal project's \`numero\` | Project stages, quote listing, main payroll generator |
| \`QuoteNumber\` | Quote's \`numeroInterne\` | Choice, carrier actions, enterprise payroll generator |
| \`ContractId\` | Contract's \`numeroInterne\` | Internal contract read/document routes |
| \`PolicyNumber\` | Contract's \`numeroCompagnie\` | Insurer policy reference; not a contract-record path ID |
| \`ProjectCreationReference\` | Creation result's \`body.value\` | Kept distinct: equivalence to an encoded project ID is unverified |

Path components are percent-encoded once by the SDK. Some optional response references also accept an empty string because frontend form DTOs can be blank; path factories remain nonempty. To use a nonblank returned reference in another operation, check it and keep its existing brand rather than assigning a different identifier type.

## Operations

Each table states its namespace and service key. The evidence cell uses \`main:<offset>\` for zero-based Unicode-code-point offsets in \`index-CV_sfL5W.js\`; enterprise offsets are JavaScript UTF-16 offsets. Collection references identify the supplied Postman example. The machine-readable snapshot includes the full descriptor evidence.
`;

const groups = [
  ["Parcours", "parcours", "parcours.ts", "platform"],
  ["Projects", "projects", "projects.ts", "platform"],
  ["Quotes", "quotes", "quotes.ts", "platform"],
  ["Contracts", "contracts", "contracts.ts", "platform"],
  ["Documents", "documents", "documents.ts", "platform / ged, explicitly shown per row"],
  ["Customers", "customers", "customers.ts", "platform"],
  ["Reference", "reference", "reference.ts", "platform"],
  ["Tasks", "tasks", "tasks.ts", "messaging"],
  ["Signatures", "signatures", "signatures.ts", "platform / signature, explicitly shown per row"],
];
const escape = (text) => String(text).replaceAll("|", "\\|");
let tables = "";
for (const [title, prefix, file, service] of groups) {
  tables += `\n### ${title}\n\nService: **${service}**. [Implementation](../packages/sdk/src/services/${file}).\n\n`;
  tables += "| SDK function and input | HTTP method / relative path | Body encoding | Decoded result | Effect and evidence |\n| --- | --- | --- | --- | --- |\n";
  for (const op of operations.filter((op) => op.id.startsWith(prefix + "."))) {
    const [signature, body, result] = descriptions.get(op.id);
    const route = `${op.method} ${pathOf(op)}`;
    const serviceNote = prefix === "documents" || prefix === "signatures" ? ` [${op.service}]` : "";
    tables += `| \`${escape(signature)}\` | \`${escape(route)}\`${serviceNote} | ${escape(body)} | \`${escape(result)}\` | **${op.effect}**; ${escape(evidenceOf(op))} |\n`;
  }
}

const details = `
## Additional helpers using those operations

These helpers do not introduce additional endpoints.

### Payroll setup sheet

\`Documents.generatePayrollSheet(projectNumber: ProjectNumber, language?: string)\` calls \`Documents.generate\` with this exact payload:

\`\`\`json
{
  "stockage": false,
  "typeDocument": "FICHE_PARAMETRAGE_PAIE:TYPE_DOCUMENT_GENERE",
  "typeNumero": "PROJET_NUMERO",
  "numero": "PROJECT-EXAMPLE",
  "test": false
}
\`\`\`

Its result may contain \`fileName\`; pass that unchanged to \`Documents.resolveDownload\` and read the returned \`value\` URL. This is separate from \`Documents.generateEnterprisePayrollSheet(quoteNumber)\`, whose GET path takes the selected quote's \`numeroInterne\` and returns the URL in \`value\`. The enterprise caller explicitly uses \`getDevisChoisi().numeroInterne\`.

### Contract pagination

\`Contracts.stream(request: SearchRequest)\` returns \`Stream<Contract, MiaError, MiaClient>\`. It starts at \`pageNumero\`, requests one page at a time and emits individual contracts. It advances while the observed \`totalElements\` indicates more pages and stops immediately on an empty page. It does not prefetch or retry. Concurrent server changes can affect a paged result; no snapshot/cursor guarantee was observed.

\`SearchRequest\` requires \`criteres\`, integer \`pageNumero >= 0\` and integer \`nbParPage >= 1\`; \`ordres\` is optional and its element schema remains unknown. A criterion has \`reference: string\`, \`valeur: unknown\` and optional \`operation: string\`. Actual contract callers omit \`operation\` for some filters, so it is not made mandatory. The API-wide supported operator/reference combinations are not established.

\`\`\`json
{
  "criteres": [
    { "reference": "contrat.etats", "valeur": ["SOUSCRIT:ETAT_CONTRAT"] }
  ],
  "pageNumero": 0,
  "nbParPage": 50
}
\`\`\`

## Request and response models

The [schema source](../packages/sdk/src/schemas/index.ts) is exported as the \`Schemas\` namespace. \`GenerateDocumentRequest\`, \`GeneratedDocument\`, \`QuoteChoice\` and \`ContractPage\` are additionally exported from their service modules. The [native Effect JSON Schema snapshots](../spec/curated-schema-snapshots.json) contain **${Object.keys(models).length} named models** and input/response documents for all ${operations.length} descriptors, including exact known field constraints. An operation's input snapshot describes its **descriptor argument**, which may wrap a body and path parameters; it is not an inferred server request-body specification.

| Model / area | Known shape and interpretation |
| --- | --- |
| \`PricingProduct\` / \`PricingRequest\` | An array of product objects: \`codeProduit\`, \`parametres: Criterion[]\`, optional \`critereElligibilite\` map. The eligibility key is deliberately spelled exactly as observed. |
| \`Criterion\` | \`reference\`, optional \`critereRef\`, nullable optional \`stringValue\`, \`booleanValue\`, \`integerValue\`, \`decimalValue\`, \`dateValue\`, \`parentRef\`, \`orderIndex\`, \`valeurInString\`; optional \`nullValue\`. Values are not coerced. |
| \`PricingResponse\` | Array of partner results. Known fields include \`partenaire\`, \`status\`, \`message\`, \`duration\`, and \`resultat.simulations[]\`. Simulation fields include product/formula/status, criteria and contribution basis/rates. |
| \`CreateProjectRequest\` | \`besoin: ProjectNeed\`, \`codeProduit\`, \`parametres[]\`, optional \`critereElligibilite\`. The SDK requires these primary fields for its creation helper; this is not a complete declaration of server requiredness. |
| \`ProjectNeed\` | \`type\`; optional company, contact, personnas, consent, current-policy, desired date, employee demographics, contribution and coverage fields. The Syntec key \`sinitresEnCours\` is preserved with its observed spelling. |
| \`ContributionBasis\` / \`ContributionRate\` | Known contribution-type, chosen-basis, employer-share, amount and PMSS fields. Numeric values and nulls remain distinct. |
| \`CreatedProject\` | \`value: ProjectCreationReference\`. No automatic conversion to an encoded project ID. |
| \`ParcoursProject\` | \`numeroProjet\`, \`encodedNumeroProjet\`; known optional quote, selected-quotes, need, insured, state, proposal documents and signature URL fields. Full sanitized saved response round-trips in tests. |
| \`InternalProject\` / \`ProjectState\` | Known project, selected-quote, state and signature-procedure fields; full DTOs are not established. Earlier \`numeroProcedureSignatureElectronique\` and final \`numeroProcedureSignatureElectroniqueAdhesion\` remain distinct. |
| \`Quote\` / \`QuoteChoice\` | Known quote/project/customer references, product, formula, state, amount, contribution and launch-information fields. A choice requires \`devis\` and retains other fields. Missing/null/empty \`devis.type\` is filled with \`projetDevisDTO\`; an existing nonempty discriminator is preserved. |
| \`Subscription\` | Known send/validation/receipt dates, \`contratLie\`, status, refusal/reason and internal-validation fields; extensions retained. \`contratLie\` remains an unbranded string because caller semantics vary. |
| \`Administration\` | Known \`dateEnvoiMiseEnGestion\` and \`numeroContratGestionnaire\`, plus extensions. |
| \`TransformProjectRequest\` | Optional known \`numeroDevisChoisi\`, \`numeroCompagnie\`, dates, renewal type, premiums, commission fields, \`typeMontant\`, and \`souscription\`; see exact list below. UI-only requiredness is not imposed as server requiredness. |
| \`Contract\` | Known internal, carrier, broker, insured, membership and administrator references, states/dates/premiums; unknown fields preserved. A saved contract object may include many additional provider fields. |
| \`GenerateDocumentRequest\` | \`typeDocument\`; optional \`typeNumero\`, \`numero\`, \`stockage\`, \`test\` and extensions. |
| \`GeneratedDocument\` / \`Document\` | Known filename/upload-name/URL and document metadata fields; generation result fields may differ by requested type. |
| \`CreateCustomerRequest\` / \`Customer\` | Creation requires \`type\` and \`personne\` with \`personne.type\`. Known individual, company, address and linked-contact fields are modeled. Existing contact's customer number and numeric person \`identifiant\` remain different fields. |
| \`SignatureProcedure\` / \`Signer\` | Known procedure number/state/error, signers and documents; signer state, emitter flag and signature link. The decoder keeps unknown state strings and additional provider fields. |
| \`SignatureProof\` | \`value: string\` contains base64 ZIP bytes. It is not a URL. |
| \`TaskRequest\` | Optional sample fields including literal \`etat*\` and accented \`propriétés*\`. These may be documentation artefacts; the helper does not normalize them or claim server acceptance. |

### Transformation fields

\`TransformProjectRequest\` models these exact wire names: \`numeroDevisChoisi\`, \`numeroCompagnie\`, \`souscriptionDate\`, \`effetDate\`, \`renouvellementTypeCode\`, \`echeanceDate\`, \`resiliationDate\`, \`primeAnnuelleTTC\`, \`primeAnnuelleHT\`, \`commissionMontant\`, \`commissionNextMontant\`, \`commissionTaux\`, \`commissionNextTaux\`, \`typeMontant\`, \`souscription\`. The browser dialog maps form \`devisNumeroInterne\` to wire \`numeroDevisChoisi\`, and form \`typeCode\` to wire \`renouvellementTypeCode\`. Its normal completion caller includes \`souscription.statutProjetCode = "SOUSCRIT:STATUT_PROJET"\`; the SDK does not silently set workflow state for callers.

### Policy and contract reference fields

| Field | Interpretation |
| --- | --- |
| \`Contract.numeroInterne\` | Internal LYA contract record ID; \`ContractId\` |
| \`Contract.numeroCompagnie\` | Carrier policy/contract reference; \`PolicyNumber\` |
| \`Contract.numeroCourtier\` | Broker's reference |
| \`Contract.assureNumero\` | Carrier insured/customer reference |
| \`Contract.adhesionNumero\` | Carrier membership/enrolment reference |
| \`Contract.risqueDetaille.delegataireNumero\` | Administrator reference |
| \`Administration.numeroContratGestionnaire\` | Contract number produced by the administrator |
| \`Subscription.contratLie\` | Overloaded across UI callers; do not assume it always means the carrier policy number |

## Wire details that matter

- **Transmit subscription:** sends the JSON scalar \`false\` or \`true\`, not \`{ isUsingWebApp: ... }\` and not a quoted string.
- **Raw text:** administrator comments, GED file/key lookup and signature title are sent as raw text with observed \`application/json\` content type. They are not wrapped in JSON quotes. Empty administrator comments become exactly one space.
- **Multipart:** signature uploads take caller-supplied \`FormData\`. The HTTP client supplies the multipart boundary; no undocumented upload field schema is invented.
- **Product criteria:** pricing and project creation use different names/encodings for some criteria. Supplied Syntec pricing uses \`OBSEQUES: "true"\`, \`MONTANT_OBSEQUE\`, \`FORMULE_AT\`, and commission \`"0.055"\`; the create sample uses boolean \`EST_OBSEQUE\`, amount \`OBSEQUES\`, \`INCAPACITE_INVALIDITE\`, and commission \`"10%"\`. The SDK preserves the input rather than converting between those representations.
- **Proposal versus chosen quote:** \`selectForProposal\` sends an array and selects proposal quotes; \`choose\` identifies the final selected quote. They are distinct operations.
- **Asynchronous work:** carrier subscription and signature launch acknowledgements do not establish terminal state. Read quote/procedure state. The SDK does not hard-code the browser's polling interval or turn it into a provider completion guarantee.
- **Workflow order:** the collective UI can place administration before or after contractualization, depending on product/account settings. The SDK exposes individual operations and does not impose one universal workflow.

## Snapshot format and reproducibility

The snapshot uses Effect's native \`{ dialect, schema, definitions }\` container, with draft 2020-12 schema content. To materialize one named model as a standalone JSON Schema, combine its \`schema\` with a root \`$defs: definitions\` and \`$schema: "https://json-schema.org/draft/2020-12/schema"\`. JSON Schema is an approximate exported representation of the client decoder; the Effect decoder is the final authority. TypeScript brands share the same JSON string representation. FormData input is omitted rather than represented as a fabricated JSON object.

Regenerate from the current SDK after building:

\`\`\`sh
pnpm --filter @mia/sdk build
node scripts/generate-curated-reference.mjs
# For CI or review, compare without writing:
node scripts/generate-curated-reference.mjs --check
\`\`\`

The reference generator imports only authored SDK modules. Endpoint evidence is also recorded in [observed endpoints](../spec/observed-endpoints.json); broader static findings are explained in [reverse-engineering notes](REVERSE_ENGINEERING.md). The [sanitized fixture module](../packages/sdk/test/fixtures/postman.ts) uses synthetic names, contact details, company identifiers, project references and URLs. Tests verify full saved pricing/project envelope round-trips, identifier separation, raw/scalar/multipart bodies, payroll identifier roles and pagination. Neither fixtures nor passing tests constitute a live integration result.
`;
const markdown = intro + tables + details;
const outputs = [
  ["docs/CURATED_API.md", markdown],
  ["spec/curated-schema-snapshots.json", JSON.stringify(snapshots, null, 2) + "\n"],
];
for (const [relative, content] of outputs) {
  const destination = resolve(root, relative);
  if (process.argv.includes("--check")) {
    const current = await readFile(destination, "utf8").catch(() => "");
    if (current !== content) throw new Error(`${relative} is stale. Rebuild the SDK and regenerate the curated reference.`);
  } else {
    await mkdir(resolve(destination, ".."), { recursive: true });
    await writeFile(destination, content);
  }
}
console.log(`Curated reference ${process.argv.includes("--check") ? "verified" : "generated"}: ${operations.length} operations, ${Object.keys(models).length} named models.`);
