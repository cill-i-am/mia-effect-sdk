import assert from "node:assert/strict";
import test from "node:test";
import { Effect, Redacted, Schema, Stream } from "effect";
import { MiaClient, type MiaClientService } from "../src/client.js";
import { MiaSchemaError, type MiaError } from "../src/errors.js";
import { execute, type MiaRequest } from "../src/operation.js";
import * as S from "../src/schemas/index.js";
import {
  Contracts, Documents, Parcours, Projects, Quotes, Signatures, Tasks, curatedOperations,
  generateEnterprisePayrollSheet, searchContracts,
} from "../src/services/index.js";
import {
  createdProjectEnvelopeFixture, createProjectFixture, pricingEnvelopeFixture, pricingRequestFixture,
  projectEnvelopeFixture, syntecCreateProjectFixture, syntecPricingRequestFixture,
} from "./fixtures/postman.js";

/** Mock at the Effect service boundary: runtime response schemas still run, no network is involved. */
const recordingClient = (respond: (request: MiaRequest<unknown>) => unknown = () => null) => {
  const requests: Array<MiaRequest<unknown>> = [];
  const service: MiaClientService = {
    request: <A>(request: MiaRequest<A>): Effect.Effect<A, MiaError> => {
      requests.push(request);
      return Schema.decodeUnknownEffect(request.responseSchema)(respond(request)).pipe(Effect.mapError((issue) =>
        new MiaSchemaError({ operationId: request.id, phase: "response", message: "Invalid mock response", issue: Redacted.make(issue) }),
      ));
    },
    stream: () => Stream.empty,
  };
  return { requests, service };
};
const run = <A>(effect: Effect.Effect<A, MiaError, MiaClient>, mock: ReturnType<typeof recordingClient>) =>
  Effect.runPromise(effect.pipe(Effect.provideService(MiaClient, mock.service)));

test("complete sanitized saved project envelope decodes and round-trips without field loss", () => {
  const schema = S.envelopeOf(S.ParcoursProject);
  const decoded = Schema.decodeUnknownSync(schema)(projectEnvelopeFixture);
  assert.equal(decoded.body.numeroProjet, "project-example");
  assert.equal(decoded.body.encodedNumeroProjet, "encoded-project-example");
  assert.equal(decoded.body.devis?.type, "projetDevisDTO");
  assert.deepEqual(Schema.encodeSync(schema)(decoded), projectEnvelopeFixture);
});

test("pricing array and saved pricing response round-trip with exact wire strings", () => {
  const request = Schema.decodeUnknownSync(S.PricingRequest)(pricingRequestFixture);
  assert.deepEqual(Schema.encodeSync(S.PricingRequest)(request), pricingRequestFixture);
  assert.equal(request[0]?.parametres.find((p) => p.reference === "RENFORT")?.stringValue, "false");
  const schema = S.envelopeOf(S.PricingResponse);
  assert.deepEqual(Schema.encodeSync(schema)(Schema.decodeUnknownSync(schema)(pricingEnvelopeFixture)), pricingEnvelopeFixture);
});

test("project creation fixtures retain exact misspellings and product-specific value encodings", () => {
  for (const fixture of [createProjectFixture, syntecCreateProjectFixture]) {
    assert.deepEqual(Schema.encodeSync(S.CreateProjectRequest)(Schema.decodeUnknownSync(S.CreateProjectRequest)(fixture)), fixture);
  }
  const pricing = Schema.decodeUnknownSync(S.PricingRequest)(syntecPricingRequestFixture)[0]!;
  const creation = Schema.decodeUnknownSync(S.CreateProjectRequest)(syntecCreateProjectFixture);
  assert.equal(pricing.parametres.find((p) => p.reference === "OBSEQUES")?.stringValue, "true");
  assert.equal(pricing.parametres.find((p) => p.reference === "COMMISSION")?.stringValue, "0.055");
  assert.equal(creation.parametres.find((p) => p.reference === "EST_OBSEQUE")?.booleanValue, true);
  assert.equal(creation.parametres.find((p) => p.reference === "COMMISSION")?.stringValue, "10%");
  assert.ok("critereElligibilite" in creation);
  assert.ok("sinitresEnCours" in creation.besoin);
  assert.equal("critereEligibilite" in creation, false);
  assert.equal("sinistresEnCours" in creation.besoin, false);
});

