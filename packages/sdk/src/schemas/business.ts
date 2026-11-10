import { Schema } from "effect";
import { Criterion, emptyOr, openStruct, optionalNullable as n, UnknownObject, WireDate } from "./common.js";
import { ContractId, CustomerNumber, EncodedProjectId, PolicyNumber, ProjectCreationReference, ProjectNumber, QuoteNumber, SignatureProcedureId } from "./identifiers.js";

// These models describe observed client fields. Unknown fields are retained at every modeled level.
// Optional fields do not assert server requiredness, and UI validators are not treated as server schemas.

export const ContributionRate = openStruct({
  typeTarifCode: n(Schema.String), typeTarif: n(Schema.String),
  priseEnChargeEmployeur: n(Schema.Number), montant: n(Schema.Number), montantPMSS: n(Schema.Number),
});
export const ContributionBasis = openStruct({
  identifiant: n(Schema.Number), typeMontant: n(Schema.String), typeAssietteCode: n(Schema.String),
  typeAssiette: n(Schema.String), choisie: n(Schema.Boolean), tarifs: n(Schema.Array(ContributionRate)),
});
export const PricingProduct = openStruct({
  codeProduit: Schema.String,
  parametres: Schema.Array(Criterion),
  /** This misspelling is the observed wire key. */
  critereElligibilite: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
});
export type PricingProduct = typeof PricingProduct.Type;
export const PricingRequest = Schema.Array(PricingProduct);
export type PricingRequest = typeof PricingRequest.Type;
export const PricingSimulation = openStruct({
  type: n(Schema.String), assureur: n(Schema.String), codeProduit: n(Schema.String), formule: n(Schema.String),
  status: n(Schema.String), recommandee: n(Schema.Boolean), messages: n(Schema.Array(Schema.Unknown)),
  caracteristique1: n(Schema.Number), caracteristique2: n(Schema.Number),
  caracteristique3: n(Schema.Number), caracteristique4: n(Schema.Number),
  criteres: n(Schema.Array(Criterion)), assietteCotisation: n(ContributionBasis),
});
export const PartnerPricingResult = openStruct({
  partenaire: n(Schema.String), status: n(Schema.String), message: n(Schema.String), duration: n(Schema.Number),
  resultat: n(openStruct({
    simulations: n(Schema.Array(PricingSimulation)), detail: n(Schema.Array(Schema.Unknown)),
    criteresComparaisons: n(Schema.Array(Schema.Unknown)), devis: Schema.optionalKey(Schema.Unknown),
  })),
});
export const PricingResponse = Schema.Array(PartnerPricingResult);
export type PricingResponse = typeof PricingResponse.Type;

export const Address = openStruct({
  voie: n(Schema.String), complement: n(Schema.String), codePostal: n(Schema.String),
  ville: n(Schema.String), pays: n(Schema.String), cedex: n(Schema.Boolean),
});
export const ProjectContact = openStruct({
  civilite: n(Schema.String), nom: n(Schema.String), prenom: n(Schema.String),
  email: n(Schema.String), numeroTelephone: n(Schema.String), fonction: n(Schema.String),
});
export const ProjectCompany = openStruct({
  codeAPE: n(Schema.String), secondCodeAPE: n(Schema.String), siret: n(Schema.String), raisonSociale: n(Schema.String),
  creationDate: n(WireDate), voie: n(Schema.String), complementAdresse: n(Schema.String), codePostal: n(Schema.String),
  ville: n(Schema.String), pays: n(Schema.String), nombreSalaries: n(Schema.Number), effectifCadre: n(Schema.Number),
  effectifNonCadre: n(Schema.Number), statutJuridique: n(Schema.String), conventionCollective: n(Schema.String),
  ageMoyenNonCadre: n(Schema.Number), ageMoyenCadre: n(Schema.Number),
});
export const Demography = openStruct({
  collegeCode: n(Schema.String), ageMoyen: n(Schema.Number), effectif: n(Schema.Number), regimeCode: n(Schema.String),
  nbIncapacitesOuInvalidites: n(Schema.Number), nbSalariesSeuls: n(Schema.Number), nbSalaries1Enfant: n(Schema.Number),
  nbSalaries2EnfantsOuPlus: n(Schema.Number), nbSalariesCouples: n(Schema.Number), nbSalariesCouples1Enfant: n(Schema.Number),
  nbSalariesCouples2OuPlus: n(Schema.Number), masseSalarialeTrancheA: n(Schema.Number),
  masseSalarialeTrancheB: n(Schema.Number), masseSalarialeTrancheC: n(Schema.Number), masseSalarialeTrancheD: n(Schema.Number),
});
export const CurrentContract = openStruct({
  type: n(Schema.String), satisfactionGestion: n(Schema.Number), satisfactionRemboursement: n(Schema.Number),
  notes: n(Schema.String), gestionnaireCode: n(Schema.String), partPriseEnChargeEmployeur: n(Schema.Number),
  surcomplementaire: n(Schema.Boolean), souscriptionDate: n(WireDate), produit: n(UnknownObject),
  numeroPartenaire: n(Schema.String), assiettesCotisation: n(Schema.Array(ContributionBasis)),
});
export const ProjectNeed = openStruct({
  type: Schema.String,
  personnas: n(Schema.Array(Schema.String)), dateEffetSouhaitee: n(WireDate), intituleProjet: n(Schema.String),
  numeroProjetTiers: n(Schema.String), description: n(Schema.String), loginConseillerDestination: n(Schema.String),
  consentements: n(Schema.Array(openStruct({ type: n(Schema.String), description: n(Schema.String) }))),
  contratActuel: n(CurrentContract), structureCotisationCode: n(Schema.String),
  pourcentagePriseEnChargeEmployeur: n(Schema.Number), interlocuteur: n(ProjectContact), entreprise: n(ProjectCompany),
  collegeType: n(Schema.Array(Schema.String)), demographies: n(Schema.Array(Demography)),
  repriseSinistreEnCours: n(Schema.Boolean),
  /** Exact spelling in the supplied Syntec create-project request. */
  sinitresEnCours: n(Schema.Boolean), budgetPrecis: n(Schema.Boolean), montantBudgetPrecis: n(Schema.Number),
  couvertureSouhaiteCode: n(Schema.String), modaliteAdhesionCode: n(Schema.String),
});
export const CreateProjectRequest = openStruct({
  besoin: ProjectNeed, codeProduit: Schema.String, parametres: Schema.Array(Criterion),
  critereElligibilite: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
});
export type CreateProjectRequest = typeof CreateProjectRequest.Type;
export const CreatedProject = openStruct({ value: ProjectCreationReference });
export type CreatedProject = typeof CreatedProject.Type;

