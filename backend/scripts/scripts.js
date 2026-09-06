require('dotenv').config();

const mongoose = require('mongoose');

/*
|--------------------------------------------------------------------------
| CHARGEMENT DES MODELES
|--------------------------------------------------------------------------
|
| Le script essaie plusieurs emplacements possibles.
| Tu peux aussi mettre directement ton chemin exact.
|
*/

let Models = null;

const possibleModelPaths = [
    '../models',
    '../models/index',
    '../src/database/models',
    '../models/mongo/index',
    '../models',
    '../models/index'
];

for (const modelPath of possibleModelPaths) {
    try {
        Models = require(modelPath);

        console.log(
            `✅ Modèles chargés depuis : ${modelPath}`
        );

        break;
    } catch (error) {
        // On essaie le chemin suivant.
    }
}

if (!Models) {
    console.error(`
❌ Impossible de charger les modèles Mongoose.

Modifie possibleModelPaths dans scripts/scripts.js
pour indiquer l'emplacement réel de ton fichier models.
`);

    process.exit(1);
}

const {
    Province,
    EducationLevel,
    Establishment,
    Program,
    Subject,
    Contest,
    ContestProgram,
    ProgramSubject,
    DocumentRequirement,
    NotificationTemplate,
    SystemSetting
} = Models;

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME =
    process.env.MONGODB_DB_NAME || 'gabconcours';

if (!MONGODB_URI) {
    console.error(
        '❌ MONGODB_URI absent du fichier .env'
    );

    process.exit(1);
}

/*
|--------------------------------------------------------------------------
| OUTILS
|--------------------------------------------------------------------------
*/

/**
 * Recherche d'abord un document via ses clés naturelles :
 *
 * Province           => name / code
 * EducationLevel     => name / code
 * Establishment      => name / code
 * Program            => name / code
 * Subject            => name / code
 * Contest            => slug
 *
 * Puis fallback sur legacyId.
 *
 * Cela évite les erreurs E11000 lorsqu'Atlas contient
 * déjà les données créées précédemment.
 */
async function upsertLegacy(
    Model,
    legacyId,
    data,
    naturalKeys = []
) {
    let existing = null;

    /*
     * 1. Clés naturelles
     */
    for (const key of naturalKeys) {
        const value = data[key];

        if (
            value === undefined ||
            value === null ||
            value === ''
        ) {
            continue;
        }

        existing = await Model.findOne({
            [key]: value
        });

        if (existing) {
            break;
        }
    }

    /*
     * 2. Ancien identifiant
     */
    if (!existing) {
        existing = await Model.findOne({
            legacyId
        });
    }

    /*
     * 3. Mise à jour
     */
    if (existing) {
        existing.set({
            ...data,
            legacyId
        });

        await existing.save();

        console.log(
            `♻️ ${Model.modelName} : ${
                data.name ||
                data.title ||
                data.code ||
                legacyId
            }`
        );

        return existing;
    }

    /*
     * 4. Création
     */
    const created = await Model.create({
        legacyId,
        ...data
    });

    console.log(
        `➕ ${Model.modelName} : ${
            data.name ||
            data.title ||
            data.code ||
            legacyId
        }`
    );

    return created;
}

/**
 * Recherche par legacyId.
 */
async function findLegacy(
    Model,
    legacyId
) {
    const item = await Model.findOne({
        legacyId
    });

    if (!item) {
        throw new Error(
            `${Model.modelName} legacyId=${legacyId} introuvable`
        );
    }

    return item;
}

/*
|--------------------------------------------------------------------------
| NETTOYAGE DES ANCIENS INDEX
|--------------------------------------------------------------------------
*/

async function cleanOldIndexes() {
    console.log(
        '\n🧹 Nettoyage des anciens index incompatibles...'
    );

    const db =
        mongoose.connection.db;

    const existingCollections =
        await db
            .listCollections()
            .toArray();

    const names =
        new Set(
            existingCollections.map(
                collection => collection.name
            )
        );

    const collectionsToCheck = [
        'provinces',
        'educationlevels',
        'establishments',
        'programs',
        'subjects',
        'contests'
    ];

    for (const collectionName of collectionsToCheck) {
        if (!names.has(collectionName)) {
            continue;
        }

        const collection =
            db.collection(collectionName);

        let indexes = [];

        try {
            indexes =
                await collection.indexes();
        } catch {
            continue;
        }

        for (const index of indexes) {
            /*
             * Index venant d'anciens scripts
             */
            const obsoleteIndexes = [
                'nom_1',
                'libelle_1',
                'niveauId_1',
                'etablissementId_1'
            ];

            if (
                obsoleteIndexes.includes(
                    index.name
                )
            ) {
                console.log(
                    `⚠️ Suppression ${collectionName}.${index.name}`
                );

                try {
                    await collection.dropIndex(
                        index.name
                    );
                } catch {
                    // Ignore
                }

                continue;
            }

            /*
             * Ton modèle Mongoose définit :
             *
             * legacyId:
             * {
             *   type: Number,
             *   sparse: true,
             *   index: true
             * }
             *
             * Donc PAS unique.
             */
            if (
                index.name === 'legacyId_1' &&
                (
                    index.unique === true ||
                    index.sparse !== true
                )
            ) {
                console.log(
                    `⚠️ Correction ${collectionName}.legacyId_1`
                );

                try {
                    await collection.dropIndex(
                        index.name
                    );
                } catch {
                    // Ignore
                }
            }
        }
    }

    console.log(
        '✅ Nettoyage des index terminé'
    );
}

/*
|--------------------------------------------------------------------------
| DIAGNOSTIC
|--------------------------------------------------------------------------
*/

async function diagnoseDatabase() {
    console.log(
        '\n🔎 Etat actuel de la base'
    );

    const diagnostics = {};

    const models = [
        ['Provinces', Province],
        ['Niveaux', EducationLevel],
        ['Etablissements', Establishment],
        ['Filieres', Program],
        ['Matieres', Subject],
        ['Concours', Contest],
        ['DocumentsRequis', DocumentRequirement]
    ];

    for (const [
        label,
        Model
    ] of models) {
        diagnostics[label] =
            await Model.countDocuments();
    }

    console.table(diagnostics);
}

/*
|--------------------------------------------------------------------------
| PROVINCES
|--------------------------------------------------------------------------
*/

async function seedProvinces() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '📍 PROVINCES'
    );

    console.log(
        '=========================================='
    );

    const provinces = [
        {
            legacyId: 1,

            name:
                'Estuaire',

            code:
                'EST',

            cities: [
                'Libreville',
                'Owendo',
                'Akanda',
                'Ntoum',
                'Kango',
                'Cocobeach'
            ],

            active:
                true
        },

        {
            legacyId: 2,

            name:
                'Haut-Ogooué',

            code:
                'HOG',

            cities: [
                'Franceville',
                'Moanda',
                'Mounana',
                'Okondja',
                'Lékoni'
            ],

            active:
                true
        },

        {
            legacyId: 3,

            name:
                'Ogooué-Maritime',

            code:
                'OGM',

            cities: [
                'Port-Gentil',
                'Omboué',
                'Gamba'
            ],

            active:
                true
        },

        {
            legacyId: 4,

            name:
                'Moyen-Ogooué',

            code:
                'MOG',

            cities: [
                'Lambaréné',
                'Ndjolé'
            ],

            active:
                true
        },

        {
            legacyId: 5,

            name:
                'Ngounié',

            code:
                'NGN',

            cities: [
                'Mouila',
                'Fougamou',
                'Ndendé',
                'Mbigou'
            ],

            active:
                true
        },

        {
            legacyId: 6,

            name:
                'Nyanga',

            code:
                'NYG',

            cities: [
                'Tchibanga',
                'Mayumba',
                'Moabi'
            ],

            active:
                true
        },

        {
            legacyId: 7,

            name:
                'Ogooué-Ivindo',

            code:
                'OGI',

            cities: [
                'Makokou',
                'Mékambo',
                'Booué'
            ],

            active:
                true
        },

        {
            legacyId: 8,

            name:
                'Ogooué-Lolo',

            code:
                'OGL',

            cities: [
                'Koulamoutou',
                'Lastoursville'
            ],

            active:
                true
        },

        {
            legacyId: 9,

            name:
                'Woleu-Ntem',

            code:
                'WNT',

            cities: [
                'Oyem',
                'Bitam',
                'Mitzic',
                'Medouneu'
            ],

            active:
                true
        }
    ];

    for (const province of provinces) {
        const {
            legacyId,
            ...data
        } = province;

        await upsertLegacy(
            Province,
            legacyId,
            data,
            [
                'code',
                'name'
            ]
        );
    }

    /*
     * Nettoyage des anciens champs français
     */
    await Province.collection.updateMany(
        {},
        {
            $unset: {
                nom: '',
                chefLieu: '',
                actif: ''
            }
        }
    );

    console.log(
        `✅ ${provinces.length} provinces`
    );
}

