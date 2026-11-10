import { Schema } from "effect";
import { Body, defineOperation, execute, type Operation } from "../operation.js";
import { InternalProject } from "../schemas/business.js";
import { CustomerNumber, ProjectNumber, SignatureProcedureId } from "../schemas/identifiers.js";
import { CreatedSignatureProcedure, SignatureProcedure, SignatureProof, Signer } from "../schemas/signatures.js";
import { observed, platform, ProcedureInput, ProjectInput, segment } from "./_shared.js";

const signature = <I, A>(definition: Omit<Operation<I, A>, "service" | "responseMode">): Operation<I, A> =>
  defineOperation({ ...definition, service: "signature", responseMode: "envelope" });

export const createAdhesionSignature = platform({
  id: "signatures.createForAdhesion", method: "PUT", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/adhesion/signature/create/${segment(projectNumber)}`,
  responseSchema: InternalProject, evidence: observed("createSignatureAdhesion$1", 9919460),
});
/** The UI presents this endpoint as cancelling/resetting the existing signature procedure. */
export const resetAdhesionSignature = platform({
  id: "signatures.resetForAdhesion", method: "PUT", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/adhesion/signature/init/${segment(projectNumber)}`,
  responseSchema: InternalProject, evidence: observed("reinitSignatureAdhesion", 9919362),
});
/** Sends signing communications; a side-effecting GET with no automatic retry. */
export const transmitAdhesion = platform({
  id: "signatures.transmitAdhesion", method: "GET", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/adhesion/transmettre/${segment(projectNumber)}`,
  responseSchema: Schema.Unknown, evidence: observed("sendAdhesion$1", 9919276),
});
export const createSignatureProcedure = platform({
  id: "signatures.createProcedure", method: "POST", effect: "mutation",
  inputSchema: Schema.Struct({ customerNumber: CustomerNumber, title: Schema.String }),
  path: (input: { readonly customerNumber: CustomerNumber; readonly title: string }) => `/courtage/signature/initier/${segment(input.customerNumber)}`,
  body: (input) => Body.text(input.title, "application/json"), responseSchema: CreatedSignatureProcedure,
  evidence: observed("createProcedure", 9890494),
});
export const addSignatureSigner = platform({
  id: "signatures.addSigner", method: "POST", effect: "mutation",
  inputSchema: Schema.Struct({ procedureId: SignatureProcedureId, customerNumber: CustomerNumber }),
  path: (input: { readonly procedureId: SignatureProcedureId; readonly customerNumber: CustomerNumber }) => `/courtage/signature/${segment(input.procedureId)}/signataires/${segment(input.customerNumber)}`,
  responseSchema: Signer, evidence: observed("addProcedureSignataire", 9890573),
});
export const readSignatureProcedure = signature({
  id: "signatures.readProcedure", method: "GET", effect: "read", inputSchema: ProcedureInput,
  path: ({ procedureId }: ProcedureInput) => `/procedures/lire/${segment(procedureId)}`,
  responseSchema: SignatureProcedure, evidence: observed("getProcedureById", 6196193),
});
/** Launches asynchronously with email. An acknowledged response does not mean the procedure is signed. */
export const launchSignatureProcedure = signature({
  id: "signatures.launchProcedure", method: "PUT", effect: "mutation", inputSchema: ProcedureInput,
  path: ({ procedureId }: ProcedureInput) => `/procedures/init/${segment(procedureId)}`,
  query: () => ({ sync: false, avecEmail: true }), responseSchema: Schema.Unknown,
  evidence: observed("launchProcedure", 6196958),
});
export const remindSignatureProcedure = signature({
  id: "signatures.remindProcedure", method: "POST", effect: "mutation", inputSchema: ProcedureInput,
  path: ({ procedureId }: ProcedureInput) => `/procedures/relancer/${segment(procedureId)}`,
  responseSchema: Schema.Unknown, evidence: observed("remindProcedure", 6197065),
});
export const abandonSignatureProcedure = signature({
  id: "signatures.abandonProcedure", method: "PUT", effect: "mutation", inputSchema: ProcedureInput,
  path: ({ procedureId }: ProcedureInput) => `/procedures/abandonner/${segment(procedureId)}`,
  responseSchema: Schema.Unknown, evidence: observed("cancelProcedure", 6196871),
});
export const updateSignatureProcedure = signature({
  id: "signatures.updateProcedure", method: "PUT", effect: "mutation", inputSchema: SignatureProcedure,
  path: (_: SignatureProcedure) => "/procedures/modifier", body: Body.json,
  responseSchema: SignatureProcedure, evidence: observed("updateProcedure", 6196390),
});
export const updateSignatureSigner = signature({
  id: "signatures.updateSigner", method: "PUT", effect: "mutation",
  inputSchema: Schema.Struct({ procedureId: SignatureProcedureId, signer: Signer }),
  path: (input: { readonly procedureId: SignatureProcedureId; readonly signer: Signer }) => `/signataires/modifier/${segment(input.procedureId)}`,
  body: (input) => Body.json(input.signer), responseSchema: Signer,
  evidence: observed("updateSignataire", 6197446),
});
export const uploadSignatureDocument = signature({
  id: "signatures.uploadDocument", method: "POST", effect: "mutation",
  inputSchema: Schema.Struct({ procedureId: SignatureProcedureId, form: Schema.instanceOf(FormData) }),
  path: (input: { readonly procedureId: SignatureProcedureId; readonly form: FormData }) => `/documents/ajouter/${segment(input.procedureId)}`,
  body: (input) => Body.formData(input.form), responseSchema: Schema.Unknown,
  evidence: observed("ajouterDocument", 9891069),
});
export const readSignatureProof = signature({
  id: "signatures.readProof", method: "GET", effect: "read", inputSchema: ProcedureInput,
  path: ({ procedureId }: ProcedureInput) => `/procedures/proof/${segment(procedureId)}`,
  responseSchema: SignatureProof, evidence: observed("getProcedureProofFile", 6197151),
});

export const Signatures = {
  createForAdhesion: (projectNumber: ProjectNumber) => execute(createAdhesionSignature, { projectNumber }),
  resetForAdhesion: (projectNumber: ProjectNumber) => execute(resetAdhesionSignature, { projectNumber }),
  transmitAdhesion: (projectNumber: ProjectNumber) => execute(transmitAdhesion, { projectNumber }),
  createProcedure: (customerNumber: CustomerNumber, title: string) => execute(createSignatureProcedure, { customerNumber, title }),
  addSigner: (procedureId: SignatureProcedureId, customerNumber: CustomerNumber) => execute(addSignatureSigner, { procedureId, customerNumber }),
  readProcedure: (procedureId: SignatureProcedureId) => execute(readSignatureProcedure, { procedureId }),
  launchProcedure: (procedureId: SignatureProcedureId) => execute(launchSignatureProcedure, { procedureId }),
  remindProcedure: (procedureId: SignatureProcedureId) => execute(remindSignatureProcedure, { procedureId }),
  abandonProcedure: (procedureId: SignatureProcedureId) => execute(abandonSignatureProcedure, { procedureId }),
  updateProcedure: (procedure: SignatureProcedure) => execute(updateSignatureProcedure, procedure),
  updateSigner: (procedureId: SignatureProcedureId, signer: Signer) => execute(updateSignatureSigner, { procedureId, signer }),
  uploadDocument: (procedureId: SignatureProcedureId, form: FormData) => execute(uploadSignatureDocument, { procedureId, form }),
  readProof: (procedureId: SignatureProcedureId) => execute(readSignatureProof, { procedureId }),
} as const;
export const signatureOperations = [createAdhesionSignature, resetAdhesionSignature, transmitAdhesion, createSignatureProcedure,
  addSignatureSigner, readSignatureProcedure, launchSignatureProcedure, remindSignatureProcedure, abandonSignatureProcedure,
  updateSignatureProcedure, updateSignatureSigner, uploadSignatureDocument, readSignatureProof] as const;