export const Insurer = openStruct({
  code: n(Schema.String), personne: n(UnknownObject), urlLogo: n(Schema.String),
  urlExtranetCourtier: n(Schema.String), urlExtranetAssure: n(Schema.String),
});
export const Product = openStruct({
  type: n(Schema.String), code: n(Schema.String), nom: n(Schema.String), assureur: n(Insurer), gestionnaire: n(Insurer),
  domaineCode: n(Schema.String), typologieCode: n(Schema.String), devisAutomatique: n(Schema.Boolean),
  /** Misspelling observed in the collection project response. */
  soucriptionAutomatique: n(Schema.Boolean), miseEnGestionAutomatique: n(Schema.Boolean),
  adhesionSignatureElectronique: n(Schema.Boolean), elligible: n(Schema.Boolean),
});
export const WorkflowInformation = openStruct({ information: n(Schema.String) });
export const Quote = openStruct({
  type: n(Schema.String), numeroInterne: n(emptyOr(QuoteNumber)), numeroProjet: n(emptyOr(ProjectNumber)), numeroClient: n(emptyOr(CustomerNumber)),
  numeroPartenaire: n(Schema.String), intitule: n(Schema.String), produit: n(Product), formule: n(Schema.String),
  selectionne: n(Schema.Boolean), favori: n(Schema.Boolean), automatique: n(Schema.Boolean), commission: n(Schema.String),
  etatCode: n(Schema.String), etat: n(Schema.String), assiettesCotisation: n(Schema.Array(ContributionBasis)),
  montantAnnuel: n(Schema.Number), montantMensuel: n(Schema.Number), montant: n(Schema.Number),
  dateLancementSouscription: n(WireDate), dateLancementMiseEnGestion: n(WireDate),
  informationsSouscription: n(Schema.Array(WorkflowInformation)), informationsMiseEnGestion: n(Schema.Array(WorkflowInformation)),
});
export type Quote = typeof Quote.Type;
export const Document = openStruct({
  id: n(Schema.Number), numero: n(Schema.String), fileName: n(Schema.String), fileUploadedName: n(Schema.String),
  url: n(Schema.String), categories: n(Schema.Array(Schema.String)), proprietes: n(UnknownObject),
  extension: n(Schema.String), taille: n(Schema.Number), etatCode: n(Schema.String),
});
export type Document = typeof Document.Type;
export const ParcoursProject = openStruct({
  numeroProjet: ProjectNumber, encodedNumeroProjet: EncodedProjectId, devis: n(Quote), devisSelectionnes: n(Schema.Array(Quote)),
  besoin: n(ProjectNeed), assure: n(UnknownObject), etat: n(Schema.String), dateEtat: n(WireDate),
  documentsProposition: n(Schema.Array(Document)), piecesJustificatives: n(Schema.Array(Schema.Unknown)),
  urlSignature: n(Schema.String), rib: Schema.optionalKey(Schema.Unknown), ribVersement: Schema.optionalKey(Schema.Unknown),
});
export type ParcoursProject = typeof ParcoursProject.Type;
export const InternalProject = openStruct({
  numero: n(emptyOr(ProjectNumber)), numeroDevisChoisi: n(emptyOr(QuoteNumber)), numeroClient: n(emptyOr(CustomerNumber)),
  numeroProcedureSignatureElectronique: n(emptyOr(SignatureProcedureId)),
  numeroProcedureSignatureElectroniqueAdhesion: n(emptyOr(SignatureProcedureId)),
  etatCode: n(Schema.String), etat: n(Schema.String), formulaire: n(UnknownObject), langue: n(Schema.String),
});
export type InternalProject = typeof InternalProject.Type;
export const ProjectState = openStruct({ etatCode: n(Schema.String), etat: n(Schema.String), dateEtat: n(WireDate) });
export type ProjectState = typeof ProjectState.Type;
export const Subscription = openStruct({
  dateEnvoiCompagnie: n(WireDate), dateValidationContratCompagnie: n(WireDate),
  /** Client usage mixes insurer reference and linked internal contract; intentionally unbranded. */
  contratLie: n(Schema.String), dateReceptionDocumentClient: n(WireDate), dateEnvoiClient: n(WireDate),
  statutProjetCode: n(Schema.String), raisonsParticulieres: n(Schema.String), motifRefus: n(Schema.String),
  valideInterne: n(Schema.Boolean), commentaireValidationInterne: n(Schema.String), destinataireTacheControle: n(Schema.String),
});
export type Subscription = typeof Subscription.Type;
export const Administration = openStruct({
  dateEnvoiMiseEnGestion: n(WireDate), numeroContratGestionnaire: n(Schema.String),
});
export type Administration = typeof Administration.Type;
export const TransformProjectRequest = openStruct({
  numeroDevisChoisi: n(QuoteNumber), numeroCompagnie: n(PolicyNumber), souscriptionDate: n(WireDate),
  effetDate: n(WireDate), renouvellementTypeCode: n(Schema.String), echeanceDate: n(Schema.String),
  resiliationDate: n(WireDate), primeAnnuelleTTC: n(Schema.Number), primeAnnuelleHT: n(Schema.Number),
  commissionMontant: n(Schema.Number), commissionNextMontant: n(Schema.Number), commissionTaux: n(Schema.String),
  commissionNextTaux: n(Schema.String), typeMontant: n(Schema.String), souscription: n(Subscription),
});
export type TransformProjectRequest = typeof TransformProjectRequest.Type;
export const Contract = openStruct({
  numeroInterne: n(emptyOr(ContractId)), clientNumeroInterne: n(emptyOr(CustomerNumber)), numeroClient: n(emptyOr(CustomerNumber)),
  numeroCompagnie: n(emptyOr(PolicyNumber)), numeroCourtier: n(Schema.String), assureNumero: n(Schema.String),
  adhesionNumero: n(Schema.String), risqueDetaille: n(openStruct({ delegataireNumero: n(Schema.String) })),
  etatCode: n(Schema.String), etat: n(Schema.String), effetDate: n(WireDate), souscriptionDate: n(WireDate),
  primeAnnuelleTTC: n(Schema.Number), primeAnnuelleHT: n(Schema.Number),
});
export type Contract = typeof Contract.Type;