/*
|--------------------------------------------------------------------------
| NIVEAUX
|--------------------------------------------------------------------------
*/

async function seedEducationLevels() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '🎓 NIVEAUX'
    );

    console.log(
        '=========================================='
    );

    const levels = [
        {
            legacyId: 1,
            name: 'Licence 1',
            code: 'L1',
            description:
                'Première année du cycle Licence',
            rank: 1,
            active: true
        },

        {
            legacyId: 2,
            name: 'Licence 2',
            code: 'L2',
            description:
                'Deuxième année du cycle Licence',
            rank: 2,
            active: true
        },

        {
            legacyId: 3,
            name: 'Licence 3',
            code: 'L3',
            description:
                'Troisième année du cycle Licence',
            rank: 3,
            active: true
        },

        {
            legacyId: 4,
            name: 'Master 1',
            code: 'M1',
            description:
                'Première année du cycle Master',
            rank: 4,
            active: true
        },

        {
            legacyId: 5,
            name: 'Master 2',
            code: 'M2',
            description:
                'Deuxième année du cycle Master',
            rank: 5,
            active: true
        },

        {
            legacyId: 6,
            name: 'Doctorat',
            code: 'DOC',
            description:
                'Cycle doctoral',
            rank: 6,
            active: true
        },

        {
            legacyId: 7,
            name: 'Terminale C',
            code: 'TC',
            description:
                'Terminale série C',
            rank: 7,
            active: true
        },

        {
            legacyId: 8,
            name: 'Terminale D',
            code: 'TD',
            description:
                'Terminale série D',
            rank: 8,
            active: true
        },

        {
            legacyId: 9,
            name: 'Terminale A',
            code: 'TA',
            description:
                'Terminale série A',
            rank: 9,
            active: true
        },

        {
            legacyId: 10,
            name: 'BTS',
            code: 'BTS',
            description:
                'Brevet de Technicien Supérieur',
            rank: 10,
            active: true
        }
    ];

    for (const level of levels) {
        const {
            legacyId,
            ...data
        } = level;

        await upsertLegacy(
            EducationLevel,
            legacyId,
            data,
            [
                'code',
                'name'
            ]
        );
    }

    console.log(
        `✅ ${levels.length} niveaux`
    );
}

/*
|--------------------------------------------------------------------------
| ETABLISSEMENTS
|--------------------------------------------------------------------------
*/

async function seedEstablishments() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '🏫 ETABLISSEMENTS'
    );

    console.log(
        '=========================================='
    );

    const ESTUAIRE =
        await findLegacy(
            Province,
            1
        );

    const HAUT_OGOOUE =
        await findLegacy(
            Province,
            2
        );

    const OGOOUE_MARITIME =
        await findLegacy(
            Province,
            3
        );

    const establishments = [
        {
            legacyId: 1,

            name:
                'Université Omar Bongo',

            code:
                'UOB',

            address:
                'Libreville, Estuaire, Gabon',

            phone:
                '+241 00 00 00 01',

            email:
                'concours@uob.ga',

            provinceId:
                ESTUAIRE._id,

            active:
                true
        },

        {
            legacyId: 2,

            name:
                'Université des Sciences et Techniques de Masuku',

            code:
                'USTM',

            address:
                'Franceville, Haut-Ogooué, Gabon',

            phone:
                '+241 00 00 00 02',

            email:
                'concours@ustm.ga',

            provinceId:
                HAUT_OGOOUE._id,

            active:
                true
        },

        {
            legacyId: 3,

            name:
                'École Normale Supérieure',

            code:
                'ENS',

            address:
                'Libreville, Estuaire, Gabon',

            phone:
                '+241 00 00 00 03',

            email:
                'concours@ens.ga',

            provinceId:
                ESTUAIRE._id,

            active:
                true
        },

        {
            legacyId: 4,

            name:
                'Institut Supérieur de Technologie',

            code:
                'IST',

            address:
                'Port-Gentil, Ogooué-Maritime, Gabon',

            phone:
                '+241 00 00 00 04',

            email:
                'concours@ist.ga',

            provinceId:
                OGOOUE_MARITIME._id,

            active:
                true
        }
    ];

    for (
        const establishment
        of establishments
    ) {
        const {
            legacyId,
            ...data
        } = establishment;

        await upsertLegacy(
            Establishment,
            legacyId,
            data,
            [
                'code',
                'name'
            ]
        );
    }

    console.log(
        `✅ ${establishments.length} établissements`
    );
}

/*
|--------------------------------------------------------------------------
| FILIERES
|--------------------------------------------------------------------------
*/

async function seedPrograms() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '📚 FILIERES'
    );

    console.log(
        '=========================================='
    );

    const L1 =
        await findLegacy(
            EducationLevel,
            1
        );

    const UOB =
        await findLegacy(
            Establishment,
            1
        );

    const USTM =
        await findLegacy(
            Establishment,
            2
        );

    const ENS =
        await findLegacy(
            Establishment,
            3
        );

    const IST =
        await findLegacy(
            Establishment,
            4
        );

    const programs = [
        {
            legacyId: 1,

            name:
                'Informatique',

            code:
                'INFO',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id,
                USTM._id,
                IST._id
            ]
        },

        {
            legacyId: 2,

            name:
                'Mathématiques',

            code:
                'MATH',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id
            ]
        },

        {
            legacyId: 3,

            name:
                'Physique',

            code:
                'PHYS',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id,
                USTM._id
            ]
        },

        {
            legacyId: 4,

            name:
                'Biologie',

            code:
                'BIO',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id
            ]
        },

        {
            legacyId: 5,

            name:
                'Génie Civil',

            code:
                'GC',

            educationLevelId:
                L1._id,

            establishmentIds: [
                USTM._id,
                IST._id
            ]
        },

        {
            legacyId: 6,

            name:
                'Économie',

            code:
                'ECO',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id,
                IST._id
            ]
        },

        {
            legacyId: 7,

            name:
                'Lettres Modernes',

            code:
                'LM',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id,
                ENS._id
            ]
        },

        {
            legacyId: 8,

            name:
                'Histoire-Géographie',

            code:
                'HG',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id,
                ENS._id
            ]
        },

        {
            legacyId: 9,

            name:
                'Médecine',

            code:
                'MED',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id
            ]
        },

        {
            legacyId: 10,

            name:
                'Droit',

            code:
                'DROIT',

            educationLevelId:
                L1._id,

            establishmentIds: [
                UOB._id
            ]
        }
    ];

    for (const program of programs) {
        const {
            legacyId,
            ...data
        } = program;

        await upsertLegacy(
            Program,
            legacyId,
            data,
            [
                'code',
                'name'
            ]
        );
    }

    console.log(
        `✅ ${programs.length} filières`
    );
}

/*
|--------------------------------------------------------------------------
| MATIERES
|--------------------------------------------------------------------------
*/

