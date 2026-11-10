import { Schema } from "effect";
import { Body, execute } from "../operation.js";
import { Administration, Contract, InternalProject, ProjectState, Subscription, TransformProjectRequest } from "../schemas/business.js";
import { ProjectNumber } from "../schemas/identifiers.js";
import { observed, platform, ProjectInput, segment } from "./_shared.js";

export const readInternalProject = platform({
  id: "projects.read", method: "GET", effect: "read", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/lire/${segment(projectNumber)}`,
  responseSchema: InternalProject, evidence: observed("readProject$1", 9611848),
});
export const readProjectState = platform({
  id: "projects.readState", method: "GET", effect: "read", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/etat/lire/${segment(projectNumber)}`,
  responseSchema: ProjectState, evidence: observed("lireEtatProjet", 9611159),
});
/** Advances the project workflow; this is distinct from launching carrier subscription. */
export const enterSubscription = platform({
  id: "projects.enterSubscription", method: "PUT", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/souscrire/${segment(projectNumber)}`,
  responseSchema: ProjectState, evidence: observed("souscrireProjet$1", 9613065),
});
export const readSubscription = platform({
  id: "projects.readSubscription", method: "GET", effect: "read", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/souscription/lire/${segment(projectNumber)}`,
  responseSchema: Subscription, evidence: observed("readProjectSouscription$1", 9948226),
});
export const initializeSubscription = platform({
  id: "projects.initializeSubscription", method: "POST", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/souscription/initier/${segment(projectNumber)}`,
  responseSchema: Subscription, evidence: observed("initProjectSouscription$1", 9948443),
});
export const saveSubscription = platform({
  id: "projects.saveSubscription", method: "POST", effect: "mutation",
  inputSchema: Schema.Struct({ projectNumber: ProjectNumber, subscription: Subscription }),
  path: (input: { readonly projectNumber: ProjectNumber; readonly subscription: Subscription }) => `/courtage/projet/souscription/enregistrer/${segment(input.projectNumber)}`,
  body: (input) => Body.json(input.subscription), responseSchema: Subscription,
  evidence: observed("saveProjectSouscription$1", 9948318),
});
export const transmitSubscription = platform({
  id: "projects.transmitSubscription", method: "POST", effect: "mutation",
  inputSchema: Schema.Struct({ projectNumber: ProjectNumber, isUsingWebApp: Schema.Boolean }),
  path: (input: { readonly projectNumber: ProjectNumber; readonly isUsingWebApp: boolean }) => `/courtage/projet/souscription/transmettre/${segment(input.projectNumber)}`,
  body: (input) => Body.json(input.isUsingWebApp), responseSchema: ProjectState,
  evidence: observed("sendSouscription$1", 9948632),
});
export const validateSubscription = platform({
  id: "projects.validateSubscription", method: "PUT", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/souscription/valider/${segment(projectNumber)}`,
  responseSchema: ProjectState, evidence: observed("validerProjetSouscription$1", 9613233),
});
/** Links/finalizes a project as a contract record. Success alone is not evidence of insurer issuance. */
export const transformProject = platform({
  id: "projects.transformToContract", method: "PUT", effect: "mutation",
  inputSchema: Schema.Struct({ projectNumber: ProjectNumber, transformation: TransformProjectRequest }),
  path: (input: { readonly projectNumber: ProjectNumber; readonly transformation: TransformProjectRequest }) => `/courtage/projet/souscription/transformer/${segment(input.projectNumber)}`,
  body: (input) => Body.json(input.transformation), responseSchema: Contract,
  evidence: observed("transformProject$1", 9615105),
});
export const readAdministration = platform({
  id: "projects.readAdministration", method: "GET", effect: "read", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/miseEnGestion/lire/${segment(projectNumber)}`,
  responseSchema: Administration, evidence: observed("readProjectMiseEnGestion$1", 9929492),
});
export const saveAdministration = platform({
  id: "projects.saveAdministration", method: "POST", effect: "mutation",
  inputSchema: Schema.Struct({ projectNumber: ProjectNumber, administration: Administration }),
  path: (input: { readonly projectNumber: ProjectNumber; readonly administration: Administration }) => `/courtage/projet/miseEnGestion/enregistrer/${segment(input.projectNumber)}`,
  body: (input) => Body.json(input.administration), responseSchema: Administration,
  evidence: observed("saveProjectMiseEnGestion$1", 9929586),
});
export const enterAdministration = platform({
  id: "projects.enterAdministration", method: "PUT", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/mettreEnGestion/${segment(projectNumber)}`,
  responseSchema: ProjectState, evidence: observed("mettreEnGestionProjet$1", 9613143),
});
/** Sends administration/signature communications even though its HTTP method is GET. */
export const transmitAdministration = platform({
  id: "projects.transmitAdministration", method: "GET", effect: "mutation", inputSchema: ProjectInput,
  path: ({ projectNumber }: ProjectInput) => `/courtage/projet/miseEnGestion/transmettre/${segment(projectNumber)}`,
  responseSchema: Schema.Unknown, evidence: observed("sendGestion$1", 9929300),
});

export const Projects = {
  read: (projectNumber: ProjectNumber) => execute(readInternalProject, { projectNumber }),
  readState: (projectNumber: ProjectNumber) => execute(readProjectState, { projectNumber }),
  enterSubscription: (projectNumber: ProjectNumber) => execute(enterSubscription, { projectNumber }),
  readSubscription: (projectNumber: ProjectNumber) => execute(readSubscription, { projectNumber }),
  initializeSubscription: (projectNumber: ProjectNumber) => execute(initializeSubscription, { projectNumber }),
  saveSubscription: (projectNumber: ProjectNumber, subscription: Subscription) => execute(saveSubscription, { projectNumber, subscription }),
  transmitSubscription: (projectNumber: ProjectNumber, isUsingWebApp: boolean) => execute(transmitSubscription, { projectNumber, isUsingWebApp }),
  validateSubscription: (projectNumber: ProjectNumber) => execute(validateSubscription, { projectNumber }),
  transformToContract: (projectNumber: ProjectNumber, transformation: TransformProjectRequest) => execute(transformProject, { projectNumber, transformation }),
  readAdministration: (projectNumber: ProjectNumber) => execute(readAdministration, { projectNumber }),
  saveAdministration: (projectNumber: ProjectNumber, administration: Administration) => execute(saveAdministration, { projectNumber, administration }),
  enterAdministration: (projectNumber: ProjectNumber) => execute(enterAdministration, { projectNumber }),
  transmitAdministration: (projectNumber: ProjectNumber) => execute(transmitAdministration, { projectNumber }),
} as const;
export const projectOperations = [readInternalProject, readProjectState, enterSubscription, readSubscription,
  initializeSubscription, saveSubscription, transmitSubscription, validateSubscription, transformProject,
  readAdministration, saveAdministration, enterAdministration, transmitAdministration] as const;
