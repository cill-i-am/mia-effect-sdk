import { Schema } from "effect";
import { execute } from "../operation.js";
import { Codification, Insurer } from "../schemas/business.js";
import { collection, platform, segment } from "./_shared.js";

export const listCodifications = platform({
  id: "reference.listCodifications", method: "GET", effect: "read",
  inputSchema: Schema.Struct({ category: Schema.String, context: Schema.optionalKey(Schema.String) }),
  path: (input: { readonly category: string; readonly context?: string }) => `/codifications/lister/${segment(input.context ?? "NULL")}/${segment(input.category)}`,
  responseSchema: Schema.Array(Codification), evidence: collection("codifications/lister/NULL/RACE_ANIMAL_CHIEN"),
});
export const listInsurers = platform({
  id: "reference.listInsurers", method: "GET", effect: "read",
  path: (_: void) => "/referentiel/assureur/lister", responseSchema: Schema.Array(Insurer),
  evidence: collection("referentiel/assureur/lister"),
});
export const Reference = {
  listCodifications: (category: string, context?: string) => execute(listCodifications, { category, ...(context === undefined ? {} : { context }) }),
  listInsurers: () => execute(listInsurers, undefined),
} as const;
export const referenceOperations = [listCodifications, listInsurers] as const;
