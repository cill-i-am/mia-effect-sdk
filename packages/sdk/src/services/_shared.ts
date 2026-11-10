import { Schema } from "effect";
import { defineOperation, type Operation } from "../operation.js";
import { ContractId, CustomerNumber, DocumentId, ProjectNumber, QuoteNumber, SignatureProcedureId } from "../schemas/identifiers.js";

export const segment = (value: string): string => encodeURIComponent(value);
export const platform = <I, A>(definition: Omit<Operation<I, A>, "service" | "responseMode">): Operation<I, A> =>
  defineOperation({ ...definition, service: "platform", responseMode: "envelope" });
export const observed = (symbol: string, offset: number) => [{
  source: "index-CV_sfL5W.js", symbol, offset, offsetUnit: "unicodeCodePoints",
  verification: "static-client-code; no endpoint called",
}] as const;
export const collection = (itemPath: string) => [{
  source: "API LYA pour MIA.postman_collection (3).json", itemPath,
  verification: "supplied-collection; no endpoint called",
}] as const;

export const ProjectInput = Schema.Struct({ projectNumber: ProjectNumber });
export type ProjectInput = typeof ProjectInput.Type;
export const QuoteInput = Schema.Struct({ quoteNumber: QuoteNumber });
export type QuoteInput = typeof QuoteInput.Type;
export const ContractInput = Schema.Struct({ contractId: ContractId });
export type ContractInput = typeof ContractInput.Type;
export const CustomerInput = Schema.Struct({ customerNumber: CustomerNumber });
export type CustomerInput = typeof CustomerInput.Type;
export const ProcedureInput = Schema.Struct({ procedureId: SignatureProcedureId });
export type ProcedureInput = typeof ProcedureInput.Type;
export const DocumentInput = Schema.Struct({ documentId: DocumentId });
export type DocumentInput = typeof DocumentInput.Type;
