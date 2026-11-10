import { Schema } from "effect";
import { Body, execute } from "../operation.js";
import { ProjectState, Quote } from "../schemas/business.js";
import { openStruct } from "../schemas/common.js";
import { ProjectNumber, QuoteNumber } from "../schemas/identifiers.js";
import { observed, platform, ProjectInput, QuoteInput, segment } from "./_shared.js";

export const listProjectQuotes = platform({
  id: "quotes.listForProject", method: "GET", effect: "read", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/devis/lister/${segment(projectNumber)}`,
  responseSchema: Schema.Array(Quote), evidence: observed("listProjectQuoteApi", 9941054),
});
export const readQuote = platform({
  id: "quotes.read", method: "GET", effect: "read", inputSchema: QuoteInput,
  path: ({ quoteNumber }: QuoteInput) => `/courtage/projet/devis/lire/${segment(quoteNumber)}`,
  responseSchema: Quote, evidence: observed("readQuote$1", 9942072),
});
export const selectQuotesForProposal = platform({
  id: "quotes.selectForProposal", method: "PUT", effect: "mutation",
  inputSchema: Schema.Struct({ projectNumber: ProjectNumber, quoteNumbers: Schema.Array(QuoteNumber) }),
  path: (input: { readonly projectNumber: ProjectNumber; readonly quoteNumbers: ReadonlyArray<QuoteNumber> }) => `/courtage/projet/devis/selectionner/${segment(input.projectNumber)}`,
  body: (input) => Body.json(input.quoteNumbers), responseSchema: Schema.Unknown,
  evidence: observed("saveSelectedQuote$1", 9941137),
});
/** Mutating GET selecting the final chosen quote, distinct from proposal selections. */
export const chooseQuote = platform({
  id: "quotes.choose", method: "GET", effect: "mutation", inputSchema: QuoteInput,
  path: ({ quoteNumber }: QuoteInput) => `/courtage/projet/choisir/${segment(quoteNumber)}`,
  responseSchema: ProjectState, evidence: observed("selectProjectQuote$1", 9942224),
});
export const QuoteChoice = openStruct({ devis: Quote });
export type QuoteChoice = typeof QuoteChoice.Type;
export const chooseAndSaveQuote = platform({
  id: "quotes.chooseAndSave", method: "PUT", effect: "mutation",
  inputSchema: Schema.Struct({ quoteNumber: QuoteNumber, choice: QuoteChoice }),
  path: (input: { readonly quoteNumber: QuoteNumber; readonly choice: QuoteChoice }) => `/courtage/projet/choisir/${segment(input.quoteNumber)}`,
  body: (input) => Body.json({ ...input.choice, devis: {
    ...input.choice.devis,
    type: input.choice.devis.type == null || input.choice.devis.type === "" ? "projetDevisDTO" : input.choice.devis.type,
  } }),
  responseSchema: openStruct({ devis: Quote }), evidence: observed("selectAndSaveProjectQuote$1", 9942380),
});
/** Launch acknowledgements have no established result DTO. Read quote state to establish outcome. */
export const subscribeWithInsurer = platform({
  id: "quotes.subscribeWithInsurer", method: "GET", effect: "mutation", inputSchema: QuoteInput,
  path: ({ quoteNumber }: QuoteInput) => `/scrapping/projet/souscrire/${segment(quoteNumber)}/false`,
  responseSchema: Schema.Unknown, evidence: observed("subscribeQuote$1", 9943082),
});
export const subscribeManually = platform({
  id: "quotes.subscribeManually", method: "GET", effect: "mutation", inputSchema: QuoteInput,
  path: ({ quoteNumber }: QuoteInput) => `/scrapping/projet/souscrire/manuel/${segment(quoteNumber)}`,
  responseSchema: Schema.Unknown, evidence: observed("subscribeManualQuote$1", 9943166),
});
export const checkSubscription = platform({
  id: "quotes.checkSubscription", method: "GET", effect: "mutation", inputSchema: QuoteInput,
  path: ({ quoteNumber }: QuoteInput) => `/scrapping/projet/souscrire/${segment(quoteNumber)}/true`,
  responseSchema: Schema.Unknown, evidence: observed("controlSubscribtionQuote", 9943354),
});
export const activateAdministrator = platform({
  id: "quotes.activateAdministrator", method: "PUT", effect: "mutation",
  inputSchema: Schema.Struct({ quoteNumber: QuoteNumber, comments: Schema.optionalKey(Schema.String) }),
  path: (input: { readonly quoteNumber: QuoteNumber; readonly comments?: string }) => `/scrapping/projet/mettreEnGestion/${segment(input.quoteNumber)}`,
  // Frontend sends a raw string and substitutes a single space for empty/absent comments.
  body: (input) => Body.text(input.comments || " ", "application/json"), responseSchema: Schema.Unknown,
  evidence: observed("manageQuote$1", 9943445),
});

export const Quotes = {
  listForProject: (projectNumber: ProjectNumber) => execute(listProjectQuotes, { projectNumber }),
  read: (quoteNumber: QuoteNumber) => execute(readQuote, { quoteNumber }),
  selectForProposal: (projectNumber: ProjectNumber, quoteNumbers: ReadonlyArray<QuoteNumber>) => execute(selectQuotesForProposal, { projectNumber, quoteNumbers }),
  choose: (quoteNumber: QuoteNumber) => execute(chooseQuote, { quoteNumber }),
  chooseAndSave: (quoteNumber: QuoteNumber, choice: QuoteChoice) => execute(chooseAndSaveQuote, { quoteNumber, choice }),
  subscribeWithInsurer: (quoteNumber: QuoteNumber) => execute(subscribeWithInsurer, { quoteNumber }),
  subscribeManually: (quoteNumber: QuoteNumber) => execute(subscribeManually, { quoteNumber }),
  checkSubscription: (quoteNumber: QuoteNumber) => execute(checkSubscription, { quoteNumber }),
  activateAdministrator: (quoteNumber: QuoteNumber, comments?: string) => execute(activateAdministrator, { quoteNumber, ...(comments === undefined ? {} : { comments }) }),
} as const;
export const quoteOperations = [listProjectQuotes, readQuote, selectQuotesForProposal, chooseQuote, chooseAndSaveQuote,
  subscribeWithInsurer, subscribeManually, checkSubscription, activateAdministrator] as const;