async function seedSubjects() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '📖 MATIERES'
    );

    console.log(
        '=========================================='
    );

    const programs = {};

    for (
        let legacyId = 1;
        legacyId <= 10;
        legacyId++
    ) {
        programs[legacyId] =
            await findLegacy(
                Program,
                legacyId
            );
    }

    const subjects = [
        {
            legacyId: 1,

            name:
                'Mathématiques',

            code:
                'MATH',

            coefficient:
                4,

            programIds: [
                programs[1]._id,
                programs[2]._id,
                programs[3]._id,
                programs[4]._id,
                programs[5]._id,
                programs[9]._id
            ]
        },

        {
            legacyId: 2,

            name:
                'Physique',

            code:
                'PHYS',

            coefficient:
                3,

            programIds: [
                programs[1]._id,
                programs[2]._id,
                programs[3]._id,
                programs[5]._id
            ]
        },

        {
            legacyId: 3,

            name:
                'Chimie',

            code:
                'CHIM',

            coefficient:
                2,

            programIds: [
                programs[2]._id,
                programs[3]._id,
                programs[4]._id,
                programs[9]._id
            ]
        },

        {
            legacyId: 4,

            name:
                'Français',

            code:
                'FR',

            coefficient:
                3,

            programIds: [
                programs[1]._id,
                programs[2]._id,
                programs[3]._id,
                programs[4]._id,
                programs[6]._id,
                programs[7]._id,
                programs[8]._id,
                programs[10]._id
            ]
        },

        {
            legacyId: 5,

            name:
                'Anglais',

            code:
                'ANG',

            coefficient:
                2,

            programIds: [
                programs[1]._id,
                programs[5]._id,
                programs[6]._id
            ]
        },

        {
            legacyId: 6,

            name:
                'Histoire',

            code:
                'HIST',

            coefficient:
                2,

            programIds: [
                programs[7]._id,
                programs[8]._id
            ]
        },

        {
            legacyId: 7,

            name:
                'Géographie',

            code:
                'GEO',

            coefficient:
                2,

            programIds: [
                programs[8]._id
            ]
        },

        {
            legacyId: 8,

            name:
                'Biologie',

            code:
                'BIO',

            coefficient:
                3,

            programIds: [
                programs[4]._id,
                programs[9]._id
            ]
        },

        {
            legacyId: 9,

            name:
                'Informatique',

            code:
                'INFO',

            coefficient:
                3,

            programIds: [
                programs[1]._id
            ]
        },

        {
            legacyId: 10,

            name:
                'Économie',

            code:
                'ECO',

            coefficient:
                3,

            programIds: [
                programs[6]._id
            ]
        },

        {
            legacyId: 11,

            name:
                'Philosophie',

            code:
                'PHILO',

            coefficient:
                2,

            programIds: [
                programs[7]._id,
                programs[10]._id
            ]
        },

        {
            legacyId: 12,

            name:
                'Sciences Naturelles',

            code:
                'SN',

            coefficient:
                3,

            programIds: [
                programs[4]._id,
                programs[9]._id
            ]
        }
    ];

    for (const subject of subjects) {
        const {
            legacyId,
            ...data
        } = subject;

        await upsertLegacy(
            Subject,
            legacyId,
            data,
            [
                'code',
                'name'
            ]
        );
    }

    console.log(
        `✅ ${subjects.length} matières`
    );
}

/*
|--------------------------------------------------------------------------
| CONCOURS
|--------------------------------------------------------------------------
*/

