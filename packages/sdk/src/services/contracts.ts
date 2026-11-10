import { Effect, Option, Schema, Stream } from "effect";
import { Body, execute } from "../operation.js";
import { Contract } from "../schemas/business.js";
import { pageOf, SearchRequest } from "../schemas/common.js";
import { ContractId, CustomerNumber } from "../schemas/identifiers.js";
import { ContractInput, CustomerInput, observed, platform, segment } from "./_shared.js";

export const ContractPage = pageOf(Contract);
export type ContractPage = typeof ContractPage.Type;
export const readContract = platform({
  id: "contracts.read", method: "GET", effect: "read", inputSchema: ContractInput,
  path: ({ contractId }: ContractInput) => `/courtage/contrat/lire/${segment(contractId)}`,
  responseSchema: Contract, evidence: observed("readContrat$1", 6028383),
});
export const listContractsForCustomer = platform({
  id: "contracts.listForCustomer", method: "GET", effect: "read", inputSchema: CustomerInput,
  path: ({ customerNumber }: CustomerInput) => `/courtage/contrat/listerParClient/${segment(customerNumber)}`,
  // This definition is visible, but a complete result shape was not established.
  responseSchema: Schema.Unknown, evidence: observed("listerContratsClient", 6028113),
});
export const searchContracts = platform({
  id: "contracts.search", method: "POST", effect: "read", inputSchema: SearchRequest,
  path: (_: SearchRequest) => "/courtage/contrat/rechercher", body: Body.json,
  responseSchema: ContractPage, evidence: observed("searchContrats$1 / searchContrats", 6027581),
});
export const saveContract = platform({
  id: "contracts.save", method: "POST", effect: "mutation", inputSchema: Contract,
  path: (_: Contract) => "/courtage/contrat/enregistrer", body: Body.json,
  responseSchema: Contract, evidence: observed("saveContrat$1", 6028453),
});

/**
 * Fetches one page at a time with zero-based pageNumero and the observed content/totalElements shape.
 * No retries or speculative parallel fetches. An empty page terminates even if the count is stale.
 */
export const streamContracts = (request: SearchRequest) => Stream.paginate(request.pageNumero, (pageNumero) =>
  execute(searchContracts, { ...request, pageNumero }).pipe(Effect.map((page) => [
    page.content,
    page.content.length > 0 && (pageNumero + 1) * request.nbParPage < page.totalElements
      ? Option.some(pageNumero + 1)
      : Option.none<number>(),
  ] as const)),
);

export const Contracts = {
  read: (contractId: ContractId) => execute(readContract, { contractId }),
  listForCustomer: (customerNumber: CustomerNumber) => execute(listContractsForCustomer, { customerNumber }),
  search: (request: SearchRequest) => execute(searchContracts, request),
  save: (contract: Contract) => execute(saveContract, contract),
  stream: streamContracts,
} as const;
export const contractOperations = [readContract, listContractsForCustomer, searchContracts, saveContract] as const;
