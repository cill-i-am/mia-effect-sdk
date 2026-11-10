import { Schema } from "effect";
import { Body, execute } from "../operation.js";
import { CreateCustomerRequest, Customer } from "../schemas/business.js";
import { SearchRequest } from "../schemas/common.js";
import { CustomerNumber } from "../schemas/identifiers.js";
import { collection, CustomerInput, platform, segment } from "./_shared.js";

export const createCustomer = platform({
  id: "customers.create", method: "POST", effect: "mutation", inputSchema: CreateCustomerRequest,
  path: (_: CreateCustomerRequest) => "/courtage/client/creer", body: Body.json,
  responseSchema: Schema.Unknown, evidence: collection("client/create individual, company, company linked to existing contact"),
});
export const readCustomer = platform({
  id: "customers.read", method: "GET", effect: "read", inputSchema: CustomerInput,
  path: ({ customerNumber }: CustomerInput) => `/courtage/client/lire/${segment(customerNumber)}`,
  responseSchema: Customer, evidence: collection("client/read"),
});
export const searchPeople = platform({
  id: "customers.searchPeople", method: "POST", effect: "read", inputSchema: SearchRequest,
  path: (_: SearchRequest) => "/courtage/contact/personne/rechercher", body: Body.json,
  responseSchema: Schema.Unknown, evidence: collection("contact/personne/rechercher"),
});
export const searchCompanies = platform({
  id: "customers.searchCompanies", method: "POST", effect: "read", inputSchema: SearchRequest,
  path: (_: SearchRequest) => "/courtage/contact/entreprise/rechercher", body: Body.json,
  responseSchema: Schema.Unknown, evidence: collection("contact/entreprise/rechercher"),
});
export const Customers = {
  create: (request: CreateCustomerRequest) => execute(createCustomer, request),
  read: (customerNumber: CustomerNumber) => execute(readCustomer, { customerNumber }),
  searchPeople: (request: SearchRequest) => execute(searchPeople, request),
  searchCompanies: (request: SearchRequest) => execute(searchCompanies, request),
} as const;
export const customerOperations = [createCustomer, readCustomer, searchPeople, searchCompanies] as const;
