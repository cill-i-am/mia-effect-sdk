/**
 * Sanitized offline fixtures derived from the supplied Postman collection's JSONC bodies.
 * Saved response envelopes and field shapes are retained. Personal/contact/company identifiers,
 * addresses, opaque project references and document URLs are synthetic. No live response is claimed.
 */
export const pricingRequestFixture = [
  {
    "codeProduit": "1SURE_GLOBE",
    "parametres": [
      {
        "reference": "ZONE",
        "critereRef": "ZONE",
        "stringValue": "Zone 1"
      },
      {
        "reference": "COMMISSION",
        "critereRef": "COMMISSION",
        "stringValue": "10%"
      },
      {
        "reference": "TRANCHE_AGE",
        "critereRef": "TRANCHE_AGE",
        "stringValue": "Moins de 30 ans"
      },
      {
        "reference": "RENFORT",
        "critereRef": "RENFORT",
        "stringValue": "false"
      },
      {
        "reference": "ASSIETTE_CHOISIE",
        "critereRef": "ASSIETTE_CHOISIE",
        "stringValue": "AE"
      },
      {
        "reference": "SUR_MESURE",
        "critereRef": "SUR_MESURE",
        "stringValue": "false"
      },
      {
        "reference": "REPARTITION_DETAILLEE",
        "critereRef": "REPARTITION_DETAILLEE",
        "stringValue": "false"
      },
      {
        "reference": "TYPE_SURCOMPLEMENTAIRE",
        "critereRef": "TYPE_SURCOMPLEMENTAIRE",
        "stringValue": "Obligatoire"
      }
    ],
    "critereElligibilite": {
      "EFFECTIF": "12"
    }
  }
] as const;

export const syntecPricingRequestFixture = [
  {
    "codeProduit": "1SURE_PREVOYANCE_SYNTEC",
    "parametres": [
      {
        "reference": "TRANCHE_AGE",
        "critereRef": "TRANCHE_AGE",
        "stringValue": "Moins de 40 ans"
      },
      {
        "reference": "FORMULE_DC",
        "critereRef": "FORMULE_DC",
        "stringValue": "Niveau 2"
      },
      {
        "reference": "OBSEQUES",
        "critereRef": "OBSEQUES",
        "stringValue": "true"
      },
      {
        "reference": "MONTANT_OBSEQUE",
        "critereRef": "MONTANT_OBSEQUE",
        "stringValue": "100% PMSS"
      },
      {
        "reference": "FORMULE_AT",
        "critereRef": "FORMULE_AT",
        "stringValue": "Niveau 1"
      },
      {
        "reference": "FRANCHISE",
        "critereRef": "FRANCHISE",
        "stringValue": "30 jours"
      },
      {
        "reference": "COMMISSION",
        "critereRef": "COMMISSION",
        "stringValue": "0.055"
      },
      {
        "reference": "SUR_MESURE",
        "critereRef": "SUR_MESURE",
        "stringValue": "false"
      },
      {
        "reference": "REPARTITION_DETAILLEE",
        "critereRef": "REPARTITION_DETAILLEE",
        "stringValue": "false"
      }
    ],
    "critereElligibilite": {
      "EFFECTIF": "12"
    }
  }
] as const;