async function seedContests() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '🏆 CONCOURS'
    );

    console.log(
        '=========================================='
    );

    const UOB =
        await findLegacy(
            Establishment,
            1
        );

    const USTM =
        await findLegacy(
            Establishment,
            2
        );

    const ENS =
        await findLegacy(
            Establishment,
            3
        );

    const IST =
        await findLegacy(
            Establishment,
            4
        );

    const L1 =
        await findLegacy(
            EducationLevel,
            1
        );

    const M1 =
        await findLegacy(
            EducationLevel,
            4
        );

    const BTS =
        await findLegacy(
            EducationLevel,
            10
        );

    const programs = {};

    for (
        let legacyId = 1;
        legacyId <= 10;
        legacyId++
    ) {
        programs[legacyId] =
            await findLegacy(
                Program,
                legacyId
            );
    }

    /*
     * Données de seed/démonstration.
     * Elles pourront ensuite être modifiées par l'admin.
     */

    const contests = [
        /*
        |--------------------------------------------------------------------------
        | CONCOURS 1 - UOB LICENCE SCIENCES
        |--------------------------------------------------------------------------
        */

        {
            legacyId: 1,

            title:
                "Concours d'entrée en Licence 1 - Sciences",

            slug:
                'uob-licence-1-sciences-2026-2027',

            description:
                "Concours d'admission en première année de Licence dans les filières scientifiques proposées par l'Université Omar Bongo.",

            establishmentId:
                UOB._id,

            educationLevelId:
                L1._id,

            programIds: [
                programs[1]._id,
                programs[2]._id,
                programs[3]._id,
                programs[4]._id
            ],

            opensAt:
                new Date(
                    '2026-08-01T00:00:00.000Z'
                ),

            closesAt:
                new Date(
                    '2026-10-31T23:59:59.999Z'
                ),

            fee:
                50000,

            currency:
                'XAF',

            status:
                'open',

            session:
                '2026-2027',

            contestType:
                'CONCOURS_ENTREE',

            maximumAge:
                25,

            totalPlaces:
                155,

            trainingDuration:
                '3 ans',

            awardedDiploma:
                'Licence',

            resultsPublishedAt:
                new Date(
                    '2026-11-20T10:00:00.000Z'
                ),

            coursesStartAt:
                new Date(
                    '2027-01-11T07:30:00.000Z'
                ),

            acceptedBacSeries: [
                'C',
                'D',
                'E'
            ],

            selectionCriteria: {
                method:
                    'CONCOURS_ECRIT',

                minimumAverage:
                    10,

                eliminatoryScore:
                    5,

                ranking:
                    true,

                criteria: [
                    {
                        name:
                            'Épreuves écrites',

                        weight:
                            80
                    },

                    {
                        name:
                            'Dossier académique',

                        weight:
                            20
                    }
                ]
            },

            registrationSteps: [
                {
                    order: 1,

                    code:
                        'candidate',

                    title:
                        'Informations personnelles',

                    description:
                        "Renseigner l'identité et les coordonnées du candidat."
                },

                {
                    order: 2,

                    code:
                        'program',

                    title:
                        'Choix de la filière',

                    description:
                        'Sélectionner la filière souhaitée.'
                },

                {
                    order: 3,

                    code:
                        'documents',

                    title:
                        'Documents',

                    description:
                        'Téléverser toutes les pièces obligatoires.'
                },

                {
                    order: 4,

                    code:
                        'payment',

                    title:
                        'Paiement',

                    description:
                        'Effectuer le paiement après téléversement de toutes les pièces obligatoires.'
                },

                {
                    order: 5,

                    code:
                        'confirmation',

                    title:
                        'Confirmation',

                    description:
                        'Confirmer définitivement la candidature.'
                }
            ],

            eligibilityConditions: {
                diploma:
                    'Baccalauréat',

                maximumAge:
                    25,

                acceptedBacSeries: [
                    'C',
                    'D',
                    'E'
                ],

                requirements: [
                    'Être titulaire du baccalauréat ou d’un diplôme équivalent.',
                    'Respecter la limite d’âge.',
                    'Téléverser toutes les pièces obligatoires.',
                    'Effectuer le paiement des frais de candidature.'
                ]
            },

            contactEmail:
                'concours@uob.ga',

            contactPhone:
                '+241 00 00 00 01',

            examLocation:
                'Université Omar Bongo - Libreville',

            additionalInformation:
                "Toutes les pièces obligatoires doivent être téléversées avant le paiement. Leur validation administrative préalable n'est pas nécessaire."
        },

        /*
        |--------------------------------------------------------------------------
        | CONCOURS 2 - MASTER INFORMATIQUE
        |--------------------------------------------------------------------------
        */

        {
            legacyId: 2,

            title:
                "Concours d'entrée en Master - Informatique",

            slug:
                'uob-master-informatique-2026-2027',

            description:
                "Sélection pour l'admission en première année de Master Informatique.",

            establishmentId:
                UOB._id,

            educationLevelId:
                M1._id,

            programIds: [
                programs[1]._id
            ],

            opensAt:
                new Date(
                    '2026-08-10T00:00:00.000Z'
                ),

            closesAt:
                new Date(
                    '2026-10-15T23:59:59.999Z'
                ),

            fee:
                75000,

            currency:
                'XAF',

            status:
                'open',

            session:
                '2026-2027',

            contestType:
                'ADMISSION_MASTER',

            maximumAge:
                30,

            totalPlaces:
                25,

            trainingDuration:
                '2 ans',

            awardedDiploma:
                'Master en Informatique',

            resultsPublishedAt:
                new Date(
                    '2026-11-10T10:00:00.000Z'
                ),

            coursesStartAt:
                new Date(
                    '2027-01-11T07:30:00.000Z'
                ),

            acceptedBacSeries:
                [],

            selectionCriteria: {
                method:
                    'DOSSIER_ET_ENTRETIEN',

                minimumLicenceAverage:
                    12,

                ranking:
                    true,

                criteria: [
                    {
                        name:
                            'Résultats académiques',

                        weight:
                            60
                    },

                    {
                        name:
                            'Projet professionnel',

                        weight:
                            20
                    },

                    {
                        name:
                            'Entretien',

                        weight:
                            20
                    }
                ]
            },

            registrationSteps: [
                {
                    order: 1,
                    code: 'candidate',
                    title: 'Informations personnelles'
                },

                {
                    order: 2,
                    code: 'academic',
                    title: 'Parcours académique'
                },

                {
                    order: 3,
                    code: 'documents',
                    title: 'Pièces justificatives'
                },

                {
                    order: 4,
                    code: 'payment',
                    title: 'Paiement'
                },

                {
                    order: 5,
                    code: 'confirmation',
                    title: 'Confirmation'
                }
            ],

            eligibilityConditions: {
                diploma:
                    'Licence',

                field:
                    'Informatique ou discipline équivalente',

                minimumAverage:
                    12,

                maximumAge:
                    30,

                requirements: [
                    'Être titulaire d’une Licence.',
                    'Présenter les relevés de notes du cycle Licence.',
                    'Présenter un CV.',
                    'Présenter une lettre de motivation.',
                    'Soumettre un dossier complet.'
                ]
            },

            contactEmail:
                'master-informatique@uob.ga',

            contactPhone:
                '+241 00 00 00 01',

            examLocation:
                'Université Omar Bongo - Libreville',

            additionalInformation:
                "Le dossier devient accessible aux agents instructeurs après confirmation du paiement."
        },

        /*
        |--------------------------------------------------------------------------
        | CONCOURS 3 - USTM
        |--------------------------------------------------------------------------
        */

        {
            legacyId: 3,

            title:
                'Concours USTM - Formations Techniques',

            slug:
                'ustm-formations-techniques-2026-2027',

            description:
                "Concours d'entrée dans les filières techniques et scientifiques de l'Université des Sciences et Techniques de Masuku.",

            establishmentId:
                USTM._id,

            educationLevelId:
                L1._id,

            programIds: [
                programs[1]._id,
                programs[5]._id,
                programs[9]._id
            ],

            opensAt:
                new Date(
                    '2026-08-05T00:00:00.000Z'
                ),

            closesAt:
                new Date(
                    '2026-10-20T23:59:59.999Z'
                ),

            fee:
                60000,

            currency:
                'XAF',

            status:
                'open',

            session:
                '2026-2027',

            contestType:
                'CONCOURS_TECHNIQUE',

            maximumAge:
                28,

            totalPlaces:
                60,

            trainingDuration:
                '3 à 5 ans selon la formation',

            awardedDiploma:
                'Licence / Diplôme spécialisé',

            resultsPublishedAt:
                new Date(
                    '2026-11-15T10:00:00.000Z'
                ),

            coursesStartAt:
                new Date(
                    '2027-01-11T07:30:00.000Z'
                ),

            acceptedBacSeries: [
                'C',
                'D',
                'E',
                'F'
            ],

            selectionCriteria: {
                method:
                    'CONCOURS',

                minimumAverage:
                    10,

                eliminatoryScore:
                    5,

                ranking:
                    true,

                criteria: [
                    {
                        name:
                            'Épreuves scientifiques',

                        weight:
                            70
                    },

                    {
                        name:
                            'Dossier académique',

                        weight:
                            30
                    }
                ]
            },

            registrationSteps: [
                {
                    order: 1,
                    code: 'candidate',
                    title: 'Identification'
                },

                {
                    order: 2,
                    code: 'program',
                    title: 'Choix de formation'
                },

                {
                    order: 3,
                    code: 'documents',
                    title: 'Documents'
                },

                {
                    order: 4,
                    code: 'payment',
                    title: 'Paiement'
                },

                {
                    order: 5,
                    code: 'confirmation',
                    title: 'Confirmation'
                }
            ],

            eligibilityConditions: {
                diploma:
                    'Baccalauréat',

                maximumAge:
                    28,

                acceptedBacSeries: [
                    'C',
                    'D',
                    'E',
                    'F'
                ],

                requirements: [
                    'Être titulaire du baccalauréat.',
                    'Choisir une formation compatible avec le parcours académique.',
                    'Téléverser toutes les pièces obligatoires.',
                    'Effectuer le paiement.'
                ]
            },

            contactEmail:
                'concours@ustm.ga',

            contactPhone:
                '+241 00 00 00 02',

            examLocation:
                'Campus USTM - Franceville',

            additionalInformation:
                'Les capacités disponibles sont définies par filière.'
        },

        /*
        |--------------------------------------------------------------------------
        | CONCOURS 4 - ENS
        |--------------------------------------------------------------------------
        */

        {
            legacyId: 4,

            title:
                "Concours d'entrée à l'École Normale Supérieure",

            slug:
                'ens-libreville-2026-2027',

            description:
                "Concours d'admission aux formations proposées par l'École Normale Supérieure.",

            establishmentId:
                ENS._id,

            educationLevelId:
                L1._id,

            programIds: [
                programs[7]._id,
                programs[8]._id,
                programs[6]._id
            ],

            opensAt:
                new Date(
                    '2026-08-15T00:00:00.000Z'
                ),

            closesAt:
                new Date(
                    '2026-10-25T23:59:59.999Z'
                ),

            fee:
                45000,

            currency:
                'XAF',

            status:
                'open',

            session:
                '2026-2027',

            contestType:
                'CONCOURS_ENS',

            maximumAge:
                26,

            totalPlaces:
                75,

            trainingDuration:
                '3 ans',

            awardedDiploma:
                'Licence / Diplôme de formation pédagogique',

            resultsPublishedAt:
                new Date(
                    '2026-11-25T10:00:00.000Z'
                ),

            coursesStartAt:
                new Date(
                    '2027-01-11T07:30:00.000Z'
                ),

            acceptedBacSeries: [
                'A',
                'B',
                'C',
                'D'
            ],

            selectionCriteria: {
                method:
                    'CONCOURS_ECRIT',

                minimumAverage:
                    10,

                ranking:
                    true,

                criteria: [
                    {
                        name:
                            'Épreuves écrites',

                        weight:
                            80
                    },

                    {
                        name:
                            'Dossier scolaire',

                        weight:
                            20
                    }
                ]
            },

            registrationSteps: [
                {
                    order: 1,
                    code: 'candidate',
                    title: 'Informations personnelles'
                },

                {
                    order: 2,
                    code: 'program',
                    title: 'Choix de spécialité'
                },

                {
                    order: 3,
                    code: 'documents',
                    title: 'Documents'
                },

                {
                    order: 4,
                    code: 'payment',
                    title: 'Paiement'
                },

                {
                    order: 5,
                    code: 'confirmation',
                    title: 'Confirmation'
                }
            ],

            eligibilityConditions: {
                diploma:
                    'Baccalauréat',

                maximumAge:
                    26,

                acceptedBacSeries: [
                    'A',
                    'B',
                    'C',
                    'D'
                ],

                requirements: [
                    'Être titulaire du baccalauréat.',
                    'Respecter la limite d’âge.',
                    'Soumettre toutes les pièces obligatoires.',
                    'Effectuer le paiement.'
                ]
            },

            contactEmail:
                'concours@ens.ga',

            contactPhone:
                '+241 00 00 00 03',

            examLocation:
                'École Normale Supérieure - Libreville',

            additionalInformation:
                "L'admission finale dépend du traitement du dossier et des résultats du concours."
        },

        /*
        |--------------------------------------------------------------------------
        | CONCOURS 5 - BTS IST
        |--------------------------------------------------------------------------
        */

        {
            legacyId: 5,

            title:
                "Concours d'entrée en BTS - Institut Supérieur de Technologie",

            slug:
                'ist-bts-2026-2027',

            description:
                "Concours d'admission aux formations BTS proposées par l'Institut Supérieur de Technologie.",

            establishmentId:
                IST._id,

            educationLevelId:
                BTS._id,

            programIds: [
                programs[1]._id,
                programs[5]._id,
                programs[6]._id
            ],

            opensAt:
                new Date(
                    '2026-08-01T00:00:00.000Z'
                ),

            closesAt:
                new Date(
                    '2026-10-31T23:59:59.999Z'
                ),

            fee:
                40000,

            currency:
                'XAF',

            status:
                'open',

            session:
                '2026-2027',

            contestType:
                'BTS',

            maximumAge:
                22,

            totalPlaces:
                75,

            trainingDuration:
                '2 ans',

            awardedDiploma:
                'Brevet de Technicien Supérieur',

            resultsPublishedAt:
                new Date(
                    '2026-11-20T10:00:00.000Z'
                ),

            coursesStartAt:
                new Date(
                    '2027-01-11T07:30:00.000Z'
                ),

            acceptedBacSeries: [
                'B',
                'C',
                'D',
                'E',
                'F'
            ],

            selectionCriteria: {
                method:
                    'DOSSIER_ET_CONCOURS',

                minimumAverage:
                    10,

                ranking:
                    true,

                criteria: [
                    {
                        name:
                            'Épreuves',

                        weight:
                            70
                    },

                    {
                        name:
                            'Dossier scolaire',

                        weight:
                            30
                    }
                ]
            },

            registrationSteps: [
                {
                    order: 1,
                    code: 'candidate',
                    title: 'Identification'
                },

                {
                    order: 2,
                    code: 'program',
                    title: 'Choix du BTS'
                },

                {
                    order: 3,
                    code: 'documents',
                    title: 'Pièces justificatives'
                },

                {
                    order: 4,
                    code: 'payment',
                    title: 'Paiement'
                },

                {
                    order: 5,
                    code: 'confirmation',
                    title: 'Confirmation'
                }
            ],

            eligibilityConditions: {
                diploma:
                    'Baccalauréat',

                maximumAge:
                    22,

                acceptedBacSeries: [
                    'B',
                    'C',
                    'D',
                    'E',
                    'F'
                ],

                requirements: [
                    'Être titulaire du baccalauréat.',
                    'Choisir une filière compatible.',
                    'Téléverser toutes les pièces obligatoires.',
                    'Effectuer le paiement des frais.'
                ]
            },

            contactEmail:
                'concours@ist.ga',

            contactPhone:
                '+241 00 00 00 04',

            examLocation:
                'Institut Supérieur de Technologie - Port-Gentil',

            additionalInformation:
                'Une pièce rejetée peut être remplacée sans effectuer un second paiement.'
        }
    ];

    for (const contest of contests) {
        const {
            legacyId,
            ...data
        } = contest;

        await upsertLegacy(
            Contest,
            legacyId,
            data,
            [
                'slug'
            ]
        );
    }

    console.log(
        `✅ ${contests.length} concours`
    );
}

