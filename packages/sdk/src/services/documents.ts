import { Schema } from "effect";
import { Body, defineOperation, execute } from "../operation.js";
import { Document, ProjectState } from "../schemas/business.js";
import { openStruct, optionalNullable, pageOf, SearchRequest, StringValue } from "../schemas/common.js";
import { ContractId, DocumentId, ProjectNumber, QuoteNumber } from "../schemas/identifiers.js";
import { ContractInput, DocumentInput, observed, platform, ProjectInput, QuoteInput, segment } from "./_shared.js";

export const GenerateDocumentRequest = openStruct({
  typeDocument: Schema.String, typeNumero: Schema.optionalKey(Schema.String), numero: Schema.optionalKey(Schema.String),
  stockage: Schema.optionalKey(Schema.Boolean), test: Schema.optionalKey(Schema.Boolean),
});
export type GenerateDocumentRequest = typeof GenerateDocumentRequest.Type;
export const GeneratedDocument = openStruct({
  fileName: optionalNullable(Schema.String), fileUploadedName: optionalNullable(Schema.String), url: optionalNullable(Schema.String),
});
export type GeneratedDocument = typeof GeneratedDocument.Type;
export const generateDocuments = platform({
  id: "documents.generate", method: "POST", effect: "mutation",
  inputSchema: Schema.Struct({ request: GenerateDocumentRequest, language: Schema.optionalKey(Schema.String) }),
  path: (_: { readonly request: GenerateDocumentRequest; readonly language?: string }) => "/documents/generer",
  body: (input) => Body.json(input.request),
  headers: (input) => input.language === undefined ? {} : { "Lya-Language": input.language },
  responseSchema: GeneratedDocument, evidence: observed("genererDocuments", 9816152),
});
/** Enterprise flow takes the chosen quote's numeroInterne, never a project number. */
export const generateEnterprisePayrollSheet = platform({
  id: "documents.generateEnterprisePayrollSheet", method: "GET", effect: "mutation", inputSchema: QuoteInput,
  path: ({ quoteNumber }: QuoteInput) => `/assure/projet/parcours/genererFicheParametragePaie/${segment(quoteNumber)}`,
  responseSchema: StringValue,
  evidence: [{ source: "enterprise-main.bundle.js", definitionOffset: 91947, callerOffset: 272729,
    offsetUnit: "javascriptUtf16", caller: "getDevisChoisi().numeroInterne", verification: "static-client-code; no endpoint called" }],
});
export const resolveDocumentDownload = defineOperation({
  id: "documents.resolveDownload", service: "ged", method: "POST", effect: "read", responseMode: "envelope",
  inputSchema: Schema.Struct({ fileName: Schema.String }), path: (_: { readonly fileName: string }) => "/documents/download/NULL",
  body: (input) => Body.text(input.fileName, "application/json"), responseSchema: StringValue,
  evidence: observed("downloadDocument$1", 2315604),
});
export const resolveDocumentUrl = defineOperation({
  id: "documents.resolveUrl", service: "ged", method: "POST", effect: "read", responseMode: "envelope",
  inputSchema: Schema.Struct({ completeKey: Schema.String }), path: (_: { readonly completeKey: string }) => "/documents/url",
  body: (input) => Body.text(input.completeKey, "application/json"), responseSchema: StringValue,
  evidence: observed("lireUrl", 2315790),
});
export const listContractDocuments = platform({
  id: "documents.listForContract", method: "GET", effect: "read", inputSchema: ContractInput,
  path: ({ contractId }: ContractInput) => `/courtage/contrat/documents/lister/${segment(contractId)}`,
  responseSchema: Schema.Array(Document), evidence: observed("listContratDocument", 6029259),
});
export const searchContractDocuments = platform({
  id: "documents.searchForContracts", method: "POST", effect: "read", inputSchema: SearchRequest,
  path: (_: SearchRequest) => "/courtage/contrat/documents/lister", body: Body.json,
  responseSchema: pageOf(Document), evidence: observed("searchContratDocuments", 6029979),
});
export const listAdhesionDocuments = platform({
  id: "documents.listForAdhesion", method: "GET", effect: "read", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/adhesion/documents/lister/${segment(projectNumber)}`,
  responseSchema: Schema.Array(Document), evidence: observed("listProjectAdhesionDocuments$1", 9918283),
});
export const validateAdhesionDocument = platform({
  id: "documents.validateForAdhesion", method: "PUT", effect: "mutation", inputSchema: DocumentInput,
  path: ({ documentId }: DocumentInput) => `/courtage/projet/adhesion/documents/valider/${segment(documentId)}`,
  responseSchema: ProjectState, evidence: observed("validateProjectAdhesionDocument$1", 9919562),
});
export const listAdministrationDocuments = platform({
  id: "documents.listForAdministration", method: "GET", effect: "read", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/miseEnGestion/documents/lister/${segment(projectNumber)}`,
  responseSchema: Schema.Array(Document), evidence: observed("listProjectGestionDocuments$1", 9928272),
});

const generationInput = (request: GenerateDocumentRequest, language?: string) =>
  ({ request, ...(language === undefined ? {} : { language }) });
export const Documents = {
  generate: (request: GenerateDocumentRequest, language?: string) => execute(generateDocuments, generationInput(request, language)),
  generatePayrollSheet: (projectNumber: ProjectNumber, language?: string) => execute(generateDocuments, generationInput({
    stockage: false, typeDocument: "FICHE_PARAMETRAGE_PAIE:TYPE_DOCUMENT_GENERE",
    typeNumero: "PROJET_NUMERO", numero: projectNumber, test: false,
  }, language)),
  generateEnterprisePayrollSheet: (quoteNumber: QuoteNumber) => execute(generateEnterprisePayrollSheet, { quoteNumber }),
  resolveDownload: (fileName: string) => execute(resolveDocumentDownload, { fileName }),
  resolveUrl: (completeKey: string) => execute(resolveDocumentUrl, { completeKey }),
  listForContract: (contractId: ContractId) => execute(listContractDocuments, { contractId }),
  searchForContracts: (request: SearchRequest) => execute(searchContractDocuments, request),
  listForAdhesion: (projectNumber: ProjectNumber) => execute(listAdhesionDocuments, { projectNumber }),
  validateForAdhesion: (documentId: DocumentId) => execute(validateAdhesionDocument, { documentId }),
  listForAdministration: (projectNumber: ProjectNumber) => execute(listAdministrationDocuments, { projectNumber }),
} as const;
export const documentOperations = [generateDocuments, generateEnterprisePayrollSheet, resolveDocumentDownload, resolveDocumentUrl,
  listContractDocuments, searchContractDocuments, listAdhesionDocuments, validateAdhesionDocument, listAdministrationDocuments] as const;