export const pricingEnvelopeFixture = {
  "statusHttp": "OK",
  "success": true,
  "codeMessage": null,
  "libelleMessage": null,
  "body": [
    {
      "createur": null,
      "creation_date": null,
      "partenaire": "1SURE",
      "type": null,
      "message": null,
      "identifiant": null,
      "duration": 0,
      "status": "Success",
      "resultat": {
        "detail": [],
        "devis": null,
        "criteresComparaisons": [],
        "stack": null,
        "urlVideo": null,
        "simulations": [
          {
            "type": "santeCol",
            "assureur": "1SURE",
            "codeProduit": "1SURE_GLOBE",
            "caracteristique1": 2,
            "caracteristique2": 2,
            "caracteristique3": 2,
            "caracteristique4": 3,
            "formule": "Niveau 200",
            "recommandee": false,
            "messages": [],
            "status": "Success",
            "criteres": [
              {
                "booleanValue": null,
                "critereRef": "FORMULE",
                "dateValue": null,
                "decimalValue": null,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "FORMULE",
                "stringValue": "Niveau 200",
                "valeurInString": "Niveau 200"
              },
              {
                "booleanValue": false,
                "critereRef": "RENFORT",
                "dateValue": null,
                "decimalValue": null,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "RENFORT",
                "stringValue": null,
                "valeurInString": "Non"
              },
              {
                "booleanValue": null,
                "critereRef": "DEMOGRAPHIE_ADULTES",
                "dateValue": null,
                "decimalValue": 0,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "DEMOGRAPHIE_ADULTES",
                "stringValue": null,
                "valeurInString": "0"
              },
              {
                "booleanValue": null,
                "critereRef": "PART_EMPLOYEUR",
                "dateValue": null,
                "decimalValue": 0,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "PART_EMPLOYEUR",
                "stringValue": null,
                "valeurInString": "0"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ADULTE_FINAL_TOTAL",
                "dateValue": null,
                "decimalValue": 61.28,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ADULTE_FINAL_TOTAL",
                "stringValue": null,
                "valeurInString": "61.28"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ENFANT_FINAL_TOTAL",
                "dateValue": null,
                "decimalValue": 34.04,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ENFANT_FINAL_TOTAL",
                "stringValue": null,
                "valeurInString": "34.04"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ADULTE_MENSUEL_TOTAL",
                "dateValue": null,
                "decimalValue": 61.28,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ADULTE_MENSUEL_TOTAL",
                "stringValue": null,
                "valeurInString": "61.28"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ADULTE_MENSUEL_BASE",
                "dateValue": null,
                "decimalValue": 61.28,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ADULTE_MENSUEL_BASE",
                "stringValue": null,
                "valeurInString": "61.28"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ADULTE_MENSUEL_SURCO",
                "dateValue": null,
                "decimalValue": 0.0,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ADULTE_MENSUEL_SURCO",
                "stringValue": null,
                "valeurInString": "0.00"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ENFANT_MENSUEL_TOTAL",
                "dateValue": null,
                "decimalValue": 34.04,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ENFANT_MENSUEL_TOTAL",
                "stringValue": null,
                "valeurInString": "34.04"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ENFANT_MENSUEL_BASE",
                "dateValue": null,
                "decimalValue": 34.04,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ENFANT_MENSUEL_BASE",
                "stringValue": null,
                "valeurInString": "34.04"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ENFANT_MENSUEL_SURCO",
                "dateValue": null,
                "decimalValue": 0.0,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ENFANT_MENSUEL_SURCO",
                "stringValue": null,
                "valeurInString": "0.00"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ADULTE_PMSS_TOTAL",
                "dateValue": null,
                "decimalValue": 1.53,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ADULTE_PMSS_TOTAL",
                "stringValue": null,
                "valeurInString": "1.53"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ADULTE_PMSS_BASE",
                "dateValue": null,
                "decimalValue": 1.53,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ADULTE_PMSS_BASE",
                "stringValue": null,
                "valeurInString": "1.53"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ADULTE_PMSS_SURCO",
                "dateValue": null,
                "decimalValue": 0,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ADULTE_PMSS_SURCO",
                "stringValue": null,
                "valeurInString": "0"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ENFANT_PMSS_TOTAL",
                "dateValue": null,
                "decimalValue": 0.85,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ENFANT_PMSS_TOTAL",
                "stringValue": null,
                "valeurInString": "0.85"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ENFANT_PMSS_BASE",
                "dateValue": null,
                "decimalValue": 0.85,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ENFANT_PMSS_BASE",
                "stringValue": null,
                "valeurInString": "0.85"
              },
              {
                "booleanValue": null,
                "critereRef": "TARIF_ADULTE_ENFANT_ENFANT_PMSS_SURCO",
                "dateValue": null,
                "decimalValue": 0,
                "integerValue": null,
                "nullValue": false,
                "orderIndex": 0,
                "parentRef": null,
                "reference": "TARIF_ADULTE_ENFANT_ENFANT_PMSS_SURCO",
                "stringValue": null,
                "valeurInString": "0"
              }
            ],
            "assietteCotisation": {
              "identifiant": null,
              "typeMontant": null,
              "typeAssietteCode": "ADULTE_ENFANT:STRUCTURE_COTISATION_SANTE_COLLECTIVE",
              "typeAssiette": null,
              "choisie": false,
              "tarifs": [
                {
                  "typeTarifCode": "ADULTE:TYPE_TARIF",
                  "typeTarif": null,
                  "priseEnChargeEmployeur": 0,
                  "montant": 61.28,
                  "montantPMSS": null
                },
                {
                  "typeTarifCode": "ENFANT:TYPE_TARIF",
                  "typeTarif": null,
                  "priseEnChargeEmployeur": 0,
                  "montant": 34.04,
                  "montantPMSS": null
                }
              ]
            }
          }
        ]
      }
    }
  ]
} as const;