/*
|--------------------------------------------------------------------------
| CONCOURS / FILIERES
|--------------------------------------------------------------------------
*/

async function seedContestPrograms() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '🔗 CONCOURS / FILIERES'
    );

    console.log(
        '=========================================='
    );

    const contests = {};
    const programs = {};
    const establishments = {};
    const levels = {};

    for (
        let legacyId = 1;
        legacyId <= 5;
        legacyId++
    ) {
        contests[legacyId] =
            await findLegacy(
                Contest,
                legacyId
            );
    }

    for (
        let legacyId = 1;
        legacyId <= 10;
        legacyId++
    ) {
        programs[legacyId] =
            await findLegacy(
                Program,
                legacyId
            );
    }

    for (
        let legacyId = 1;
        legacyId <= 4;
        legacyId++
    ) {
        establishments[legacyId] =
            await findLegacy(
                Establishment,
                legacyId
            );
    }

    levels[1] =
        await findLegacy(
            EducationLevel,
            1
        );

    levels[4] =
        await findLegacy(
            EducationLevel,
            4
        );

    levels[10] =
        await findLegacy(
            EducationLevel,
            10
        );

    /*
     * [
     * contest,
     * program,
     * establishment,
     * educationLevel,
     * capacity
     * ]
     */
    const relations = [
        [1, 1, 1, 1, 50],
        [1, 2, 1, 1, 30],
        [1, 3, 1, 1, 40],
        [1, 4, 1, 1, 35],

        [2, 1, 1, 4, 25],

        [3, 1, 2, 1, 20],
        [3, 5, 2, 1, 25],
        [3, 9, 2, 1, 15],

        [4, 7, 3, 1, 30],
        [4, 8, 3, 1, 25],
        [4, 6, 3, 1, 20],

        [5, 1, 4, 10, 30],
        [5, 5, 4, 10, 25],
        [5, 6, 4, 10, 20]
    ];

    for (const relation of relations) {
        const [
            contestLegacyId,
            programLegacyId,
            establishmentLegacyId,
            educationLevelLegacyId,
            capacity
        ] = relation;

        const contest =
            contests[
                contestLegacyId
            ];

        const program =
            programs[
                programLegacyId
            ];

        const establishment =
            establishments[
                establishmentLegacyId
            ];

        const educationLevel =
            levels[
                educationLevelLegacyId
            ];

        await ContestProgram.findOneAndUpdate(
            {
                contestId:
                    contest._id,

                programId:
                    program._id,

                establishmentId:
                    establishment._id
            },

            {
                $set: {
                    contestId:
                        contest._id,

                    programId:
                        program._id,

                    establishmentId:
                        establishment._id,

                    educationLevelId:
                        educationLevel._id,

                    capacity,

                    fee:
                        contest.fee,

                    opensAt:
                        contest.opensAt,

                    closesAt:
                        contest.closesAt,

                    eligibilityRules:
                        contest.eligibilityConditions,

                    active:
                        true
                }
            },

            {
                upsert:
                    true,

                new:
                    true,

                setDefaultsOnInsert:
                    true,

                runValidators:
                    true
            }
        );
    }

    console.log(
        `✅ ${relations.length} associations concours/filières`
    );
}

/*
|--------------------------------------------------------------------------
| FILIERES / MATIERES
|--------------------------------------------------------------------------
*/