test("creation reference remains distinct from a decoded project's encoded identifier", () => {
  const decoded = Schema.decodeUnknownSync(S.envelopeOf(S.CreatedProject))(createdProjectEnvelopeFixture);
  assert.equal(decoded.body.value, "project-creation-example");
  assert.throws(() => S.projectNumber(""));
  assert.throws(() => S.encodedProjectId(""));
  // Compile-time assertions: these APIs must not accept another identifier's brand.
  if (false) {
    // @ts-expect-error EncodedProjectId is not an internal ProjectNumber.
    Projects.read(S.encodedProjectId("encoded"));
    // @ts-expect-error ProjectNumber is not a QuoteNumber.
    Documents.generateEnterprisePayrollSheet(S.projectNumber("project"));
    // @ts-expect-error A creation result has no verified conversion into EncodedProjectId.
    Parcours.readProject(decoded.body.value);
    // @ts-expect-error A carrier policy number is not a Lya contract ID.
    Contracts.read(S.policyNumber("carrier-policy"));
  }
});

test("unknown fields survive nested request and response validation", () => {
  const source = { numeroInterne: "contract-example", numeroCompagnie: "", carrierExtension: { untouched: [1, 2] }, risqueDetaille: { delegataireNumero: "admin-reference", extension: true } };
  const decoded = Schema.decodeUnknownSync(S.Contract)(source);
  assert.deepEqual(Schema.encodeSync(S.Contract)(decoded), source);
  const subscription = { statutProjetCode: "CUSTOM:STATUT_PROJET", providerSpecific: { enabled: false } };
  assert.deepEqual(Schema.encodeSync(S.Subscription)(Schema.decodeUnknownSync(S.Subscription)(subscription)), subscription);
});

test("collection paths use /api/v1/parcours and encode the opaque ID once", async () => {
  const mock = recordingClient((request) => request.id === "parcours.readProjectByEncodedId"
    ? projectEnvelopeFixture.body : createdProjectEnvelopeFixture.body);
  await run(Parcours.readProject(S.encodedProjectId("opaque/+/=")), mock);
  await run(Parcours.createProject(Schema.decodeUnknownSync(S.CreateProjectRequest)(createProjectFixture)), mock);
  assert.equal(mock.requests[0]?.service, "platform");
  assert.equal(mock.requests[0]?.path, "/v1/parcours/projet/opaque%2F%2B%2F%3D");
  assert.equal(mock.requests[1]?.path, "/v1/parcours/devis");
  assert.deepEqual(mock.requests[1]?.body, { _tag: "Json", value: createProjectFixture });
});

test("payroll generators keep project and quote identifiers in their respective routes", async () => {
  const mock = recordingClient((request) => request.id === "documents.generate"
    ? { fileName: "payroll-example.pdf", extensionField: true } : { value: "https://example.test/payroll" });
  await run(Documents.generatePayrollSheet(S.projectNumber("P/1"), "FR"), mock);
  await run(Documents.generateEnterprisePayrollSheet(S.quoteNumber("D/2")), mock);
  assert.deepEqual(mock.requests[0]?.body, { _tag: "Json", value: {
    stockage: false, typeDocument: "FICHE_PARAMETRAGE_PAIE:TYPE_DOCUMENT_GENERE", typeNumero: "PROJET_NUMERO", numero: "P/1", test: false,
  } });
  assert.equal(mock.requests[0]?.headers?.["Lya-Language"], "FR");
  assert.equal(mock.requests[1]?.path, "/assure/projet/parcours/genererFicheParametragePaie/D%2F2");
  assert.equal(generateEnterprisePayrollSheet.effect, "mutation");
});

test("raw text bodies and JSON booleans are not silently rewritten", async () => {
  const mock = recordingClient((request) => request.id === "signatures.createProcedure" ? { value: "procedure-example" }
    : request.id === "documents.resolveDownload" ? { value: "https://example.test/file" }
    : request.id === "projects.transmitSubscription" ? {} : null);
  await run(Quotes.activateAdministrator(S.quoteNumber("Q1")), mock);
  await run(Signatures.createProcedure(S.customerNumber("C1"), "Sign this document"), mock);
  await run(Documents.resolveDownload("folder/example.pdf"), mock);
  await run(Projects.transmitSubscription(S.projectNumber("P1"), false), mock);
  assert.deepEqual(mock.requests.map((request) => request.body), [
    { _tag: "Text", value: " ", contentType: "application/json" },
    { _tag: "Text", value: "Sign this document", contentType: "application/json" },
    { _tag: "Text", value: "folder/example.pdf", contentType: "application/json" },
    { _tag: "Json", value: false },
  ]);
});

test("quote choice fills a missing discriminator while preserving an existing type and extensions", async () => {
  const mock = recordingClient(() => ({ devis: { numeroInterne: "Q1" } }));
  await run(Quotes.chooseAndSave(S.quoteNumber("Q1"), { devis: { extra: "kept" }, option: 12 }), mock);
  await run(Quotes.chooseAndSave(S.quoteNumber("Q1"), { devis: { type: "projetDevisSelectionneDTO", extra: "kept" } }), mock);
  assert.deepEqual(mock.requests[0]?.body, { _tag: "Json", value: { devis: { type: "projetDevisDTO", extra: "kept" }, option: 12 } });
  assert.deepEqual(mock.requests[1]?.body, { _tag: "Json", value: { devis: { type: "projetDevisSelectionneDTO", extra: "kept" } } });
});

