export * from "./parcours.js";
export * from "./projects.js";
export * from "./quotes.js";
export * from "./contracts.js";
export * from "./documents.js";
export * from "./customers.js";
export * from "./reference.js";
export * from "./tasks.js";
export * from "./signatures.js";

import { parcoursOperations } from "./parcours.js";
import { projectOperations } from "./projects.js";
import { quoteOperations } from "./quotes.js";
import { contractOperations } from "./contracts.js";
import { documentOperations } from "./documents.js";
import { customerOperations } from "./customers.js";
import { referenceOperations } from "./reference.js";
import { taskOperations } from "./tasks.js";
import { signatureOperations } from "./signatures.js";

/** Evidence and effect metadata for the hand-checked surface. Services must be explicitly configured. */
export const curatedOperations = [
  ...parcoursOperations, ...projectOperations, ...quoteOperations, ...contractOperations,
  ...documentOperations, ...customerOperations, ...referenceOperations, ...taskOperations, ...signatureOperations,
] as const;