async function seedProgramSubjects() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '📝 FILIERES / MATIERES'
    );

    console.log(
        '=========================================='
    );

    const programs = {};
    const subjects = {};

    for (
        let legacyId = 1;
        legacyId <= 10;
        legacyId++
    ) {
        programs[legacyId] =
            await findLegacy(
                Program,
                legacyId
            );
    }

    for (
        let legacyId = 1;
        legacyId <= 12;
        legacyId++
    ) {
        subjects[legacyId] =
            await findLegacy(
                Subject,
                legacyId
            );
    }

    /*
     * [
     * program,
     * subject,
     * coefficient,
     * required,
     * minimumScore
     * ]
     */
    const relations = [
        /*
         * Informatique
         */
        [1, 1, 4, true, 5],
        [1, 2, 3, true, 5],
        [1, 9, 4, true, 5],
        [1, 4, 2, true, 5],
        [1, 5, 2, false, 0],

        /*
         * Mathématiques
         */
        [2, 1, 5, true, 5],
        [2, 2, 4, true, 5],
        [2, 3, 2, false, 0],
        [2, 4, 2, true, 5],

        /*
         * Physique
         */
        [3, 1, 4, true, 5],
        [3, 2, 5, true, 5],
        [3, 3, 3, true, 5],
        [3, 4, 2, true, 5],

        /*
         * Biologie
         */
        [4, 1, 3, true, 5],
        [4, 3, 3, true, 5],
        [4, 8, 4, true, 5],
        [4, 12, 3, true, 5],
        [4, 4, 2, true, 5],

        /*
         * Génie Civil
         */
        [5, 1, 5, true, 5],
        [5, 2, 4, true, 5],
        [5, 5, 2, true, 5],

        /*
         * Économie
         */
        [6, 10, 4, true, 5],
        [6, 1, 2, true, 5],
        [6, 4, 2, true, 5],
        [6, 5, 2, false, 0],

        /*
         * Lettres Modernes
         */
        [7, 4, 4, true, 5],
        [7, 6, 3, true, 5],
        [7, 11, 3, true, 5],

        /*
         * Histoire Géographie
         */
        [8, 6, 4, true, 5],
        [8, 7, 4, true, 5],
        [8, 4, 2, true, 5],

        /*
         * Médecine
         */
        [9, 8, 5, true, 5],
        [9, 3, 4, true, 5],
        [9, 1, 3, true, 5],

        /*
         * Droit
         */
        [10, 4, 4, true, 5],
        [10, 11, 3, true, 5],
        [10, 6, 2, true, 5]
    ];

    for (const relation of relations) {
        const [
            programLegacyId,
            subjectLegacyId,
            coefficient,
            required,
            minimumScore
        ] = relation;

        const program =
            programs[
                programLegacyId
            ];

        const subject =
            subjects[
                subjectLegacyId
            ];

        await ProgramSubject.findOneAndUpdate(
            {
                programId:
                    program._id,

                subjectId:
                    subject._id,

                contestId:
                    null
            },

            {
                $set: {
                    programId:
                        program._id,

                    subjectId:
                        subject._id,

                    contestId:
                        null,

                    coefficient,

                    required,

                    minimumScore
                }
            },

            {
                upsert:
                    true,

                new:
                    true,

                setDefaultsOnInsert:
                    true,

                runValidators:
                    true
            }
        );
    }

    console.log(
        `✅ ${relations.length} associations filières/matières`
    );
}

/*
|--------------------------------------------------------------------------
| DOCUMENTS REQUIS
|--------------------------------------------------------------------------
*/