export const CustomerPerson = openStruct({
  type: Schema.String, identifiant: n(Schema.Number), clientNumero: n(emptyOr(CustomerNumber)),
  nom: n(Schema.String), prenom: n(Schema.String), civiliteCode: n(Schema.String),
  telephone: n(Schema.String), mobile: n(Schema.String), mail: n(Schema.String), securiteSocialeNumero: n(Schema.String),
  adresse: n(Address), raisonSociale: n(Schema.String), statutJuridiqueCode: n(Schema.String),
  numeroSIRET: n(Schema.String), codeAPE: n(Schema.String), debutActiviteDate: n(WireDate),
  contactPrincipal: n(openStruct({
    numeroClient: n(emptyOr(CustomerNumber)), personne: n(openStruct({ identifiant: n(Schema.Number) })),
  })),
});
export const Customer = openStruct({
  type: n(Schema.String), numero: n(emptyOr(CustomerNumber)), numeroInterne: n(emptyOr(CustomerNumber)), personne: n(CustomerPerson),
});
export type Customer = typeof Customer.Type;
export const CreateCustomerRequest = openStruct({ type: Schema.String, personne: CustomerPerson });
export type CreateCustomerRequest = typeof CreateCustomerRequest.Type;
export const Codification = openStruct({ code: n(Schema.String), libelle: n(Schema.String), valeur: Schema.optionalKey(Schema.Unknown) });

/** Literal Postman keys retained. Asterisks/accent may be documentation artefacts; no working call is claimed. */
export const TaskRequest = openStruct({
  canal: n(Schema.String), description: n(Schema.String), destinataire: n(Schema.String), echeanceDate: n(WireDate),
  "etat*": n(Schema.String), login: n(Schema.String), niveau: n(Schema.String), "propriétés*": n(UnknownObject),
  titre: n(Schema.String), type: n(Schema.String),
});
export type TaskRequest = typeof TaskRequest.Type;
