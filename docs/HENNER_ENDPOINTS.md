# Observed Henner endpoint inventory

This is a static discovery index, not a supported API specification. See the
[workflow and request/response guide](HENNER_API.md) for the operations relevant
to subscription, contract references, and DSN setup sheets.

The snapshot was collected on 10 November 2026. No listed authentication or
business operation was invoked. Dynamic segments are placeholders; generic names
such as `parameter1` do not establish a server-defined parameter name or type.
Conditional route alternatives are included when resolved from source.

**Do not infer safety from the HTTP verb.** Login, MFA, handoff, reissue and
other operations can have effects. The inventory includes brand-specific and
back-office code; discovered paths do not establish account entitlement.

## Employer portal

Base: `https://apim.henner.com/site_rh/1.0/api-rh/{codeSite}/{lang}`.

The observed `hr.henner.com` default is site `12`; French uses `fr`.
There are 144 normalized method/path patterns from 147 API call sites.
CMS and translation calls are recorded separately.

[Machine-readable employer catalogue](../spec/henner/employer-observed-routes.json).

| Method | Relative path | Observed client method |
| --- | --- | --- |
| GET | `/actualites/actualites-externe/recuperer` | `getNews` |
| GET | `/beneficiaire-ebia/consultation/recuperer-types-pieces-justificatives` | `beneficiaireEbiaTypeDoc` |
| GET | `/beneficiaire-ebia/recherche/demander-fichier-declarations-complet` | `ebiaRequestCompleteDeclarationsFile` |
| GET | `/beneficiaire-ebia/recherche/recuperer-fichiers-declarations-complets` | `ebiaRecoverCompleteDeclarationFiles` |
| GET | `/bilan-sante/demande/initialiser` | `getBilanSanteInit` |
| GET | `/bilan-sante/demandes/recuperer/{param1}` | `getBilanSante` |
| GET | `/document/consulter/documents/0` | `getDocuments` |
| GET | `/document/consulter/recuperer-document-reporting` | `getDataPortal` |
| GET | `/gestion-beneficiaire/extraction/liste-demande-extraction` | `getExtractHistory` |
| GET | `/mfa/generer` | `mfaGenerer` |
| GET | `/mfa/valider/{param1}` | `mfaValider` |
| GET | `/referenciel/champs-coordonnees-bancaires/{param1}` | `getBankDetails` |
| GET | `/referenciel/devises` | `getDevises` |
| GET | `/referenciel/langues-certificat` | `getLangCertificat` |
| GET | `/referenciel/liste-pays` | `getCountries, getCountriesOfac, getCountriesUnderEmbargo` |
| GET | `/referenciel/liste-pays-sepa` | `getSepaCountries` |
| GET | `/referenciel/motifs-radiation` | `getTerminatedReason` |
| GET | `/referenciel/recuperer-categories-partenaires-reseau-carte-blanche` | `getNetworkCategoryCb` |
| GET | `/referenciel/regimes-sociaux` | `getRegimeInfos` |
| GET | `/reseaux-soins/reseau-henner/criteres-recherche` | `getResmedSearch` |
| GET | `/reseaux-soins/reseau-henner/nouveaux-partenariats` | `getResmedPartners` |
| GET | `/reseaux-soins/urls-statiques` | `getReseauxURLs` |
| GET | `/securite/habilitations` | `recupererMenu` |
| GET | `/securite/logout` | `deconnecter` |
| GET | `/securite/sso-externe/login/{param1}` | `ssooavLogin` |
| GET | `/securite/sso-saml/login-url/{param1}` | `ssosamlLogin` |
| GET | `/utilisateur/civilites` | `getListCivility` |
| GET | `/utilisateur/contacts-ug` | `recupererUniteGestion` |
| GET | `/utilisateur/contrats` | `getContracts` |
| GET | `/utilisateur/indicateurs` | `recupererIndicateurs` |
| GET | `/utilisateur/langues` | `getListLang` |
| GET | `/utilisateur/recuperer` | `getInfosUser` |
| GET | `/utilisateur/recuperer-messages` | `getUserMessages` |
| GET | `/utilisateur/web-call-back/info-pays-instant-ring/{param1}` | `getContactInfo` |
| GET | `/utilisateur/web-call-back/liste-pays` | `getCountriesContact` |
| GET | `/utils/configuration/get-ws-env` | `getCSharpEnv` |
| GET | `/utils/configuration/set-ws-env/{param1}` | `changeCSharpEnv` |
| POST | `/appel-cotisation/consultation/cotisation` | `getCotisations` |
| POST | `/appel-cotisation/consultation/details-contributions` | `downloadContributions` |
| POST | `/appel-cotisation/consultation/facture` | `downloadFacture` |
| POST | `/appel-cotisation/consultation/valider-prelevement-unitaire` | `validCotisation` |
| POST | `/appel-cotisation/declaration/declarer-produits` | `saveCotisationProducts` |
| POST | `/appel-cotisation/declaration/recuperer-produits` | `getCotisationProduits` |
| POST | `/appel-cotisation/declaration/traiter-piece-jointe` | `cotisationAttachement` |
| POST | `/beneficiaire-ebia/consultation/ajouter-piece-justificative-dans-affiliation` | `beneficiaireEbiaAddDoc` |
| POST | `/beneficiaire-ebia/consultation/envoyer-relance` | `ebiaResendMembership` |
| POST | `/beneficiaire-ebia/consultation/recuperer-affiliation` | `getDetailsBeneficiarieEbia` |
| POST | `/beneficiaire-ebia/consultation/recuperer-piece-justificative` | `beneficiaireEbiaGetDoc` |
| POST | `/beneficiaire-ebia/consultation/refuser-ayant-droit` | `ebiaRjectBeneficiary` |
| POST | `/beneficiaire-ebia/consultation/signaler-absence-ou-invalidite-piece-justificative` | `ebiaReportMissingDocument` |
| POST | `/beneficiaire-ebia/consultation/supprimer-affiliation` | `ebiaRemoveMembership` |
| POST | `/beneficiaire-ebia/consultation/valider-affiliations` | `ebiaValidateAffiliations, ebiaValidateMembership` |
| POST | `/beneficiaire-ebia/declaration/declarer-unitaire` | `ebiaUnitaryDeclare` |
| POST | `/beneficiaire-ebia/declaration/enregistrer-demande-declarations-en-masse` | `ebiaInMassSendRequest` |
| POST | `/beneficiaire-ebia/declaration/modifier-declaration` | `ebiaEditMembership` |
| POST | `/beneficiaire-ebia/declaration/recuperer-comptes-rendus-import-en-masse` | `ebiaInMassGetImportFiles` |
| POST | `/beneficiaire-ebia/declaration/recuperer-donnees-contrat` | `ebiaRetrieveContractData` |
| POST | `/beneficiaire-ebia/declaration/recuperer-fichier-compte-rendu-import-en-masse` | `ebiaInMassGetSpecificFile` |
| POST | `/beneficiaire-ebia/declaration/recuperer-structure-fichier-declaration-en-masse` | `ebiaInMassGetFile` |
| POST | `/beneficiaire-ebia/recherche/rechercher-salaries` | `searchEbiaInscriptions` |
| POST | `/beneficiaire-ebia/recherche/recuperer-fichier-ged` | `downloadExtractEBIA` |
| POST | `/bilan-sante/demande/annuler` | `cancelBilan` |
| POST | `/bilan-sante/demande/enregistrer` | `saveBilanSante` |
| POST | `/bilan-sante/demande/recuperer` | `getBilanSanteDetail` |
| POST | `/bilan-sante/demandes/chercher` | `searchBilanSante` |
| POST | `/decompte/recherche/chercher-decomptes-beneficiaire` | `decomptesBenef` |
| POST | `/decompte/recherche/chercher-decomptes-contrats` | `decomptesContrat` |
| POST | `/decompte/recherche/criteres-beneficiaire` | `decomptesCriteria` |
| POST | `/decompte/recherche/exporter-decomptes-contrats` | `decomptesContratExport` |
| POST | `/document/consulter/document` | `downloadDocument` |
| POST | `/document/consulter/document-reporting` | `consultDataPortalDoc` |
| POST | `/dsn/mouvement/historique` | `searchDSNMovements` |
| POST | `/dsn/parametrage/consulter-fiche` | `getDSNDetail` |
| POST | `/dsn/parametrage/reemettre-fiche` | `reemitDSNFiche` |
| POST | `/dsn/parametrage/telecharger-fiche` | `downloadDSNFiche` |
| POST | `/fonctionnalite-beneficiaire/consultation/recuperer-coordonnees-postales` | `getBenefAddress` |
| POST | `/fonctionnalite-beneficiaire/demande/commander-carte-tp` | `getNewCard` |
| POST | `/fonctionnalite-beneficiaire/demande/envoyer-prise-en-charge-hospitaliere` | `pecBenef` |
| POST | `/gestion-beneficiaire/affiliation/abandonner-saisie-beneficiaire` | `cancelAdd` |
| POST | `/gestion-beneficiaire/affiliation/enregistrer-affiliation` | `saveAffiliation` |
| POST | `/gestion-beneficiaire/affiliation/enregistrer-beneficiaire` | `addBenef` |
| POST | `/gestion-beneficiaire/affiliation/liste-beneficiaires` | `getBenefList` |
| POST | `/gestion-beneficiaire/affiliation/radier` | `TerminatedBeneficary` |
| POST | `/gestion-beneficiaire/affiliation/recuperer-beneficiaire` | `getBenefInfos` |
| POST | `/gestion-beneficiaire/consultation/historique-mouvements-rh` | `searchMovements` |
| POST | `/gestion-beneficiaire/consultation/informations-renforts-individuels` | `getIndividualInformations` |
| POST | `/gestion-beneficiaire/consultation/recuperer-salaries` | `searchSalariesContract` |
| POST | `/gestion-beneficiaire/consultation/telecharger-certificat` | `downloadCertficate` |
| POST | `/gestion-beneficiaire/consultation/telecharger-salaries` | `downloadSearchSalariesContract` |
| POST | `/gestion-beneficiaire/consultation/verifier-matricules` | `ebiaRegistrationNumberVerify` |
| POST | `/gestion-beneficiaire/extraction/recuperer-fichier-ged` | `downloadExtractResultsSalaries` |
| POST | `/gestion-beneficiaire/recherche/consulter-salaries-et-produits` | `getInfoSalarie` |
| POST | `/gestion-beneficiaire/recherche/rechercher-salaries` | `searchSalaries` |
| POST | `/gestion-cookies/enregistrer-consentement` | `enregisterConsentementCookies` |
| POST | `/informations-annuelles/recuperer-document` | `getInfosAnnuelles` |
| POST | `/reseaux-soins/rechercher-partenaires-carte-blanche` | `carteBlancheSearchPartners` |
| POST | `/reseaux-soins/reseau-henner/chercher-partenaires` | `searchResmed` |
| POST | `/reseaux-soins/reseau-henner/contact` | `contactResmed` |
| POST | `/reseaux-soins/url-santeclair` | `getReseauxSanteclair` |
| POST | `/securite/login` | `authentifier` |
| POST | `/securite/regenerer-mot-de-passe` | `regenereMotDePasse` |
| POST | `/sinistre/consultation-dossier/ajouter-pieces-justificatives` | `sinisterAddFiles` |
| POST | `/sinistre/consultation-dossier/enregistrer-date-cloture` | `sinisterSetClosingDate` |
| POST | `/sinistre/consultation-dossier/enregistrer-date-sortie-effectif` | `sinisterSetExitDate` |
| POST | `/sinistre/consultation-dossier/enregistrer-salaires-partiels-therapeutique` | `sinsiterRecordPartialSalariesTherapeutic` |
| POST | `/sinistre/consultation-dossier/recherche-motif-sortie-effectif` | `sinisterListCauseExiting` |
| POST | `/sinistre/consultation-dossier/recherche-sinistre` | `sinisterSearch` |
| POST | `/sinistre/consultation-dossier/recuperer-piece-justificative` | `sinisterGetFile` |
| POST | `/sinistre/consultation-ijss/rechercher` | `sinisterSearchIjss` |
| POST | `/sinistre/consultation-ijss/rechercher-information` | `sinisterDetailIjss` |
| POST | `/sinistre/declaration/arret-travail` | `sinisterDeclareWorkStoppage` |
| POST | `/sinistre/declaration/consulter-sinistre-incapacite` | `sinisterConsultIncapacity` |
| POST | `/sinistre/declaration/consulter-sinistre-invalidite` | `sinisterConsultInvalidity` |
| POST | `/sinistre/declaration/controler-validite-sinistre-incapacite` | `sinisterControlValidityIncapacity` |
| POST | `/sinistre/declaration/controler-validite-sinistre-invalidite` | `sinisterControlValidityInvalidity` |
| POST | `/sinistre/declaration/invalidite` | `sinisterDeclareInvalidity` |
| POST | `/sinistre/declaration/refuser` | `sinisterRefuseWorkStoppage` |
| POST | `/sinistre/declaration/supprimer` | `sinisterDeleteeWorkStoppage` |
| POST | `/sinistre/extraction-prevoyance/editer-extraction-prevoyance` | `sinisterExtractRequest` |
| POST | `/sinistre/extraction-prevoyance/rechercher-demandes-travaux-non-emises` | `sinisterSearchExtract` |
| POST | `/sinistre/extraction-prevoyance/recuperer-historique-extractions` | `sinisterGetAllExtract` |
| POST | `/sinistre/recherche/controler-declaration-incapacite` | `sinisterControlDeclarationIncapacity` |
| POST | `/sinistre/recherche/controler-garantie-incapacite-active` | `controlerGarantie` |
| POST | `/sinistre/recherche/controler-garantie-invalidite-active` | `sinisterControlInvalidity` |
| POST | `/sinistre/recherche/enregistrer-action-sinistre` | `sinisterSaveAction` |
| POST | `/sinistre/recherche/information-dossier` | `sinisterGetDetail` |
| POST | `/sinistre/recherche/initialiser-dossier` | `sinisterInitializeFolder` |
| POST | `/sinistre/recherche/initialiser-sinistre-incapacite` | `sinisterInitIncapacity` |
| POST | `/sinistre/recherche/initialiser-sinistre-invalidite` | `sinisterInitInvalidity` |
| POST | `/sinistre/recherche/liste-categorie-professionnel` | `sinisterCategoryProList` |
| POST | `/sinistre/recherche/liste-date-cloture` | `sinisterListeCauseClosing` |
| POST | `/sinistre/recherche/liste-type-piece-justificative` | `sinisterListeFilesType` |
| POST | `/sinistre/recherche/modifier-action-sinistre` | `sinisterUpdateActions` |
| POST | `/sinistre/recherche/rechercher-action-sinistre` | `sinisterSearchActions` |
| POST | `/sinistre/recherche/rechercher-assure` | `sinisterLookingForInsured` |
| POST | `/sinistre/recherche/rechercher-entreprise` | `sinisterSearchCompany` |
| POST | `/sinistre/recherche/rechercher-liste-action` | `rechercherListAction` |
| POST | `/sinistre/recherche/supprimer-action-sinistre` | `sinisterDeleteActions` |
| POST | `/utilisateur/contacter-ug` | `contactMyRequests` |
| POST | `/utilisateur/contrat` | `getContractInfos` |
| POST | `/utilisateur/modifier-donnees-correspondant` | `modifierCorrespendant` |
| POST | `/utilisateur/recuperer-attachment` | `getUserMessageFile` |
| POST | `/utilisateur/resilier-contrat` | `terminateContract` |
| POST | `/utilisateur/web-call-back/demander-rappel` | `contactWebcallback` |