async function seedDocumentRequirements() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '📎 DOCUMENTS REQUIS'
    );

    console.log(
        '=========================================='
    );

    const contests = {};

    for (
        let legacyId = 1;
        legacyId <= 5;
        legacyId++
    ) {
        contests[legacyId] =
            await findLegacy(
                Contest,
                legacyId
            );
    }

    const MB =
        1024 * 1024;

    /*
     * Documents généraux
     */
    const undergraduateDocuments = [
        {
            code:
                'ACTE_NAISSANCE',

            name:
                'Acte de naissance',

            description:
                "Copie lisible de l'acte de naissance du candidat.",

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'PIECE_IDENTITE',

            name:
                "Pièce d'identité",

            description:
                "Carte nationale d'identité, passeport ou pièce officielle acceptée.",

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'PHOTO_IDENTITE',

            name:
                "Photo d'identité",

            description:
                "Photo d'identité récente, nette et de face.",

            required:
                true,

            acceptedMimeTypes: [
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                3 * MB
        },

        {
            code:
                'DIPLOME_BAC',

            name:
                'Diplôme ou attestation du baccalauréat',

            description:
                'Copie du diplôme ou de l’attestation de réussite au baccalauréat.',

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'RELEVE_BAC',

            name:
                'Relevé de notes du baccalauréat',

            description:
                'Relevé officiel des notes obtenues au baccalauréat.',

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'CERTIFICAT_SCOLARITE',

            name:
                'Certificat de scolarité',

            description:
                'Certificat de scolarité récent si applicable.',

            required:
                false,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'CERTIFICAT_MEDICAL',

            name:
                'Certificat médical',

            description:
                'Certificat médical si exigé pour la formation.',

            required:
                false,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        }
    ];

    /*
     * Licence / USTM / ENS / BTS
     */
    for (
        const contestLegacyId
        of [1, 3, 4, 5]
    ) {
        const contest =
            contests[
                contestLegacyId
            ];

        for (
            const document
            of undergraduateDocuments
        ) {
            await DocumentRequirement.findOneAndUpdate(
                {
                    contestId:
                        contest._id,

                    programId:
                        null,

                    code:
                        document.code
                },

                {
                    $set: {
                        contestId:
                            contest._id,

                        programId:
                            null,

                        ...document,

                        exampleStorageKey:
                            `examples/${contest.slug}/${document.code.toLowerCase()}`,

                        active:
                            true
                    }
                },

                {
                    upsert:
                        true,

                    new:
                        true,

                    setDefaultsOnInsert:
                        true,

                    runValidators:
                        true
                }
            );
        }
    }

    /*
     * Master Informatique
     */
    const masterDocuments = [
        {
            code:
                'ACTE_NAISSANCE',

            name:
                'Acte de naissance',

            description:
                "Copie lisible de l'acte de naissance.",

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'PIECE_IDENTITE',

            name:
                "Pièce d'identité",

            description:
                "Pièce officielle d'identité valide.",

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'PHOTO_IDENTITE',

            name:
                "Photo d'identité",

            description:
                "Photo récente du candidat.",

            required:
                true,

            acceptedMimeTypes: [
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                3 * MB
        },

        {
            code:
                'DIPLOME_LICENCE',

            name:
                'Diplôme de Licence',

            description:
                'Diplôme de Licence ou attestation officielle de réussite.',

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'RELEVES_LICENCE',

            name:
                'Relevés de notes de Licence',

            description:
                'Relevés de notes du parcours universitaire en Licence.',

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf'
            ],

            maxSizeBytes:
                10 * MB
        },

        {
            code:
                'CV',

            name:
                'Curriculum Vitae',

            description:
                'CV actualisé du candidat.',

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'LETTRE_MOTIVATION',

            name:
                'Lettre de motivation',

            description:
                'Lettre présentant les motivations et le projet académique du candidat.',

            required:
                true,

            acceptedMimeTypes: [
                'application/pdf'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'ATTESTATION_STAGE',

            name:
                'Attestation de stage',

            description:
                'Attestation de stage ou d’expérience professionnelle, si disponible.',

            required:
                false,

            acceptedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            maxSizeBytes:
                5 * MB
        },

        {
            code:
                'DIPLOMES_COMPLEMENTAIRES',

            name:
                'Diplômes ou certifications complémentaires',

            description:
                'Diplômes, certifications ou attestations complémentaires.',

            required:
                false,

            acceptedMimeTypes: [
                'application/pdf'
            ],

            maxSizeBytes:
                10 * MB
        }
    ];

    const masterContest =
        contests[2];

    for (
        const document
        of masterDocuments
    ) {
        await DocumentRequirement.findOneAndUpdate(
            {
                contestId:
                    masterContest._id,

                programId:
                    null,

                code:
                    document.code
            },

            {
                $set: {
                    contestId:
                        masterContest._id,

                    programId:
                        null,

                    ...document,

                    exampleStorageKey:
                        `examples/${masterContest.slug}/${document.code.toLowerCase()}`,

                    active:
                        true
                }
            },

            {
                upsert:
                    true,

                new:
                    true,

                setDefaultsOnInsert:
                    true,

                runValidators:
                    true
            }
        );
    }

    /*
     * Exemple de document spécifique à Médecine / USTM.
     *
     * Ton modèle permet programId en plus de contestId.
     */
    const medecine =
        await findLegacy(
            Program,
            9
        );

    await DocumentRequirement.findOneAndUpdate(
        {
            contestId:
                contests[3]._id,

            programId:
                medecine._id,

            code:
                'CERTIFICAT_MEDICAL'
        },

        {
            $set: {
                contestId:
                    contests[3]._id,

                programId:
                    medecine._id,

                code:
                    'CERTIFICAT_MEDICAL',

                name:
                    'Certificat médical',

                description:
                    "Certificat médical d'aptitude requis pour cette filière.",

                required:
                    true,

                acceptedMimeTypes: [
                    'application/pdf',
                    'image/jpeg',
                    'image/png'
                ],

                maxSizeBytes:
                    5 * MB,

                exampleStorageKey:
                    'examples/ustm/medecine/certificat-medical',

                active:
                    true
            }
        },

        {
            upsert:
                true,

            new:
                true,

            setDefaultsOnInsert:
                true,

            runValidators:
                true
        }
    );

    console.log(
        `✅ ${
            await DocumentRequirement.countDocuments()
        } exigences documentaires`
    );
}

/*
|--------------------------------------------------------------------------
| NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function seedNotificationTemplates() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '🔔 NOTIFICATIONS'
    );

    console.log(
        '=========================================='
    );

    const templates = [
        {
            code:
                'APPLICATION_CREATED',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Candidature créée',

            body:
                'Votre candidature {{nupcan}} a été créée avec succès.',

            variables: [
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'DOCUMENTS_MISSING',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Documents manquants',

            body:
                'Votre dossier comporte encore {{count}} document(s) obligatoire(s) manquant(s).',

            variables: [
                'count'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'DOCUMENTS_COMPLETE',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Dossier documentaire complet',

            body:
                'Toutes les pièces obligatoires ont été téléversées. Vous pouvez procéder au paiement.',

            variables:
                [],

            version:
                1,

            active:
                true
        },

        {
            code:
                'DOCUMENT_REJECTED',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Document rejeté',

            body:
                'Le document {{documentName}} a été rejeté. Motif : {{reason}}. Vous pouvez le remplacer sans effectuer un nouveau paiement.',

            variables: [
                'documentName',
                'reason'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'PAYMENT_PENDING',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Paiement en attente',

            body:
                'Votre paiement pour la candidature {{nupcan}} est en cours de traitement.',

            variables: [
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'PAYMENT_CONFIRMED',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Paiement confirmé',

            body:
                'Votre paiement pour la candidature {{nupcan}} a été confirmé. Votre dossier est désormais transmis pour traitement.',

            variables: [
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'PAYMENT_CONFIRMED',

            channel:
                'email',

            locale:
                'fr-GA',

            subject:
                'Confirmation de paiement - GabConcours',

            body:
                'Bonjour {{firstName}}, votre paiement pour la candidature {{nupcan}} a été confirmé avec succès.',

            variables: [
                'firstName',
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'APPLICATION_SUBMITTED',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Dossier transmis',

            body:
                'Votre dossier {{nupcan}} a été transmis aux services compétents pour traitement.',

            variables: [
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'APPLICATION_UNDER_REVIEW',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Dossier en cours de traitement',

            body:
                'Votre candidature {{nupcan}} est en cours d’examen par un agent.',

            variables: [
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'APPLICATION_APPROVED',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Candidature validée',

            body:
                'Votre candidature {{nupcan}} a été validée.',

            variables: [
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'APPLICATION_APPROVED',

            channel:
                'email',

            locale:
                'fr-GA',

            subject:
                'Validation de votre candidature GabConcours',

            body:
                'Bonjour {{firstName}}, votre candidature {{nupcan}} a été validée.',

            variables: [
                'firstName',
                'nupcan'
            ],

            version:
                1,

            active:
                true
        },

        {
            code:
                'APPLICATION_REJECTED',

            channel:
                'in_app',

            locale:
                'fr-GA',

            subject:
                'Décision concernant votre candidature',

            body:
                'Votre candidature {{nupcan}} n’a pas été retenue. Motif : {{reason}}.',

            variables: [
                'nupcan',
                'reason'
            ],

            version:
                1,

            active:
                true
        }
    ];

    for (const template of templates) {
        await NotificationTemplate.findOneAndUpdate(
            {
                code:
                    template.code,

                channel:
                    template.channel,

                locale:
                    template.locale,

                version:
                    template.version
            },

            {
                $set:
                    template
            },

            {
                upsert:
                    true,

                new:
                    true,

                setDefaultsOnInsert:
                    true,

                runValidators:
                    true
            }
        );
    }

    console.log(
        `✅ ${templates.length} templates`
    );
}

/*
|--------------------------------------------------------------------------
| PARAMETRES SYSTEME
|--------------------------------------------------------------------------
*/

async function seedSystemSettings() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '⚙️ PARAMETRES SYSTEME'
    );

    console.log(
        '=========================================='
    );

    const settings = [
        {
            key:
                'PLATFORM_NAME',

            value:
                'GabConcours',

            description:
                'Nom public de la plateforme',

            sensitive:
                false
        },

        {
            key:
                'APPLICATION_PREFIX',

            value:
                'GC',

            description:
                'Préfixe utilisé pour générer les numéros de candidature',

            sensitive:
                false
        },

        {
            key:
                'ACTIVE_SESSION',

            value:
                '2026-2027',

            description:
                'Session académique active',

            sensitive:
                false
        },

        {
            key:
                'DEFAULT_CURRENCY',

            value:
                'XAF',

            description:
                'Devise par défaut',

            sensitive:
                false
        },

        {
            key:
                'DOCUMENT_MAX_SIZE_BYTES',

            value:
                5242880,

            description:
                'Taille maximale standard des documents : 5 Mo',

            sensitive:
                false
        },

        {
            key:
                'ALLOWED_DOCUMENT_MIME_TYPES',

            value: [
                'application/pdf',
                'image/jpeg',
                'image/png'
            ],

            description:
                'Formats autorisés par défaut',

            sensitive:
                false
        },

        /*
         * WORKFLOW GABCONCOURS V2
         */

        {
            key:
                'PAYMENT_REQUIRES_ALL_DOCUMENTS',

            value:
                true,

            description:
                'Toutes les pièces obligatoires doivent être téléversées avant paiement',

            sensitive:
                false
        },

        {
            key:
                'PAYMENT_REQUIRES_DOCUMENT_ADMIN_APPROVAL',

            value:
                false,

            description:
                'La validation administrative préalable des documents n’est pas requise avant paiement',

            sensitive:
                false
        },

        {
            key:
                'DOCUMENT_TECHNICAL_VALIDATION_REQUIRED',

            value:
                true,

            description:
                'Les fichiers doivent respecter format, taille et contrôles techniques avant acceptation du téléversement',

            sensitive:
                false
        },

        {
            key:
                'APPLICATION_VISIBLE_AFTER_PAYMENT',

            value:
                true,

            description:
                'Une candidature devient visible aux agents après confirmation du paiement',

            sensitive:
                false
        },

        {
            key:
                'REUSE_EXISTING_PAYMENT',

            value:
                true,

            description:
                'Un paiement existant doit être réutilisé pour éviter les doubles paiements',

            sensitive:
                false
        },

        {
            key:
                'ALLOW_DOCUMENT_REPLACEMENT_AFTER_PAYMENT',

            value:
                true,

            description:
                'Une pièce rejetée peut être remplacée après paiement',

            sensitive:
                false
        },

        {
            key:
                'DOCUMENT_REPLACEMENT_REQUIRES_NEW_PAYMENT',

            value:
                false,

            description:
                'Le remplacement d’un document rejeté ne nécessite aucun nouveau paiement',

            sensitive:
                false
        },

        {
            key:
                'NOTIFY_ON_MISSING_DOCUMENTS',

            value:
                true,

            description:
                'Créer une notification lorsque des documents obligatoires sont manquants',

            sensitive:
                false
        },

        {
            key:
                'NOTIFY_ON_DOCUMENT_REJECTION',

            value:
                true,

            description:
                'Notifier le candidat lorsqu’un document est rejeté',

            sensitive:
                false
        },

        {
            key:
                'NOTIFY_ON_PAYMENT_CONFIRMATION',

            value:
                true,

            description:
                'Notifier le candidat lorsque son paiement est confirmé',

            sensitive:
                false
        },

        {
            key:
                'NOTIFY_ON_FINAL_DECISION',

            value:
                true,

            description:
                'Notifier le candidat à la validation ou au rejet final',

            sensitive:
                false
        },

        {
            key:
                'SEND_EMAIL_ON_FINAL_APPROVAL',

            value:
                true,

            description:
                'Envoyer un email lors de la validation finale',

            sensitive:
                false
        },

        {
            key:
                'SUPPORT_EMAIL',

            value:
                'support@gabconcours.ga',

            description:
                'Adresse email du support',

            sensitive:
                false
        },

        {
            key:
                'SUPPORT_PHONE',

            value:
                '+241 00 00 00 00',

            description:
                'Numéro du support',

            sensitive:
                false
        }
    ];

    for (const setting of settings) {
        await SystemSetting.findOneAndUpdate(
            {
                key:
                    setting.key
            },

            {
                $set:
                    setting
            },

            {
                upsert:
                    true,

                new:
                    true,

                setDefaultsOnInsert:
                    true,

                runValidators:
                    true
            }
        );
    }

    console.log(
        `✅ ${settings.length} paramètres`
    );
}

