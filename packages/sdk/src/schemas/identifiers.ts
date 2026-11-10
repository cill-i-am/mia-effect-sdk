import { Schema } from "effect";

export const EncodedProjectId = Schema.NonEmptyString.pipe(Schema.brand("Mia.EncodedProjectId"));
export type EncodedProjectId = typeof EncodedProjectId.Type;
export const ProjectNumber = Schema.NonEmptyString.pipe(Schema.brand("Mia.ProjectNumber"));
export type ProjectNumber = typeof ProjectNumber.Type;
export const QuoteNumber = Schema.NonEmptyString.pipe(Schema.brand("Mia.QuoteNumber"));
export type QuoteNumber = typeof QuoteNumber.Type;
export const ContractId = Schema.NonEmptyString.pipe(Schema.brand("Mia.ContractId"));
export type ContractId = typeof ContractId.Type;
export const PolicyNumber = Schema.NonEmptyString.pipe(Schema.brand("Mia.PolicyNumber"));
export type PolicyNumber = typeof PolicyNumber.Type;
export const CustomerNumber = Schema.NonEmptyString.pipe(Schema.brand("Mia.CustomerNumber"));
export type CustomerNumber = typeof CustomerNumber.Type;
export const SignatureProcedureId = Schema.NonEmptyString.pipe(Schema.brand("Mia.SignatureProcedureId"));
export type SignatureProcedureId = typeof SignatureProcedureId.Type;
export const DocumentId = Schema.NonEmptyString.pipe(Schema.brand("Mia.DocumentId"));
export type DocumentId = typeof DocumentId.Type;

/** POST parcours/devis returns body.value. Its equivalence to encodedNumeroProjet is unverified. */
export const ProjectCreationReference = Schema.NonEmptyString.pipe(Schema.brand("Mia.ProjectCreationReference"));
export type ProjectCreationReference = typeof ProjectCreationReference.Type;

/** Explicit factories validate non-empty strings without guessing or converting identifier domains. */
export const encodedProjectId = (value: string): EncodedProjectId => Schema.decodeUnknownSync(EncodedProjectId)(value);
export const projectNumber = (value: string): ProjectNumber => Schema.decodeUnknownSync(ProjectNumber)(value);
export const quoteNumber = (value: string): QuoteNumber => Schema.decodeUnknownSync(QuoteNumber)(value);
export const contractId = (value: string): ContractId => Schema.decodeUnknownSync(ContractId)(value);
export const policyNumber = (value: string): PolicyNumber => Schema.decodeUnknownSync(PolicyNumber)(value);
export const customerNumber = (value: string): CustomerNumber => Schema.decodeUnknownSync(CustomerNumber)(value);
export const signatureProcedureId = (value: string): SignatureProcedureId => Schema.decodeUnknownSync(SignatureProcedureId)(value);
export const documentId = (value: string): DocumentId => Schema.decodeUnknownSync(DocumentId)(value);