## Broker portal and supporting services

Across the broker frontend, 326 resolved call sites produce 335 normalized
patterns: 322 broker, 9 nomenclature, 3 authentication, and 1 CMS. Eleven
runtime/shared-library calls are preserved separately.

[Machine-readable broker catalogue](../spec/henner/broker-observed-routes.json).

### Broker business API

Base: `https://apim.henner.com/courtier/1.0`.

| Method | Relative path | Observed client method |
| --- | --- | --- |
| GET | `/apporteurs/commercial/{parameter1}/controler/siret/{parameter2}` | `getAuthorizationQuote` |
| GET | `/apporteurs/commercial/{parameter1}/offres/multi-site` | `getCommercialOffers` |
| POST | `/apporteurs/commerciaux` | `createCommercial` |
| POST | `/apporteurs/commerciaux/recherche` | `getCommercials` |
| PATCH | `/apporteurs/commerciaux/{id}/fermeture` | `switchMemberStatus` |
| PATCH | `/apporteurs/commerciaux/{id}/reactivation` | `switchMemberStatus` |
| GET | `/apporteurs/commerciaux/{parameter1}` | `getCommercialProfile` |
| PUT | `/apporteurs/commerciaux/{parameter1}` | `updateUser` |
| PUT | `/apporteurs/commerciaux/{parameter1}/coordonnees-electroniques` | `updateCommercialEmail, updateUserEmail` |
| GET | `/apporteurs/commerciaux/{parameter1}/documents/photo` | `getCommercialPhoto` |
| PATCH | `/apporteurs/commerciaux/{parameter1}/documents/photo` | `patchCommercialPhoto` |
| PATCH | `/apporteurs/commerciaux/{parameter1}/profils` | `updateCommercialProfile` |
| GET | `/apporteurs/parcours` | `getPathways` |
| GET | `/apporteurs/rattaches` | `getSecondaryBrokers` |
| GET | `/apporteurs/{parameter1}` | `getApporteur` |
| POST | `/apporteurs/{parameter1}/bordereaux-commissions/recherche` | `searchSlipsCommission` |
| GET | `/apporteurs/{parameter1}/bordereaux-commissions/{parameter2}` | `getSlipsCommissionDocument` |
| GET | `/apporteurs/{parameter1}/documents/logo` | `getApporteurLogo` |
| PATCH | `/apporteurs/{parameter1}/documents/logo` | `patchUserLogo` |
| POST | `/authentification/sso` | `getRepamToken` |
| GET | `/authentification/sso/valider` | `validateRepamToken` |
| POST | `/avenants/beneficiaires/individuel/types/{parameter1}` | `sendAddBenefEndorsementRequest` |
| GET | `/avenants/categories` | `getEndorsementCategories` |
| POST | `/avenants/changement-couverture/individuel/types/{parameter1}` | `sendContractEndorsementRequest` |
| GET | `/avenants/clients/{parameter1}` | `getEndorsementTypesClient` |
| GET | `/avenants/contrats/{parameter1}` | `getEndorsementTypesContract` |
| GET | `/avenants/contrats/{parameter1}/categorie/{parameter2}` | `getEndorsementReasonsForCancellation` |
| POST | `/avenants/coordonnees-bancaires/types/{parameter1}` | `sendBeneficiaryBankDetailsUpdateRequest, sendChangeRIBEndorsementRequest` |
| POST | `/avenants/coordonnees-postales/types/{parameter1}` | `sendChangeAddressEndorsementRequest` |
| POST | `/avenants/export` | `exportEndorsements` |
| POST | `/avenants/global/types/{parameter1}` | `createAvenantGlobalPricing` |
| POST | `/avenants/recherche` | `getEndorsements` |
| POST | `/avenants/resiliation/types/{parameter1}` | `sendContractCancellationRequest` |
| GET | `/avenants/statuts` | `getEndorsementStatus` |
| GET | `/avenants/types/{parameter1}/contrats/{parameter2}/dates-effet` | `loadEndorsementEffectiveDate` |
| GET | `/avenants/types/{parameter1}/justificatifs` | `getEndorsementsDocuments` |
| GET | `/avenants/{parameter1}` | `getEndorsementDetail` |
| GET | `/avenants/{parameter1}/actions` | `getEndorsementActions` |
| POST | `/avenants/{parameter1}/actions/{parameter2}` | `setEndorsementAction` |
| GET | `/avenants/{parameter1}/commentaires` | `getEndorsementComments` |
| GET | `/avenants/{parameter1}/documents` | `getEndorsementDocument` |
| POST | `/avenants/{parameter1}/documents/{parameter2}` | `endorsementUploadFile, endorsementUploadFileBenef` |
| GET | `/avenants/{parameter1}/types-documents/{parameter2}/documents/{parameter3}` | `dowloadEndorsementDoc` |
| POST | `/avenants/{parameter1}/types/{parameter2}` | `createAvenantEffetiveDate` |
| POST | `/back-office/apporteurs/activation` | `activateBroker` |
| POST | `/back-office/apporteurs/commerciaux` | `createInternalUser` |
| POST | `/back-office/apporteurs/commerciaux/inspecteur` | `createInternalInspectorAtout` |
| POST | `/back-office/apporteurs/commerciaux/vente-directe` | `createInternalInspector` |
| GET | `/back-office/apporteurs/inspecteurs` | `getBrokerInspectors` |
| POST | `/back-office/apporteurs/mandat-exclusivite` | `siretUnlock` |
| POST | `/back-office/apporteurs/recherche` | `brokersSearch` |
| POST | `/back-office/clients/recherche` | `getClients` |
| POST | `/back-office/contrats-colleges/recherche` | `getContracts` |
| POST | `/back-office/factures/recherche` | `getBillsOfUser` |
| GET | `/bases-calcul{parameter1}` | `getCalculationBases` |
| GET | `/civilites` | `loadCivilities` |
| POST | `/clients/recherche` | `getClients` |
| POST | `/colleges/selection-medicale` | `getEligibilityCollegesMedicalSelection` |
| GET | `/communes/{parameter1}` | `indivGetTown` |
| GET | `/conseils/ccn/portail` | `getCCNPortalUrl` |
| POST | `/contrats-colleges/recherche` | `getContracts` |
| POST | `/contrats/back-office/souscription-jour/recherche` | `getContractsDay` |
| POST | `/contrats/export` | `exportContracts` |
| GET | `/contrats/individuel/{parameter1}/assures` | `getAssuredContract, getClientBeneficiaries` |
| GET | `/contrats/individuel/{parameter1}/tarif` | `getContractTarifs` |
| POST | `/contrats/prevoyance/due` | `postDueForesight` |
| POST | `/contrats/sante/due` | `postDueHealth` |
| POST | `/contrats/souscription-jour/recherche` | `getContractsDay` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/consultation-assure-produits` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/consultation-assures` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/consultation-mouvements` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/gestion-pre-inscription` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/inscription-assure` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/modification-assure` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/pre-inscription` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{numero}/{trigramme}/{risqueCode}/lien-site-rh/validation-adhesions` | `loadURLContractsDayOavToRh` |
| GET | `/contrats/souscription-jour/{parameter3}/{parameter2}/documents/{documentTypeCode}/{documentId}` | `getContractDayDocument` |
| GET | `/contrats/{contractId}/documents/{documentTypeCode}` | `getContractDocument` |
| GET | `/contrats/{contractId}/lien-site-rh` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/consultation-assure-produits` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/consultation-assures` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/consultation-mouvements` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/gestion-pre-inscription` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/inscription-assure` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/modification-assure` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/pre-inscription` | `loadURLOavToRh` |
| GET | `/contrats/{contractId}/lien-site-rh/validation-adhesions` | `loadURLOavToRh` |
| GET | `/contrats/{contractSegment}/souscription-jour/{parameter2}/{parameter3}/{parameter4}/documents` | `getContractDayDocuments` |
| GET | `/contrats/{contractSegment}/{contractId}` | `getContract` |
| GET | `/contrats/{contractSegment}/{contractId}/documents` | `getContractDocuments` |
| GET | `/contrats/{contractSegment}/{trigramme}/{numero}` | `getContractByContractNumber` |
| GET | `/contrats/{parameter1}/carte-tp` | `searchTPCard` |
| GET | `/contrats/{parameter1}/client-signataire/{parameter2}` | `getClientContracts` |
| GET | `/contrats/{parameter1}/cotisations` | `getContractContribution` |
| GET | `/contrats/{parameter1}/factures/{parameter2}/documents` | `downloadBillOfContract` |
| GET | `/contrats/{parameter1}/reversements` | `getContractOutpayment` |
| GET | `/contrats/{parameter1}/souscription-jour/{parameter2}/{parameter3}/{parameter4}` | `getContractDay` |
| GET | `/contrats/{parameter1}/{parameter2}/affiliations/{parameter3}/produits` | `getContractAffiliationProducts` |
| POST | `/coordonnees/bancaires/pays-autorises` | `getCountriesBank` |
| GET | `/criteres-tarification/conformite` | `getConformite` |
| GET | `/devis-individuel/activites` | `getTnsActivitiesList` |
| GET | `/devis-individuel/activites/caisses/{parameter1}/classes` | `getTnsClassList` |
| POST | `/devis-individuel/avenant/calcul-cotisation` | `tariferAvenant` |
| POST | `/devis-individuel/avenant/valider` | `validerAvenant` |
| POST | `/devis-individuel/back-office/demande-adhesion/donnees-personnelles` | `updatePersonalData` |
| GET | `/devis-individuel/back-office/demande-adhesion/parametres-recherche` | `loadMembershipIndivParametres` |
| POST | `/devis-individuel/back-office/demande-adhesion/recherche` | `getMembershipIndivRequests` |
| GET | `/devis-individuel/back-office/demande-adhesion/{id}/donnees-personnelles` | `getPersonalData` |
| PATCH | `/devis-individuel/back-office/demande-adhesion/{id}/parametres` | `updateParametresAdhesion` |
| GET | `/devis-individuel/back-office/demande-adhesion/{parameter1}` | `loadMembershipIndivDetails` |
| PATCH | `/devis-individuel/back-office/demande-adhesion/{parameter1}` | `updateDemandeRisques` |
| GET | `/devis-individuel/back-office/demande-adhesion/{parameter1}/documents` | `loadMembershipIndivDocument` |
| GET | `/devis-individuel/back-office/demande-adhesion/{parameter1}/parametres/critere` | `loadParametresAdhesion` |
| PATCH | `/devis-individuel/back-office/promotion` | `updatePromotion` |
| PUT | `/devis-individuel/back-office/promotion` | `createPromotion` |
| GET | `/devis-individuel/back-office/promotion/critere` | `listPromotionCriteria` |
| POST | `/devis-individuel/back-office/promotions` | `listPromotions` |
| GET | `/devis-individuel/back-office/surprimes/{parameter1}` | `getSurprimes` |
| POST | `/devis-individuel/back-office/surprimes/{parameter1}` | `calculateSurprimes` |
| GET | `/devis-individuel/back-office/{parameter1}/documents-postes` | `getDocumentsIndivDownloadedByBroker` |
| POST | `/devis-individuel/cagnottes/compagnies` | `sendCompanyPotUpdateRequest` |
| POST | `/devis-individuel/cagnottes/mouvements` | `getPotMovementRequests` |
| GET | `/devis-individuel/cagnottes/{parameter1}` | `getPotInitData, getPotRequests` |
| PATCH | `/devis-individuel/cagnottes/{parameter1}` | `sendPotUpdateRequest` |
| POST | `/devis-individuel/cagnottes/{parameter1}` | `sendPotCreationRequest` |
| GET | `/devis-individuel/cagnottes/{parameter1}/{parameter2}` | `getPotInitData` |
| GET | `/devis-individuel/cagnottes/{parameter1}/{parameter2}/allocations` | `getPotAllocationRequests` |
| POST | `/devis-individuel/devis-chapeaux/recherche` | `getIndivQuotations` |
| GET | `/devis-individuel/devis-chapeaux/{parameter1}` | `getSuperQuotation` |
| POST | `/devis-individuel/devis-chapeaux/{parameter1}/contrats` | `indivSubscribe` |
| DELETE | `/devis-individuel/devis-chapeaux/{parameter1}/devis/{parameter2}` | `removeQuotationFromSuperQuote` |
| POST | `/devis-individuel/devis-chapeaux/{parameter1}/duplication` | `superQuotationDuplication` |
| GET | `/devis-individuel/devis/{parameter1}/promotions` | `getListPromotionsCoupling` |
| PUT | `/devis-individuel/devis/{parameter1}/promotions` | `setPromoActive` |
| PUT | `/devis-individuel/devis/{parameter1}/promotions/couplage` | `setCouplingPromoActive` |
| GET | `/devis-individuel/devis/{parameter1}/statuts` | `getContractsStatus` |
| POST | `/devis-individuel/garanties` | `getIndivTDG` |
| POST | `/devis-individuel/offres/promotions/recherche` | `checkIfHavingCouplingOffers` |
| POST | `/devis-individuel/pages` | `createQuotation` |
| POST | `/devis-individuel/pages/recherche` | `searchPages` |
| POST | `/devis-individuel/signature-electronique/export` | `exportSignIndivRequests` |
| POST | `/devis-individuel/signature-electronique/recherche` | `getSignIndivRequests` |
| PATCH | `/devis-individuel/{parameter1}/cagnottes` | `setCagnotte` |
| GET | `/devis-individuel/{parameter1}/conseil` | `searchDta` |
| POST | `/devis-individuel/{parameter1}/conseil` | `saveDta` |
| GET | `/devis-individuel/{parameter1}/conseil/recommandation` | `indivRecommandedFormula` |
| POST | `/devis-individuel/{parameter1}/contrat` | `validerSouscriptionIndiv` |
| GET | `/devis-individuel/{parameter1}/documents` | `getContractOfferDocuments` |
| POST | `/devis-individuel/{parameter1}/documents/envoi` | `sendDocuments` |
| PATCH | `/devis-individuel/{parameter1}/formules` | `patchPricing` |
| POST | `/devis-individuel/{parameter1}/leviers` | `indivSetSelectedLever` |
| GET | `/devis-individuel/{parameter1}/mails/etude-personnalisee` | `getEmailContent` |
| GET | `/devis-individuel/{parameter1}/offres-commerciales/{parameter2}/relance` | `relaunchCustomer` |
| PUT | `/devis-individuel/{parameter1}/pages` | `updateQuotation` |
| GET | `/devis-individuel/{parameter1}/pieces` | `indivGetDocumentsRequireToSubscribe` |
| POST | `/devis-individuel/{parameter1}/pieces` | `indivSubscriptionUploadFiles, uploadContractOfferDocument` |
| PATCH | `/devis-individuel/{parameter1}/signature-electronique` | `electronicSignIndivRelaunch` |
| POST | `/devis-individuel/{parameter1}/souscription/formules` | `saveSelectedFormulasToSubscribe` |
| PUT | `/devis-individuel/{parameter1}/tns/documents` | `sendTnsProposalHistoImage` |
| GET | `/devis-individuel/{parameter1}/tns/formules/beneficiaires` | `getTnsPrevBenefList` |
| POST | `/devis-individuel/{parameter1}/tns/formules/beneficiaires` | `setTnsPrevBenefList` |
| PATCH | `/devis-individuel/{parameter1}/tns/tarification` | `patchTnsForesightPricing` |
| PUT | `/devis-individuel/{parameter1}/tns/tarification` | `setTnsForesightPricing` |
| GET | `/devis-individuel/{quoteId}/documents/{documentType}` | `getQuotaionPDFFormat, getQuotaionPDFFormatToDisplay, getQuotaionPDFFormatToDisplayBlob` |
| GET | `/devis-individuel/{quoteId}/tarification` | `getIndivPricing` |
| GET | `/devis-individuel/{quoteId}/tns/tarification` | `getIndivPricing` |
| POST | `/devis/back-office/demandes-adhesion/recherche` | `getMembershipRequests` |
| DELETE | `/devis/back-office/demandes-adhesion/{parameter1}` | `deleteMembershipRequest` |
| GET | `/devis/back-office/demandes-adhesion/{parameter1}` | `getMembershipRequestsQuotationDetails` |
| POST | `/devis/back-office/demandes-adhesion/{parameter1}/attente-pieces` | `setWaitingForAttachementsDocs` |
| POST | `/devis/back-office/demandes-adhesion/{parameter1}/reedition` | `regenerateDocuments` |
| PUT | `/devis/back-office/demandes-adhesion/{parameter1}/saisie-contrat` | `updateContractAssociation` |
| POST | `/devis/back-office/demandes-adhesion/{parameter1}/souscription` | `validateMembershipSubscription` |
| POST | `/devis/back-office/demandes-adhesion/{parameter1}/unite-gestion` | `subscribeMembershipManually` |
| GET | `/devis/back-office/demandes-adhesions/{parameter1}/documents` | `getMembershipContractDocuments` |
| GET | `/devis/back-office/demandes-adhesions/{parameter1}/documents/bmf` | `getBmfDocument` |
| PUT | `/devis/back-office/{parameter1}/{parameter2}/propositions/{parameter3}` | `updateMembershipCollege` |
| POST | `/devis/collectif` | `validateQuote` |
| GET | `/devis/collectif/documents/due/questions` | `getDUEQuestions` |
| GET | `/devis/collectif/documents/due/{parameter1}/reponses` | `getSubscriptionDUEResponse` |
| POST | `/devis/collectif/documents/due/{parameter1}/reponses` | `setSubscriptionDUE` |
| GET | `/devis/collectif/propositions-commerciales/{parameter1}/propositions/{parameter2}/edition/due` | `getSubscriptionDUEedition` |
| GET | `/devis/collectif/propositions-commerciales/{parameter1}/questionnaire-medical/salaries` | `QMGetSalariesInfo` |
| POST | `/devis/collectif/propositions-commerciales/{parameter1}/questionnaire-medical/salaries` | `QMPostSalarieInfo` |
| DELETE | `/devis/collectif/propositions-commerciales/{parameter1}/questionnaire-medical/salaries/{parameter2}` | `QMDeleteSalarieInfo` |
| PUT | `/devis/collectif/propositions-commerciales/{parameter1}/questionnaire-medical/salaries/{parameter2}` | `QMUpdateSalarieInfo` |
| PATCH | `/devis/collectif/questionnaire-medical/rejeu` | `PatchMqEmployeeInfo` |
| PATCH | `/devis/collectif/questionnaire-medical/relance` | `onlineMqRelaunch` |
| POST | `/devis/collectif/questionnaires-medicaux/recherche` | `getOnlineMqsList` |
| POST | `/devis/collectif/signatures-electroniques/recherche` | `getSignRequests` |
| PUT | `/devis/collectif/signatures-electroniques/{parameter1}/relance` | `electronicSignRelaunch` |
| GET | `/devis/collectif/{parameter1}/client-signataire` | `loadQuotationClient` |
| PUT | `/devis/coordonnees/postales/{parameter1}` | `updateClientAddressInformations, updateClientPostalCoordinates` |
| POST | `/devis/correspondant-entreprise` | `createCorrespondantEntreprise` |
| PUT | `/devis/correspondant-entreprise/{parameter1}` | `updateCorrespondantEntreprise` |
| GET | `/devis/demandes-adhesions/{parameter1}/documents/{parameter2}` | `getContractDayDocument, getMembershipContractDocument` |
| GET | `/devis/derogations/motifs` | `getDerogationsReasons` |
| POST | `/devis/derogations/recherche` | `derogationsSearch` |
| GET | `/devis/derogations/{parameter1}` | `loadDerogation` |
| GET | `/devis/derogations/{parameter1}/commentaires` | `loadDerogationCorrespondence` |
| GET | `/devis/derogations/{parameter1}/documents` | `getCompetitorQuoteInformations` |
| GET | `/devis/derogations/{parameter1}/documents/devis-concurrent` | `getCompetitorQuoteFile` |
| DELETE | `/devis/propositions` | `deleteProposal` |
| GET | `/devis/propositions/{parameter1}/bases-calcul` | `getSlicesToBeInsuredForProposal` |
| GET | `/devis/propositions/{proposalId}/structures-tarifaires` | `getPricingFamiliesForProposal` |
| POST | `/devis/recherche` | `getQuotations` |
| POST | `/devis/signatures-electroniques/signataires` | `createSignataire` |
| PUT | `/devis/signatures-electroniques/signataires/{parameter1}` | `updateSignataire` |
| POST | `/devis/souscription-partenaire` | `createBackOfficeContract` |
| POST | `/devis/sur-mesure/demande-contact` | `CustomFormRequestContact` |
| POST | `/devis/sur-mesure/demande-etude` | `CustomFormStudyRequest` |
| DELETE | `/devis/{parameter1}` | `deleteQuotation` |
| GET | `/devis/{parameter1}` | `getQuote` |
| PATCH | `/devis/{parameter1}/client-signataire/{parameter2}` | `selectClientCompany` |
| GET | `/devis/{parameter1}/coordonnees/bancaires` | `getQuotationBankDetails` |
| PUT | `/devis/{parameter1}/coordonnees/bancaires/{parameter2}` | `updateUserBankDetails` |
| GET | `/devis/{parameter1}/correspondants-entreprises` | `loadCorrespondenceEntreprise` |
| DELETE | `/devis/{parameter1}/correspondants-entreprises/{parameter2}` | `removeCorrespondantsEntreprises` |
| GET | `/devis/{parameter1}/couplage` | `getQuoteCouplage` |
| POST | `/devis/{parameter1}/couplage` | `sendCouplingChoice` |
| POST | `/devis/{parameter1}/derogations` | `createAndValidDerogation` |
| PUT | `/devis/{parameter1}/derogations/{parameter2}/refus` | `denyDerogation` |
| PUT | `/devis/{parameter1}/derogations/{parameter2}/validation` | `acceptDerogation` |
| POST | `/devis/{parameter1}/documents/envoi` | `sendQuotationDocuments` |
| GET | `/devis/{parameter1}/documents/televersements` | `getDocumentsDownloadedByBroker` |
| POST | `/devis/{parameter1}/documents/televersements/{parameter2}` | `uploadQuotationDocument` |
| GET | `/devis/{parameter1}/documents/televersements/{parameter2}/{parameter3}` | `getContractDayDocument, getDocumentDownloadedByBroker` |
| POST | `/devis/{parameter1}/duplication` | `duplicateQuote` |
| POST | `/devis/{parameter1}/edition` | `updateQuote` |
| POST | `/devis/{parameter1}/personnes/{parameter2}/roles/{parameter3}/coordonnees` | `creatUserBankDetails` |
| GET | `/devis/{parameter1}/signatures-electroniques/signataires` | `loadSignataire` |
| POST | `/devis/{parameter1}/souscription` | `finalizeSubscription` |
| POST | `/devis/{parameter1}/souscription/controle` | `controlColleges` |
| POST | `/devis/{parameter1}/souscription/signature-electronique` | `finalizeSubscriptionWithElectronicSign` |
| PUT | `/devis/{parameter1}/{parameter2}/derogations/{parameter3}` | `updateDerogation` |
| PUT | `/devis/{parameter1}/{parameter2}/propositions/{parameter3}` | `updateDataSubscriptionByCollege` |
| GET | `/devis/{quoteId}/documents/{documentTypeCode}` | `getContractDayDocument, getQuotationDocument` |
| POST | `/factures/export` | `exportBillsOfUser` |
| POST | `/factures/recherche` | `getBillsOfUser` |
| GET | `/fonctions-partenaire` | `loadPartnerFunctions` |
| POST | `/formulaire/valoriser` | `answerCollegeInformation, validateCollegeCriteria` |
| POST | `/garanties/export` | `downloadCompareGuarantees` |
| POST | `/garanties/recherche` | `searchGuarantees` |
| POST | `/inspecteurs/recherche` | `inspectorsAtoutSearch` |
| GET | `/liens-parente` | `loadParentLink` |
| GET | `/modalites-remises-salaries` | `getTermsOfDelivery` |
| GET | `/motifs-contact-connecte` | `getReasonsContact` |
| GET | `/motifs-contact-non-connecte` | `getReasonsContact` |
| GET | `/offres-commerciales/ccn/recherche` | `getCatalogCCn` |
| POST | `/offres-commerciales/recherche` | `searchCommercialOffers` |
| POST | `/offres-commerciales/services` | `getCommercialOffersServices` |
| GET | `/offres-commerciales/{parameter1}` | `getCommercialOffer` |
| POST | `/offres-commerciales/{parameter1}/documents` | `searchCommercialOffersDocumentation` |
| POST | `/offres-commerciales/{parameter1}/{parameter2}/documents` | `getCommercialProposalRiskDocuments` |
| POST | `/offres/recherche` | `getAllOffers, searchOffer, searchOffers` |
| GET | `/offres/{parameter1}` | `getOffer` |
| GET | `/offres/{parameter1}/coordonnees/bancaires/pays` | `getBankCountries` |
| GET | `/offres/{parameter1}/criteres-statistiques` | `getStatisticalCriterias` |
| GET | `/offres/{parameter1}/dates-effet` | `getEffectiveDates` |
| GET | `/offres/{parameter1}/formules` | `getOfferFormulas` |
| GET | `/offres/{parameter1}/modes-envoi/cartes-tp` | `getThirdPartyCardSendingMethods` |
| DELETE | `/panier/fermer` | `closeCart` |
| POST | `/parcours/ouvrir` | `recoveryQuote, startCalculatorWorkflow` |
| POST | `/parcours/pages/recherche` | `searchPage` |
| POST | `/parcours/risques` | `getOffers` |
| POST | `/parcoursconfiguration/ajouter-college` | `addCollegeCriteria` |
| POST | `/parcoursconfiguration/ajouter-risque` | `startCalculatorAddRiskWorkflow` |
| POST | `/partenaires/demande-adhesion` | `createPartnerSubscription` |
| GET | `/personnes/morale` | `getCompanies` |
| POST | `/personnes/morale` | `createCompany, updateCompany` |
| GET | `/personnes/morale/{parameter1}` | `getCompanyById` |
| POST | `/proposition-commerciale/creer-maj-proposition` | `updateCommecialProposition` |
| PATCH | `/proposition-commerciale/desactiver` | `removeCollegeCriteria` |
| POST | `/propositions-commerciales/{parameter1}/documents/devis-concurrent` | `sendDerogationJustify` |
| PATCH | `/propositions-commerciales/{parameter1}/{parameter2}/propositions` | `validateProposalCart` |
| PATCH | `/propositions/{parameter1}/formules` | `updateProposalGuaranteeLevel` |
| PATCH | `/propositions/{parameter1}/taux-commission` | `updateProposalCommissionRate` |
| GET | `/questionnaires/besoin-risque` | `getNeedsQuestionnaire` |
| POST | `/questionnaires/souscription` | `getQuestionInformations` |
| GET | `/recuperer-criteres-tarification` | `getPricingCriteria` |
| GET | `/redirection/lien-ancien-oav/consulter-demandes-adhesion-courtier` | `loadDashboardToOldOavMembershipsDemandesLink` |
| GET | `/redirection/lien-ancien-oav/consulter-demandes-adhesion-indiv` | `loadURLOavToOldOavMembershipsRequest` |
| GET | `/redirection/lien-ancien-oav/consulter-devis` | `loadDashboardToOldOavQuotationsLink` |
| GET | `/redirection/lien-ancien-oav/consulter-signature` | `loadDashboardToOldOavElectronicSignLink` |
| GET | `/redirection/lien-ancien-oav/creer-devis-TNS` | `getOldOAVUrl` |
| GET | `/redirection/lien-ancien-oav/creer-devis-expatries` | `getOldOAVUrl` |
| GET | `/redirection/lien-ancien-oav/creer-devis-obseques` | `getOldOAVUrl` |
| GET | `/redirection/lien-ancien-oav/creer-devis-onesure` | `getOldOAVUrl` |
| GET | `/redirection/lien-ancien-oav/creer-devis-particulier` | `getOldOAVUrl` |
| GET | `/redirection/lien-ancien-oav/gerer-ere` | `loadDashboardToOldOavElectronicRegisteredTrackingLink` |
| GET | `/redirection/lien-ancien-oav/{parameter1}` | `loadOldOavLink` |
| GET | `/redirection/partenaires/kalixia` | `getKalixiaUrl` |
| GET | `/risques/contrats` | `loadContractRisk` |
| GET | `/risques/devis` | `loadQuotationRisk` |
| GET | `/structures-tarifaires` | `getPricingFamilies` |
| GET | `/tarifications/couplage` | `getCoupling` |
| POST | `/tarifications/couplage` | `getCouplingInformations` |
| PUT | `/tarifications/couplage` | `setPromoCoupling` |
| POST | `/tarifications/propositions` | `createProposal` |
| POST | `/tarifications/propositions/conformite` | `updateProposalPricingFamily` |
| PATCH | `/tarifications/propositions/derogations/demande-creation` | `createDerogation` |
| POST | `/tarifications/propositions/details-conformite` | `getProposalPricingConformityDetails` |
| POST | `/tarifications/propositions/details-conformite/prestations` | `getProposalPricingConformityPrestationsDetails` |
| POST | `/tarifications/propositions/selection-medicale` | `getProposalMedicalSelection` |
| GET | `/tarifications/sante/{parameter1}/options` | `getPricingOptions` |
| PATCH | `/tarifications/{parameter1}/propositions/derogations` | `updateDerogationRate` |
| GET | `/tarifications/{parameter1}/{parameter2}` | `tarification` |
| PUT | `/tarifications/{parameter1}/{parameter2}/budgets` | `budgetCalculate` |
| GET | `/types-college` | `getCollegesTypes` |
| POST | `/utilisateurs/activation` | `activateUserAccount` |
| POST | `/utilisateurs/contact-henner` | `sendFormContactMail` |
| GET | `/utilisateurs/contrats` | `getMHContractInfo` |
| GET | `/utilisateurs/informations` | `getUserData` |
| POST | `/utilisateurs/init-activation/{parameter1}` | `initUserActivation` |
| POST | `/utilisateurs/internes/recherche` | `getInternalUsersByLogin` |
| GET | `/utilisateurs/jeton` | `getUserToken` |
| PATCH | `/utilisateurs/mot-de-passe` | `patchUserPassword` |
| PUT | `/utilisateurs/mot-de-passe` | `resetPassword` |
| POST | `/utilisateurs/mot-de-passe/demande-reinitialisation/{parameter1}` | `resetPasswordRequest` |
| GET | `/utilisateurs/profils-administrables` | `loadProfiles` |
| GET | `{parameter1}/{parameter2}/next` | `getQuestions` |

### Nomenclature

Base: `https://apim.henner.com/nomenclature/1.0`.