/*
|--------------------------------------------------------------------------
| SYNCHRONISATION DES INDEX
|--------------------------------------------------------------------------
*/

async function syncIndexes() {
    console.log(
        '\n=========================================='
    );

    console.log(
        '🗂️ INDEX MONGODB'
    );

    console.log(
        '=========================================='
    );

    const models = [
        Province,
        EducationLevel,
        Establishment,
        Program,
        Subject,
        Contest,
        ContestProgram,
        ProgramSubject,
        DocumentRequirement,
        NotificationTemplate,
        SystemSetting
    ];

    for (const Model of models) {
        try {
            await Model.syncIndexes();

            console.log(
                `✅ ${Model.modelName}`
            );
        } catch (error) {
            /*
             * On affiche l'erreur mais on ne bloque pas
             * tout le seed.
             */
            console.warn(
                `⚠️ Index ${Model.modelName}: ${error.message}`
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| STATISTIQUES
|--------------------------------------------------------------------------
*/

async function printStats() {
    console.log(`
==================================================
            📊 GABCONCOURS V2
==================================================
`);

    const stats = {
        Provinces:
            await Province.countDocuments(),

        Niveaux:
            await EducationLevel.countDocuments(),

        Etablissements:
            await Establishment.countDocuments(),

        Filieres:
            await Program.countDocuments(),

        Matieres:
            await Subject.countDocuments(),

        Concours:
            await Contest.countDocuments(),

        ConcoursFilieres:
            await ContestProgram.countDocuments(),

        FilieresMatieres:
            await ProgramSubject.countDocuments(),

        DocumentsRequis:
            await DocumentRequirement.countDocuments(),

        NotificationTemplates:
            await NotificationTemplate.countDocuments(),

        Parametres:
            await SystemSetting.countDocuments()
    };

    console.table(stats);

    /*
     * CONCOURS
     */

    console.log(
        '\n🏆 CONCOURS DISPONIBLES\n'
    );

    const contests =
        await Contest
            .find({})
            .populate(
                'establishmentId',
                'name code'
            )
            .populate(
                'educationLevelId',
                'name code'
            )
            .populate(
                'programIds',
                'name code'
            )
            .sort({
                legacyId: 1
            })
            .lean();

    console.table(
        contests.map(
            contest => ({
                ID:
                    contest.legacyId,

                Concours:
                    contest.title,

                Etablissement:
                    contest
                        .establishmentId
                        ?.name,

                Niveau:
                    contest
                        .educationLevelId
                        ?.name,

                Filieres:
                    contest.programIds
                        ?.map(
                            program =>
                                program.name
                        )
                        .join(', '),

                Frais:
                    `${contest.fee} XAF`,

                Places:
                    contest.totalPlaces,

                Statut:
                    contest.status,

                Session:
                    contest.session
            })
        )
    );

    /*
     * DOCUMENTS
     */

    console.log(
        '\n📎 DOCUMENTS PAR CONCOURS\n'
    );

    for (const contest of contests) {
        const documents =
            await DocumentRequirement
                .find({
                    contestId:
                        contest._id,

                    active:
                        true
                })
                .populate(
                    'programId',
                    'name code'
                )
                .sort({
                    required: -1,
                    code: 1
                })
                .lean();

        console.log(
            `\n➡️ ${contest.title}`
        );

        console.table(
            documents.map(
                document => ({
                    Code:
                        document.code,

                    Document:
                        document.name,

                    Filiere:
                        document.programId
                            ?.name ||
                        'Toutes',

                    Obligatoire:
                        document.required
                            ? 'OUI'
                            : 'NON',

                    TailleMax:
                        `${Math.round(
                            document.maxSizeBytes /
                            1024 /
                            1024
                        )} Mo`
                })
            )
        );
    }
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function seed() {
    try {
        console.log(`
==================================================
       🚀 INITIALISATION GABCONCOURS V2
==================================================
`);

        console.log(
            '⏳ Connexion à MongoDB Atlas...'
        );

        /*
         * autoIndex false :
         * on traite d'abord les anciennes données
         * avant la synchronisation des index.
         */
        await mongoose.connect(
            MONGODB_URI,
            {
                dbName:
                    DB_NAME,

                autoIndex:
                    false
            }
        );

        console.log(
            `✅ Connecté à la base : ${DB_NAME}`
        );

        /*
         * Etat initial
         */
        await diagnoseDatabase();

        /*
         * Nettoyage
         */
        await cleanOldIndexes();

        /*
         * Référentiels
         */
        await seedProvinces();

        await seedEducationLevels();

        await seedEstablishments();

        await seedPrograms();

        await seedSubjects();

        /*
         * Concours
         */
        await seedContests();

        /*
         * Relations
         */
        await seedContestPrograms();

        await seedProgramSubjects();

        /*
         * Documents demandés aux candidats
         */
        await seedDocumentRequirements();

        /*
         * Notifications
         */
        await seedNotificationTemplates();

        /*
         * Paramètres métier
         */
        await seedSystemSettings();

        /*
         * Index après correction des données
         */
        await syncIndexes();

        /*
         * Résultat
         */
        await printStats();

        console.log(`
==================================================
   🎉 GABCONCOURS V2 INITIALISÉ AVEC SUCCÈS
==================================================
`);

    } catch (error) {
        console.error(`
==================================================
❌ ERREUR INITIALISATION
==================================================
`);

        console.error(error);

        if (
            error.code === 11000
        ) {
            console.error(
                '\n⚠️ Doublon MongoDB détecté'
            );

            console.error(
                'Index :',
                error.keyPattern
            );

            console.error(
                'Valeur :',
                error.keyValue
            );

            console.error(`
Le script tente déjà de récupérer les données par
name / code / slug avant legacyId.

Si cette erreur apparaît encore, cela veut dire
qu'Atlas contient probablement DEUX anciens documents
différents utilisant deux clés uniques différentes.

Envoie-moi simplement cette nouvelle erreur E11000.
`);
        }

        process.exitCode = 1;

    } finally {
        try {
            await mongoose.disconnect();

            console.log(
                '\n🔌 Connexion MongoDB fermée'
            );
        } catch {
            // Ignore
        }
    }
}

/*
|--------------------------------------------------------------------------
| EXECUTION
|--------------------------------------------------------------------------
*/

seed();