export const createProjectFixture = {
  "besoin": {
    "type": "COLLECTIVE",
    "personnas": [
      "ENTREPRISE"
    ],
    "dateEffetSouhaitee": "2026-07-20T16:15:23.759Z",
    "intituleProjet": "Example project",
    "numeroProjetTiers": "external-project-example",
    "description": "Synthetic example description",
    "loginConseillerDestination": "advisor@example.test",
    "consentements": [
      {
        "type": "Marketing consent",
        "description": "Synthetic example description"
      }
    ],
    "contratActuel": {
      "type": "projetDevisContratActuelCollectifDTO",
      "satisfactionGestion": 3,
      "satisfactionRemboursement": 3,
      "notes": "Synthetic example notes",
      "gestionnaireCode": "TESSI",
      "partPriseEnChargeEmployeur": 50,
      "surcomplementaire": false,
      "souscriptionDate": "2023-07-20T16:15:23.759Z",
      "produit": {
        "assureur": {
          "code": "ALZ"
        }
      },
      "numeroPartenaire": "partner-reference-example",
      "assiettesCotisation": [
        {
          "typeMontant": "PMSS",
          "typeAssietteCode": "ADULTE_ENFANT:STRUCTURE_COTISATION_SANTE_COLLECTIVE",
          "tarifs": [
            {
              "typeTarifCode": "ADULTE:TYPE_TARIF",
              "priseEnChargeEmployeur": 50,
              "montant": 556,
              "montantPMSS": 12
            },
            {
              "typeTarifCode": "ENFANT:TYPE_TARIF",
              "priseEnChargeEmployeur": 50,
              "montant": 126,
              "montantPMSS": 10
            }
          ]
        }
      ]
    },
    "structureCotisationCode": "ADULTE_ENFANT:STRUCTURE_COTISATION_SANTE_COLLECTIVE",
    "pourcentagePriseEnChargeEmployeur": 50,
    "interlocuteur": {
      "civilite": "MONSIEUR",
      "nom": "Example",
      "prenom": "Alex",
      "email": "contact@example.test",
      "numeroTelephone": "0100000000",
      "fonction": "GERANT:MANDAT_ENTREPRISE"
    },
    "entreprise": {
      "codeAPE": "01.11Z:CODE_APE",
      "secondCodeAPE": "01.15Z:CODE_APE",
      "siret": "00000000000000",
      "raisonSociale": "Example Company",
      "creationDate": "2000-07-20T16:15:23.759Z",
      "voie": "1 Example Street",
      "complementAdresse": "Example Suite",
      "codePostal": "00000",
      "ville": "Example City",
      "pays": "FR:PAYS",
      "nombreSalaries": 15,
      "effectifCadre": 12,
      "effectifNonCadre": 3,
      "statutJuridique": "10:FORME_JURIDIQUE_TYPE",
      "conventionCollective": "1486:CONVENTION_COLLECTIVE_TYPE",
      "ageMoyenNonCadre": 25,
      "ageMoyenCadre": 38
    },
    "collegeType": [
      "CADRES:COLLEGE_TYPE"
    ],
    "demographies": [
      {
        "collegeCode": "CADRES:COLLEGE_TYPE",
        "ageMoyen": 32,
        "effectif": 5,
        "regimeCode": "GENERAL:REGIME_DEMOGRAPHIQUE",
        "nbIncapacitesOuInvalidites": 0,
        "nbSalariesSeuls": 2,
        "nbSalaries1Enfant": 1,
        "nbSalaries2EnfantsOuPlus": 1,
        "nbSalariesCouples": 1,
        "nbSalariesCouples1Enfant": 0,
        "nbSalariesCouples2OuPlus": 0,
        "masseSalarialeTrancheA": 0,
        "masseSalarialeTrancheB": 0,
        "masseSalarialeTrancheC": 0,
        "masseSalarialeTrancheD": 0
      }
    ]
  },
  "codeProduit": "1SURE_GLOBE",
  "parametres": [
    {
      "reference": "COUVERTURE_AYANTS_DROIT",
      "critereRef": "COUVERTURE_AYANTS_DROIT",
      "booleanValue": true
    },
    {
      "reference": "AFFICHAGE_ASSIETTE",
      "critereRef": "AFFICHAGE_ASSIETTE",
      "booleanValue": false
    },
    {
      "reference": "ASSIETTE_AVEC_AYANTS_DROIT",
      "critereRef": "ASSIETTE_AVEC_AYANTS_DROIT",
      "stringValue": "Adulte / Enfant"
    },
    {
      "reference": "AVEC_ALSACE_MOSELLE",
      "critereRef": "AVEC_ALSACE_MOSELLE",
      "booleanValue": false
    },
    {
      "reference": "COMMISSION",
      "critereRef": "COMMISSION",
      "stringValue": "10%"
    },
    {
      "reference": "FORMULE",
      "critereRef": "FORMULE",
      "stringValue": "Niveau 200"
    },
    {
      "reference": "RENFORT",
      "critereRef": "RENFORT",
      "stringValue": "false"
    }
  ],
  "critereElligibilite": {
    "EFFECTIF": "12"
  }
} as const;