test("signature operations use the separate service and retain launch/query and multipart semantics", async () => {
  const mock = recordingClient(() => null);
  const procedure = S.signatureProcedureId("SIGN/1");
  const form = new FormData();
  form.append("document", new Blob(["synthetic"], { type: "text/plain" }), "example.txt");
  await run(Signatures.launchProcedure(procedure), mock);
  await run(Signatures.uploadDocument(procedure, form), mock);
  assert.equal(mock.requests[0]?.service, "signature");
  assert.equal(mock.requests[0]?.path, "/procedures/init/SIGN%2F1");
  assert.deepEqual(mock.requests[0]?.query, { sync: false, avecEmail: true });
  assert.equal(mock.requests[1]?.body?._tag, "FormData");
  if (mock.requests[1]?.body?._tag === "FormData") assert.equal(mock.requests[1].body.value, form);
});

test("contract stream requests each needed page once and preserves contract references", async () => {
  const mock = recordingClient((request) => {
    assert.equal(request.body?._tag, "Json");
    const body = request.body?._tag === "Json" ? request.body.value as S.SearchRequest : undefined;
    return body?.pageNumero === 0
      ? { content: [{ numeroInterne: "C1", numeroCompagnie: "POL1" }, { numeroInterne: "C2" }], totalElements: 3 }
      : { content: [{ numeroInterne: "C3", extra: 7 }], totalElements: 3 };
  });
  const rows = await run(Stream.runCollect(Contracts.stream({
    criteres: [{ reference: "contrat.etats", valeur: ["SOUSCRIT:ETAT_CONTRAT"] }], pageNumero: 0, nbParPage: 2,
  })), mock);
  assert.deepEqual(rows.map((row) => row.numeroInterne), ["C1", "C2", "C3"]);
  assert.equal(rows[0]?.numeroCompagnie, "POL1");
  assert.equal(rows[2]?.["extra"], 7);
  assert.equal(mock.requests.length, 2);
  assert.deepEqual(mock.requests.map((request) => request.body?._tag === "Json" ? (request.body.value as S.SearchRequest).pageNumero : undefined), [0, 1]);
});

test("contract stream stops on an empty page even with a stale nonzero total", async () => {
  const mock = recordingClient(() => ({ content: [], totalElements: 999 }));
  assert.deepEqual(await run(Stream.runCollect(Contracts.stream({ criteres: [], pageNumero: 0, nbParPage: 50 })), mock), []);
  assert.equal(mock.requests.length, 1);
});

test("invalid paging is a typed request error before any client request", async () => {
  const mock = recordingClient();
  const error = await Effect.runPromise(execute(searchContracts, { criteres: [], pageNumero: 0, nbParPage: 0 }).pipe(
    Effect.provideService(MiaClient, mock.service), Effect.flip,
  ));
  assert.equal(error._tag, "MiaSchemaError");
  if (error._tag === "MiaSchemaError") assert.equal(error.phase, "request");
  assert.equal(mock.requests.length, 0);
});

test("task helper preserves uncertain literal Postman keys and does not normalize them", async () => {
  const mock = recordingClient();
  await run(Tasks.saveObservedPayload({ "etat*": "AFFECTE:MESSAGE_ETAT", "propriétés*": { CLIENT_NUMERO: "synthetic" } }), mock);
  assert.equal(mock.requests[0]?.service, "messaging");
  assert.deepEqual(mock.requests[0]?.body, { _tag: "Json", value: { "etat*": "AFFECTE:MESSAGE_ETAT", "propriétés*": { CLIENT_NUMERO: "synthetic" } } });
});

test("curated inventory has unique IDs and explicitly flags the observed mutating GETs", () => {
  assert.equal(curatedOperations.length, 58);
  assert.equal(new Set(curatedOperations.map((operation) => operation.id)).size, 58);
  assert.ok(curatedOperations.every((operation) => (operation.evidence?.length ?? 0) > 0));
  assert.deepEqual(curatedOperations.filter((operation) => operation.method === "GET" && operation.effect === "mutation").map((operation) => operation.id).sort(), [
    "documents.generateEnterprisePayrollSheet", "projects.transmitAdministration", "quotes.checkSubscription",
    "quotes.choose", "quotes.subscribeManually", "quotes.subscribeWithInsurer", "signatures.transmitAdhesion",
  ].sort());
});
