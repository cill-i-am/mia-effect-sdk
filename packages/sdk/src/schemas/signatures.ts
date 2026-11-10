import { Schema } from "effect";
import { openStruct, optionalNullable as n } from "./common.js";
import { SignatureProcedureId } from "./identifiers.js";
import { Document } from "./business.js";

/** Known UI constants, not an exhaustive claim about future server states. */
export const KnownProcedureStates = {
  Created: "CREEE:ETAT_PROCEDURE", Initialized: "INITIEE:ETAT_PROCEDURE",
  AwaitingSignature: "SIGNATURE_EN_ATTENTE:ETAT_PROCEDURE", Completed: "TERMINEE:ETAT_PROCEDURE",
  Abandoned: "ABANDONNEE:ETAT_PROCEDURE", Refused: "REFUSEE:ETAT_PROCEDURE", Expired: "EXPIREE:ETAT_PROCEDURE",
} as const;
export const KnownSignerStates = {
  Created: "CREE:ETAT_SIGNATAIRE", AwaitingSignature: "SIGNATURE_EN_ATTENTE:ETAT_SIGNATAIRE",
  Refused: "SIGNATURE_REFUSEE:ETAT_SIGNATAIRE", Accepted: "SIGNATURE_ACCEPTEE:ETAT_SIGNATAIRE",
  Expired: "SIGNATURE_EXPIREE:ETAT_SIGNATAIRE",
} as const;
export const Signer = openStruct({
  numero: n(Schema.String), numeroPersonne: n(Schema.Union([Schema.String, Schema.Number])), etatCode: n(Schema.String),
  estEmetteur: n(Schema.Boolean), lienSignature: n(Schema.String),
});
export type Signer = typeof Signer.Type;
export const SignatureProcedure = openStruct({
  numero: n(SignatureProcedureId), etatCode: n(Schema.String), etat: n(Schema.String),
  enErreur: n(Schema.Boolean), erreurMessage: n(Schema.String),
  signataires: n(Schema.Array(Signer)), documents: n(Schema.Array(Document)),
});
export type SignatureProcedure = typeof SignatureProcedure.Type;
export const CreatedSignatureProcedure = openStruct({ value: SignatureProcedureId });
/** value is base64 ZIP data, not a URL. The SDK deliberately does not log or inspect it. */
export const SignatureProof = openStruct({ value: Schema.String });