export const syntecCreateProjectFixture = {
  "besoin": {
    "type": "PREVOYANCE_COLLECTIVE",
    "personnas": [
      "ENTREPRISE"
    ],
    "dateEffetSouhaitee": "2026-07-20T16:15:23.759Z",
    "intituleProjet": "Example project",
    "numeroProjetTiers": "external-project-example",
    "description": "Synthetic example description",
    "loginConseillerDestination": "advisor@example.test",
    "consentements": [
      {
        "type": "Accord de pub",
        "description": "Synthetic example description"
      }
    ],
    "contratActuel": {
      "type": "projetDevisContratActuelCollectifDTO",
      "satisfactionGestion": 3,
      "satisfactionRemboursement": 3,
      "notes": "Synthetic example notes",
      "gestionnaireCode": "TESSI",
      "partPriseEnChargeEmployeur": 50,
      "surcomplementaire": false,
      "souscriptionDate": "2023-07-20T16:15:23.759Z",
      "produit": {
        "assureur": {
          "code": "ALZ"
        }
      },
      "numeroPartenaire": "partner-reference-example",
      "assiettesCotisation": [
        {
          "typeMontant": "SALAIRE",
          "typeAssietteCode": "TRANCHEA:STRUCTURE_COTISATION_PREVOYANCE_COLLECTIVE",
          "tarifs": [
            {
              "typeTarifCode": "TRANCHEA:TYPE_TARIF",
              "priseEnChargeEmployeur": 50,
              "montant": 3.02
            }
          ]
        }
      ]
    },
    "repriseSinistreEnCours": true,
    "sinitresEnCours": true,
    "budgetPrecis": true,
    "montantBudgetPrecis": 3500,
    "couvertureSouhaiteCode": "MINIMUM_LEGAL:COUVERTURE_COLLEGE",
    "modaliteAdhesionCode": "REFERENDUM:MODALITE_ADHESION_SANTPREV_COLLECTIVE",
    "pourcentagePriseEnChargeEmployeur": 50,
    "interlocuteur": {
      "civilite": "MONSIEUR",
      "nom": "Example",
      "prenom": "Alex",
      "email": "contact@example.test",
      "numeroTelephone": "0100000000",
      "fonction": "GERANT:MANDAT_ENTREPRISE"
    },
    "entreprise": {
      "codeAPE": "01.11Z:CODE_APE",
      "secondCodeAPE": "01.15Z:CODE_APE",
      "siret": "00000000000000",
      "raisonSociale": "Example Company",
      "creationDate": "2000-07-20T16:15:23.759Z",
      "voie": "1 Example Street",
      "complementAdresse": "Example Suite",
      "codePostal": "00000",
      "ville": "Example City",
      "pays": "FR:PAYS",
      "nombreSalaries": 15,
      "effectifCadre": 12,
      "effectifNonCadre": 3,
      "statutJuridique": "10:FORME_JURIDIQUE_TYPE",
      "conventionCollective": "1486:CONVENTION_COLLECTIVE_TYPE",
      "ageMoyenNonCadre": 25,
      "ageMoyenCadre": 38
    },
    "collegeType": [
      "CADRES:COLLEGE_TYPE"
    ]
  },
  "codeProduit": "1SURE_PREVOYANCE_SYNTEC",
  "parametres": [
    {
      "reference": "FORMULE_DC",
      "critereRef": "FORMULE_DC",
      "stringValue": "Niveau 2"
    },
    {
      "reference": "EST_OBSEQUE",
      "critereRef": "EST_OBSEQUE",
      "booleanValue": true
    },
    {
      "reference": "OBSEQUES",
      "critereRef": "OBSEQUES",
      "stringValue": "100% PMSS"
    },
    {
      "reference": "INCAPACITE_INVALIDITE",
      "critereRef": "INCAPACITE_INVALIDITE",
      "stringValue": "Niveau 1"
    },
    {
      "reference": "FRANCHISE",
      "critereRef": "FRANCHISE",
      "stringValue": "30 jours"
    },
    {
      "reference": "COMMISSION",
      "critereRef": "COMMISSION",
      "stringValue": "10%"
    }
  ],
  "critereElligibilite": {
    "EFFECTIF": "12"
  }
} as const;

