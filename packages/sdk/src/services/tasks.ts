import { Schema } from "effect";
import { Body, defineOperation, execute } from "../operation.js";
import { TaskRequest } from "../schemas/business.js";
import { collection } from "./_shared.js";

/** Requires an explicitly configured messaging base ending /api; no platform credential is assumed. */
export const saveTask = defineOperation({
  id: "tasks.saveObservedPayload", service: "messaging", method: "POST", effect: "mutation", responseMode: "envelope",
  inputSchema: TaskRequest, path: (_: TaskRequest) => "/taches/enregistrer", body: Body.json,
  responseSchema: Schema.Unknown, evidence: collection("Créer Tache; literal etat* and propriétés* are unresolved"),
  description: "Preserves the literal supplied sample. Asterisks and accented properties may be documentation artefacts; server acceptance is unverified.",
});
export const Tasks = { saveObservedPayload: (request: TaskRequest) => execute(saveTask, request) } as const;
export const taskOperations = [saveTask] as const;
