import { Schema } from "effect";
import { Body, execute } from "../operation.js";
import { CreatedProject, CreateProjectRequest, ParcoursProject, PricingRequest, PricingResponse } from "../schemas/business.js";
import { EncodedProjectId } from "../schemas/identifiers.js";
import { collection, platform, segment } from "./_shared.js";

export const priceProducts = platform({
  id: "parcours.priceProducts", method: "POST", effect: "read",
  inputSchema: PricingRequest, path: (_: PricingRequest) => "/v1/parcours/tarif", body: Body.json,
  responseSchema: PricingResponse, evidence: collection("0/0..0/3"),
});
export const createProject = platform({
  id: "parcours.createProject", method: "POST", effect: "mutation",
  inputSchema: CreateProjectRequest, path: (_: CreateProjectRequest) => "/v1/parcours/devis", body: Body.json,
  responseSchema: CreatedProject, evidence: collection("3/0..3/3"),
});
export const readProjectByEncodedId = platform({
  id: "parcours.readProjectByEncodedId", method: "GET", effect: "read",
  inputSchema: Schema.Struct({ encodedProjectId: EncodedProjectId }),
  path: (input: { readonly encodedProjectId: EncodedProjectId }) => `/v1/parcours/projet/${segment(input.encodedProjectId)}`,
  responseSchema: ParcoursProject, evidence: collection("3/4"),
});

export const Parcours = {
  price: (request: PricingRequest) => execute(priceProducts, request),
  createProject: (request: CreateProjectRequest) => execute(createProject, request),
  readProject: (encodedProjectId: EncodedProjectId) => execute(readProjectByEncodedId, { encodedProjectId }),
} as const;
export const parcoursOperations = [priceProducts, createProject, readProjectByEncodedId] as const;