export const createdProjectEnvelopeFixture = {
  "statusHttp": "OK",
  "success": true,
  "codeMessage": null,
  "libelleMessage": null,
  "body": {
    "value": "project-creation-example"
  }
} as const;

export const projectEnvelopeFixture = {
  "statusHttp": "OK",
  "success": true,
  "codeMessage": null,
  "libelleMessage": null,
  "body": {
    "numeroProjet": "project-example",
    "encodedNumeroProjet": "encoded-project-example",
    "devis": {
      "type": "projetDevisDTO",
      "produit": {
        "type": "referentiel",
        "identifiant": 101,
        "assureur": {
          "code": "1SURE",
          "personne": {
            "type": "personneMorale",
            "identifiant": 101,
            "clientNumero": "customer-example",
            "raisonSociale": "Example Company",
            "enCreation": false,
            "nbSalaries": 0,
            "conventionsCollectives": []
          },
          "urlExtranetCourtier": "",
          "urlExtranetAssure": null,
          "urlLogo": "https://example.test/document",
          "courtiers": [
            "broker-example"
          ],
          "prive": true
        },
        "gestionnaire": {
          "code": "Henner",
          "personne": {
            "type": "personneMorale",
            "identifiant": 101,
            "clientNumero": "customer-example",
            "raisonSociale": "Example Company"
          },
          "urlExtranetCourtier": "https://example.test/document",
          "urlLogo": "https://example.test/document",
          "courtiers": [
            "broker-example"
          ],
          "prive": false
        },
        "porteurRisque": {
          "code": "GSMC",
          "personne": {
            "type": "personneMorale",
            "identifiant": 101,
            "clientNumero": "customer-example",
            "raisonSociale": "Example Company"
          },
          "urlExtranetCourtier": "https://example.test/document",
          "urlLogo": "https://example.test/document",
          "courtiers": [
            "broker-example"
          ],
          "prive": false
        },
        "nom": "Example",
        "code": "1SURE_GLOBE",
        "referenceVersion": "SANTE_COLLECTIVE/1SURE_GLOBE-2020.0",
        "domaineCode": "PREVOYANCE:DOMAINE_ASSURANCE",
        "domaine": "Santé & Prévoyance",
        "typologieCode": "SANTE_COLLECTIVE:TYPOLOGIE",
        "typologie": "Complémentaire santé salariés",
        "typeOffre": "Générique",
        "etatCode": "ACTIF:ETAT_PRODUIT",
        "descriptionClient": "Synthetic example product description",
        "cibles": "Les sociétés étrangères implantées en France.",
        "devisAutomatique": true,
        "soucriptionAutomatique": true,
        "typeSouscription": "API",
        "typeMiseEnGestion": "API",
        "typeTarification": "API",
        "adhesionSignatureElectronique": true,
        "elligible": true,
        "elligibiliteMessages": []
      },
      "numeroInterne": "internal-example",
      "intitule": "Example quote",
      "numeroPartenaire": "partner-reference-example",
      "numeroProjet": "project-example",
      "numeroClient": "customer-example",
      "selectionne": true,
      "favori": false,
      "automatique": true,
      "commission": "10%",
      "etatCode": "PRET:ETAT_PROJET_DEVIS",
      "etat": "Prêt",
      "assiettesCotisation": [
        {
          "identifiant": 101,
          "typeMontant": "EUROS",
          "typeAssietteCode": "ADULTE_ENFANT:STRUCTURE_COTISATION_SANTE_COLLECTIVE",
          "typeAssiette": "Adulte / Enfant",
          "choisie": true,
          "tarifs": [
            {
              "typeTarifCode": "ADULTE:TYPE_TARIF",
              "typeTarif": "Adulte",
              "priseEnChargeEmployeur": 50,
              "montant": 66.48,
              "montantPMSS": 1.66
            },
            {
              "typeTarifCode": "ENFANT:TYPE_TARIF",
              "typeTarif": "Tarif Enfant",
              "priseEnChargeEmployeur": 50,
              "montant": 38.05,
              "montantPMSS": 0.95
            }
          ]
        }
      ],
      "caracteristique1": 2,
      "caracteristique2": 2,
      "caracteristique3": 2,
      "caracteristique4": 3,
      "formule": "Niveau 200",
      "produitReferenceLegale": false,
      "montantAnnuel": null,
      "montant": null,
      "montantMensuel": null
    },
    "devisSelectionnes": [
      {
        "type": "projetDevisSelectionneDTO",
        "numeroInterne": "internal-example",
        "numeroPartenaire": "partner-reference-example",
        "selectionne": true,
        "formule": "Niveau 200"
      }
    ],
    "assure": {
      "type": "personneMorale",
      "identifiant": 101,
      "adresse": {
        "id": 101,
        "voie": "1 Example Street",
        "complement": "Example Suite",
        "codePostal": "00000",
        "ville": "Example City",
        "cedex": false,
        "pays": "FR:PAYS",
        "paysLibelle": "France",
        "estPrincipal": true,
        "estNPAI": false,
        "complete": "1 Example Street, Example City"
      },
      "clientNumero": "customer-example",
      "statutJuridiqueCode": "10:FORME_JURIDIQUE_TYPE",
      "statutJuridique": "Entrepreneur individuel",
      "raisonSociale": "Example Company",
      "numeroSIREN": "000000000",
      "codeNIC": "00000",
      "numeroSIRET": "00000000000000",
      "creationStructureDate": "2025-01-01T00:00:00.000Z",
      "codeAPE": "01.11Z:CODE_APE",
      "libelleAPE": "Culture de céréales... (01.11Z)",
      "codeSecondAPE": "01.15Z:CODE_APE",
      "libelleSecondAPE": "Culture du tabac (01.15Z)",
      "nbSalaries": 15,
      "contactPrincipal": {
        "type": "interlocuteur",
        "personneId": 101,
        "numeroClient": "customer-example",
        "personne": {
          "type": "personnePhysique",
          "identifiant": 101,
          "nom": "Example",
          "prenom": "Alex",
          "mail": "contact@example.test",
          "mobile": "0600000000",
          "civiliteCode": "MONSIEUR:CIVILITE",
          "civilite": "Monsieur"
        },
        "privilegie": true,
        "principal": true,
        "externe": false,
        "siretEntreprise": "00000000000000",
        "identifiantEntreprise": 101,
        "mandatCode": "GERANT:MANDAT_ENTREPRISE",
        "mandat": "Gérant",
        "salarie": false
      },
      "codeConventionCollective": "1486:CONVENTION_COLLECTIVE_TYPE",
      "libelleConventionCollective": "1486-Convention collective nationale... (BET, SYNTEC)",
      "conventionsCollectives": [
        {
          "code": "1486",
          "libelle": "1486-Convention collective nationale... (BET, SYNTEC)",
          "pourcentage": 100
        }
      ]
    },
    "etat": "MODALITE_SOUSCRIPTION_EN_ATTENTE:ETAT_PROJET",
    "besoin": {
      "type": "COLLECTIVE",
      "numeroProjet": "project-example",
      "description": "Synthetic example description",
      "nomSystemeTiers": "SYSTEME_TIERS:CODE_SYSTEME_TIERS",
      "personnas": [
        "ENTREPRISE"
      ],
      "avecActivite": true,
      "avecMail": true,
      "dispatchFromReseau": false,
      "contratActuel": {
        "type": "projetDevisContratActuelCollectifDTO",
        "produit": {
          "nom": "Example",
          "code": "UKN_SANTE_COLLECTIVE"
        },
        "numeroInterne": "internal-example",
        "numeroPartenaire": "partner-reference-example",
        "selectionne": true,
        "automatique": false,
        "etatCode": "PRET:ETAT_PROJET_DEVIS",
        "assiettesCotisation": [
          {
            "identifiant": 101,
            "typeMontant": "PMSS",
            "typeAssietteCode": "ADULTE_ENFANT:STRUCTURE_COTISATION_SANTE_COLLECTIVE",
            "typeAssiette": "Adulte / Enfant",
            "choisie": true,
            "tarifs": [
              {
                "typeTarifCode": "ADULTE:TYPE_TARIF",
                "typeTarif": "Adulte",
                "priseEnChargeEmployeur": 50,
                "montant": 556.0,
                "montantPMSS": 556.0
              },
              {
                "typeTarifCode": "ENFANT:TYPE_TARIF",
                "typeTarif": "Tarif Enfant",
                "priseEnChargeEmployeur": 50,
                "montant": 126.0,
                "montantPMSS": 126.0
              }
            ]
          }
        ],
        "satisfactionGestion": 3,
        "satisfactionRemboursement": 3,
        "notes": "Synthetic example notes",
        "gestionnaire": "TESSI",
        "gestionnaireCode": "TESSI",
        "partPriseEnChargeEmployeur": 50,
        "surcomplementaire": false,
        "souscriptionDate": "2023-07-20T00:00:00.000+00:00"
      },
      "interlocuteur": {
        "civilite": "MONSIEUR",
        "nom": "Example",
        "prenom": "Alex",
        "fonction": "GERANT:MANDAT_ENTREPRISE",
        "email": "contact@example.test",
        "numeroTelephone": null
      },
      "entreprise": {
        "siret": "00000000000000",
        "raisonSociale": "Example Company",
        "voie": "1 Example Street",
        "complementAdresse": "Example Suite",
        "codePostal": "00000",
        "ville": "Example City",
        "pays": "FR:PAYS",
        "statutJuridique": "10:FORME_JURIDIQUE_TYPE",
        "nombreSalaries": 15,
        "creationDate": "2000-07-20T16:15:24.000+00:00",
        "codeAPE": "01.11Z:CODE_APE",
        "secondCodeAPE": "01.15Z:CODE_APE",
        "effectifCadre": 0,
        "effectifNonCadre": 0,
        "conventionCollective": null
      },
      "collegeType": [
        "CADRES:COLLEGE_TYPE"
      ],
      "structureCotisationCode": "ADULTE_ENFANT:STRUCTURE_COTISATION_SANTE_COLLECTIVE",
      "demographies": [],
      "dateEffetSouhaitee": "2026-07-20T16:15:24.000+00:00"
    },
    "dateEtat": "2025-01-01T00:00:00.000Z",
    "piecesJustificatives": [],
    "rib": null,
    "ribVersement": null,
    "documentsProposition": [
      {
        "id": 101,
        "url": "https://example.test/document",
        "fileUploadedName": "example-document.pdf",
        "categories": [
          "TABLEAU_COMPARATIF"
        ],
        "proprietes": {
          "SELECTIONNE": "true",
          "AUTO_GENERE": "true",
          "PROJET_NUMERO": "project-example"
        },
        "application": "PORTEFEUILLE",
        "extension": "PDF",
        "codeDistributeur": "distributor-example",
        "taille": 160828
      },
      {
        "id": 101,
        "fileUploadedName": "example-document.pdf",
        "categories": [
          "FICHE_INFORMATIONS_LEGALES"
        ],
        "taille": 84021
      },
      {
        "id": 101,
        "fileUploadedName": "example-document.pdf",
        "categories": [
          "RECUEIL_BESOIN"
        ],
        "taille": 198955
      },
      {
        "id": 101,
        "fileUploadedName": "example-document.pdf",
        "categories": [
          "BULLETIN_ADHESION"
        ],
        "taille": 381475
      }
    ],
    "urlSignature": null,
    "beneficiairesFoyer": [],
    "donneesRIA": null,
    "typologieCode": "SANTE_COLLECTIVE:TYPOLOGIE"
  }
} as const;