| Method | Relative path | Observed client method |
| --- | --- | --- |
| GET | `/caisses` | `loadSSNFunds, loadSSNFundsNum` |
| GET | `/ccn/{id}` | `getCCNByID` |
| GET | `/ccns` | `getIdccs` |
| GET | `/fonctions/correspondants-entreprises` | `loadCompanyProfiles` |
| GET | `/naf` | `getNaf` |
| GET | `/populations-cibles` | `loadSegments` |
| GET | `/regimes` | `loadSSNRegimes` |
| GET | `/statuts-securite-sociale` | `loadSSNStatus` |
| GET | `/telephones/indicatifs` | `loadPhonePrefixes` |

### Authentication

Base: `https://apim-auth.henner.com/oauth/authentication/1.0`.

| Method | Relative path | Observed client method |
| --- | --- | --- |
| GET | `/logout` | `logout` |
| POST | `/revoke` | `logout` |
| POST | `/token` | `connection` |

### CMS content

Base: `https://cms01.henner.com/api/henner/content`.

| Method | Relative path | Observed client method |
| --- | --- | --- |
| GET | `` | `getContent` |

## Read the evidence

Every catalogue call site links to a source URL, SHA-256 hash and UTF-16 offset.
The [source manifest](../spec/henner/source-manifest.json) identifies the exact
snapshot. Raw application bundles and credential/customer values are excluded.

Detailed body/response observations are available for selected workflows:

- [Employer DSN, contract identity and login](../spec/henner/employer-key-operations.json)
- [Broker subscription, contracts, documents and HR handoff](../spec/henner/broker-key-operations.json)
- [Broker unresolved/runtime calls](../spec/henner/broker-dynamic-calls.json)
- [Employer CMS and translation calls](../spec/henner/employer-resource-calls.json)

These files are research metadata. They are separate from the callable LYA SDK
and its generation pipeline.
