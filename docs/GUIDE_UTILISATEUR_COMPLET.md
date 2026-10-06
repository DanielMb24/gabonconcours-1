# Guide utilisateur complet — GabConcours

> Plateforme de gestion des candidatures aux concours.
> Ce guide couvre l'ensemble de l'utilisation : espace **candidat** et espace **administration**.
> Complément technique du fichier `GUIDE_UTILISATEUR.md` (centré sur les documents et l'IA).

---

## Sommaire

1. [Présentation et rôles](#1-présentation-et-rôles)
2. [Glossaire : NIPCAN, NUPCAN et statuts](#2-glossaire--nipcan-nupcan-et-statuts)
3. [Prérequis](#3-prérequis)
4. [Espace candidat — le compte](#4-espace-candidat--le-compte)
5. [Espace candidat — candidater à un concours](#5-espace-candidat--candidater-à-un-concours)
6. [Espace candidat — tableau de bord](#6-espace-candidat--tableau-de-bord)
7. [Espace candidat — documents](#7-espace-candidat--documents)
8. [Espace candidat — paiement](#8-espace-candidat--paiement)
9. [Espace candidat — résultats, reçus, messages](#9-espace-candidat--résultats-reçus-messages)
10. [Espace administration — connexion et rôles](#10-espace-administration--connexion-et-rôles)
11. [Espace administration — guide par rubrique](#11-espace-administration--guide-par-rubrique)
12. [Validation des documents (procédure admin)](#12-validation-des-documents-procédure-admin)
13. [FAQ et dépannage](#13-faq-et-dépannage)
14. [Sécurité et confidentialité](#14-sécurité-et-confidentialité)

---

## 1. Présentation et rôles

GabConcours permet de gérer une candidature à un concours **entièrement en ligne** :

1. créer un compte candidat (ou activer son NIPCAN existant) ;
2. choisir un concours et une filière ;
3. saisir ses informations personnelles avec photo d'identité ;
4. recevoir son numéro de candidature (**NUPCAN**) ;
5. téléverser les documents demandés ;
6. suivre la validation de chaque document ;
7. payer les frais d'inscription ;
8. télécharger ses reçus et suivre ses résultats.

### Les rôles

| Rôle | Ce qu'il peut faire |
|---|---|
| **Candidat** | Créer et suivre ses candidatures, déposer ses documents, payer, échanger avec l'administration. |
| **Administrateur d'établissement** | Consulter les dossiers de son établissement, valider ou rejeter les documents, saisir les notes, gérer la messagerie. |
| **Sous-administrateur** | Périmètre limité : soit les **notes**, soit les **documents** (3 maximum par établissement). |
| **Finances (paiements)** | Consulter les paiements uniquement. |
| **Super administrateur** | Tout superviser : concours, établissements, comptes admin, statistiques, journaux, configuration IA. |

---

## 2. Glossaire : NIPCAN, NUPCAN et statuts

| Terme | Signification | Exemple |
|---|---|---|
| **NIPCAN** | Identifiant **personnel et permanent** du candidat (une personne = un NIPCAN). Il conserve vos informations d'une candidature à l'autre. | `NIP2026000007` |
| **NUPCAN** | Numéro **d'une candidature** (un NUPCAN par concours présenté). C'est votre référence de suivi. | Reçu par email après inscription |
| **Concours** | Examen ou recrutement organisé par un établissement (ex. session, places, frais, âge maximum). | — |
| **Filière** | Parcours d'études proposé dans le cadre d'un concours, avec ses matières et coefficients. | — |

### Statuts d'une candidature

| Statut | Signification |
|---|---|
| `brouillon` | Inscription commencée, non envoyée. |
| `en_attente` / `en_cours` | Dossier en cours de traitement. |
| `valide` | Candidature acceptée. |
| `rejete` | Candidature refusée. |
| `annule` | Candidature annulée. |

### Statuts d'un document

| Statut affiché | Signification | Action attendue |
|---|---|---|
| `en_attente` | Déposé, en attente de décision (ou d'analyse IA). | Patienter. |
| `valide` | Accepté par l'administration. | Rien à faire. Ne peut plus être supprimé. |
| `rejete` | Refusé, avec un motif. | Lire le motif et **remplacer** le document. |

---

## 3. Prérequis

### Pour candidater

- Un **navigateur récent** (Chrome, Edge, Firefox, Safari) avec JavaScript activé.
- Une **adresse email valide** (elle reçoit le code de vérification, le NUPCAN et les reçus).
- Un **numéro de téléphone** (8 à 15 chiffres, avec indicatif, ex. `+24177123456`).
- Une **photo d'identité numérique** : image JPEG/PNG, 5 Mo maximum, visage centré (fond blanc recommandé).
- Vos **documents numériques** : PDF, JPEG, PNG ou WebP, 10 Mo maximum par fichier.
- De quoi **payer en Mobile Money** (Airtel Money, Moov Money, selon le concours) si le concours est payant.

### Règles du formulaire d'inscription

- Nom, prénom, email, téléphone, date et lieu de naissance : **obligatoires**.
- Province d'origine : **obligatoire** ; provinces actuelle et d'affectation : sinon, la province d'origine est reprise.
- **Âge** : 16 ans minimum ; limite maximum fixée par chaque concours (affichée sur la fiche). Au-delà, l'inscription est bloquée.
- Email : format valide obligatoire (le reçu et les identifiants y sont envoyés).

---

## 4. Espace candidat — le compte

Page : **Connexion** (`/connexion`). Un seul compte pour tous vos concours.

### 4.1 Créer un compte / activer mon NIPCAN / mot de passe oublié

C'est le **même formulaire** qui sert aux trois cas :

1. Cliquer sur **« Créer un compte / activer mon NIPCAN / mot de passe oublié »**.
2. Saisir : prénom, nom, **adresse email**, téléphone (avec indicatif), nom d'utilisateur, et — si vous en avez déjà un — votre **NIPCAN existant** (facultatif).
3. Mot de passe : **10 caractères minimum**.
4. Cliquer sur **« Recevoir le code par email »**.
5. Saisir le **code à 6 chiffres** reçu (valable **10 minutes**, 5 essais maximum).
6. Cliquer sur **« Vérifier et ouvrir mon compte »** : vous êtes connecté et redirigé vers votre tableau de bord.

> **Déjà candidat sans compte ?** Activez votre compte avec **l'adresse email utilisée lors de votre candidature** (et votre NIPCAN si vous l'avez) : vos informations, votre photo et vos dossiers existants sont conservés. La même procédure sert à **récupérer l'accès** en cas de mot de passe oublié (elle réinitialise le mot de passe après vérification de l'email).

Contraintes des identifiants :
- Nom d'utilisateur : 3 à 40 caractères, commence par une lettre (lettres, chiffres, `_`, `.`, `-`).
- Téléphone : 8 à 15 chiffres.
- L'email, le téléphone et le nom d'utilisateur doivent être **uniques** sur la plateforme.

### 4.1bis Compte créé automatiquement à la première candidature

Si vous candidatez **sans compte**, un compte est créé automatiquement avec votre candidature. La page de confirmation affiche alors un encadré bleu :

- **Nom d'utilisateur** : dérivé de votre NIPCAN en minuscules (ex. NIPCAN `NIP2026000001` → utilisateur `nip2026000001`). Il sert d'identifiant de connexion (au même titre que l'email ou le téléphone) et il est **non modifiable**, comme le NIPCAN.
- **Mot de passe temporaire** : à conserver (envoyé aussi par email si possible). C'est **la seule chose modifiable** : espace candidat → **Paramètres** → **« Modifier mon mot de passe »** (mot de passe actuel exigé, nouveau ≥ 10 caractères, différent de l'actuel ; les autres sessions sont alors déconnectées).
- Bouton **« J'ai conservé mes identifiants »** : masque l'encadré (les identifiants restent valables).

Rappel des identifiants : **NIPCAN** = la personne (immuable) ; **nom d'utilisateur** = la connexion (dérivé du NIPCAN, immuable) ; **NUPCAN** = une participation à un concours ; **mot de passe** = le seul élément modifiable.

### 4.2 Se connecter

1. Saisir votre **email, téléphone ou nom d'utilisateur** + mot de passe.
2. Cliquer sur **« Se connecter »** : vous arrivez sur votre tableau de bord (`/dashboard/VOTRE-NIPCAN`).

### 4.3 Session et déconnexion

- La session dure **24 heures**. Passé ce délai (ou après déconnexion), reconnectez-vous.
- Si une page affiche **« Session requise »** ou **« Accès refusé »**, retournez à la page Connexion.
- Sur un appareil partagé, utilisez toujours le bouton **Se déconnecter**.
- Message « **Votre session a expiré** » après une recherche NIP : reconnectez-vous ou continuez la saisie manuellement, sans recommencer tout le formulaire.

---

## 5. Espace candidat — candidater à un concours

### Étape 1 — Choisir le concours (`/concours`)

1. Parcourir la liste (possibilité de filtrer par filière).
2. Vérifier sur la fiche : établissement, session, **frais**, **âge maximum**, places, dates d'ouverture/clôture.
3. Cliquer sur le concours pour voir le détail (`/concours/:id`), puis **Candidater**.

### Étape 2 — Choisir la filière (`/candidature/:concoursId`)

1. Sélectionner une filière (bouton radio) : nom, description, places disponibles.
2. Continuer. Si vous n'êtes pas connecté, la plateforme vous demande d'abord de vous connecter ou de créer votre compte (puis vous revenez automatiquement ici).

### Étape 3 — Remplir le formulaire (`/candidature/:concoursId/filiere/:filiereId`)

1. **NIP gabonais (optionnel)** : si vous possédez déjà un NIP/NIPCAN, saisissez-le et cliquez **Rechercher** pour pré-remplir nom, prénom, naissance, contacts et photo.
2. Compléter tous les champs obligatoires et ajouter la **photo d'identité**.
3. Contrôler l'alerte d'âge éventuelle (bloquante si dépassement).
4. Cliquer sur **« Créer ma candidature »**.

### Étape 4 — Confirmation (`/confirmation/:nupcan`)

- La page affiche votre **NUPCAN** : **notez-le et conservez l'email reçu**.
- Vos identifiants de compte (si créés à cette occasion) sont envoyés par email.
- Boutons de suite : **déposer les documents**, **télécharger le reçu**.

> Un même candidat ne peut pas s'inscrire **deux fois au même concours** : un message l'indique et renvoie vers le tableau de bord.

---

## 6. Espace candidat — tableau de bord

### 6.1 Tableau de bord NIPCAN (`/dashboard/:nipcan`)

Vue multi-candidatures avec onglets :

| Onglet | Contenu |
|---|---|
| **Vue d'ensemble** | Statistiques (total, en cours, terminées) + candidatures récentes avec progression. |
| **Candidatures** | Liste complète : concours, filière, statut, progression, documents déposés/requis, paiement. Bouton **Nouvelle** pour candidater à un autre concours. |
| **Documents** | Gestion documentaire de la candidature sélectionnée (voir §7). |
| **Résultats** | Notes par matière et moyenne (bulletin téléchargeable en PDF). |
| **Notifications** | Alertes (document validé/rejeté, etc.). |
| **Messages** | Échanges avec l'administration pour la candidature sélectionnée. |
| **Profil** | Vos informations personnelles. |
| **Paramètres** | Session et déconnexion. |

La **barre de progression** rappelle l'étape suivante : *Télécharger vos documents* → *Effectuer le paiement* → *Finaliser*.

### 6.2 Tableau de bord par candidature (`/dashboard/candidature/:nupcan`, `/statut/:nupcan`, `/recap/:nupcan`)

Vues centrées sur **une** candidature : progression globale (inscription / documents / paiement), profil, concours, filière et matières, **Mes documents**, actions rapides (reçu PDF/PNG, envoi par email).

---

## 7. Espace candidat — documents

### 7.1 Déposer (`/documents/:nupcan`)

1. Pour chaque pièce de la **check-list** (requis + optionnels), cliquer sur la pièce puis choisir le fichier (PDF, JPEG, PNG, WebP — 10 Mo max).
2. Respecter le **type demandé** pour chaque pièce (un contrôle bloque les formats non autorisés).
3. Une pièce déjà envoyée ne peut pas être envoyée deux fois : utilisez **Remplacer**.
4. Suivre l'avancement : *x document(s) envoyé(s) sur y requis*.

Qualité exigée : fichier net, complet, lisible, non protégé par mot de passe, informations cohérentes avec la candidature.

### 7.2 Suivre et corriger (`Mes documents`, `/dossier/recap/:nupcan`)

- Chaque document affiche son **statut** (`en_attente`, `valide`, `rejete`) et, en cas de rejet, le **motif**.
- **Voir** : ouvre l'aperçu du fichier.
- **Modifier / Remplacer** : possible uniquement pour un document **rejeté** (ou redemandé).
- **Supprimer** : possible uniquement pour un document **non validé**.
- Un document **validé** ne peut plus être ni modifié ni supprimé.

> Le paiement peut être **conditionné à la validation des documents** : tant que des pièces ne sont pas validées, l'accès au paiement affiche un avertissement.

---

## 8. Espace candidat — paiement (`/paiement/:nupcan`)

1. Vérifier le **montant** (certains concours sont **gratuits** : montant 0, aucune action requise).
2. Choisir la méthode **Mobile Money** proposée (ex. Airtel Money, Moov Money) et saisir le numéro de téléphone du compte à débiter si demandé.
3. Valider et suivre les instructions affichées à l'écran (et sur le téléphone).
4. Statuts possibles : `en_attente`, `valide` (payé), `rejete` (échec — recommencer).
5. Après paiement, **télécharger le reçu** et le conserver.

> Payer ne signifie pas que le dossier est accepté : continuez à surveiller les statuts des documents jusqu'à la décision finale.

---

## 9. Espace candidat — résultats, reçus, messages

### Résultats / notes
- Onglet **Résultats** : tableau matière / note / coefficient + **moyenne générale**.
- Bouton **Télécharger PDF** : bulletin officiel (identité, NUPCAN, concours, date d'édition).

### Reçus
- Depuis le tableau de bord : **Télécharger le reçu PDF**, **Télécharger le reçu PNG**, **Envoyer le reçu par email**.
- Le reçu reprend : identité, NUPCAN, concours, filière, montant, statut du paiement, date.

### Notifications et messagerie
- **Notifications** : cloche + panneau ; marquer comme lues.
- **Messagerie** : écrire à l'administration **en précisant toujours** : NUPCAN, concours/filière, type de document concerné, date approximative de l'action. Ne jamais y inscrire de mot de passe.

---

## 10. Espace administration — connexion et rôles

Page : **`/admin/login`** (email + mot de passe).

### Première connexion et mot de passe
- À la première connexion, un **changement de mot de passe** peut être exigé (10 caractères minimum, avec majuscule, minuscule et chiffre).
- Rubrique **Profil / Paramètres** : modifier son mot de passe à tout moment (l'ancien est demandé).

### Rôles et permissions

| Rôle | Périmètre |
|---|---|
| `super_admin` | Tout : concours, établissements, comptes, statistiques, journaux, IA. Seul à pouvoir créer des concours et gérer les établissements/niveaux. |
| `admin` / `admin_etablissement` | Dossiers de ses établissements : documents, notes, paiements, messages, rapports, sous-admins. |
| `reviewer` (réviseur) | Consultation + validation documents/notes, rapports, messages. |
| `finance` | Paiements uniquement (lecture). |
| Sous-admin `documents_validator` | Validation des documents uniquement. |
| Sous-admin `grades_entry` | Saisie des notes uniquement. |

Un administrateur non `super_admin` ne voit que les concours de **ses établissements attribués** ; toute action hors périmètre est refusée (erreur 403).

---

## 11. Espace administration — guide par rubrique

### Tableau de bord (`/admin/dashboard`)
Vue d'ensemble chiffrée : concours (ouverts/fermés), candidatures, candidats, documents (en attente/validés/rejetés), paiements (montants), messages non lus.

### Concours (`/admin/concours`, création super-admin)
- Consulter la liste avec totaux (candidatures, documents, paiements).
- **Créer** (super-admin) : libellé, établissement, niveau, dates, frais, âge max, places, **au moins un document requis** avec consignes de validation/rejet.
- **Modifier** : mêmes champs (interdit sur concours archivé/clôturé) ; **archiver** au lieu de supprimer.
- Associer filières et places (`concours-filieres`), matières et coefficients (`filiere-matieres`, `matieres`).

### Candidats (`/admin/candidats`, `/admin/candList`, `/admin/candidats/:nupcan`)
- Liste filtrable par concours, avec statut, paiement et documents.
- Fiche candidat : identité, candidature(s), documents (voir/valider/rejeter), notes, paiements, messages.

### Dossiers / documents (`/admin/dossiers`)
- File de validation : filtrer par statut (en attente, validés, rejetés), ouvrir le fichier, **valider** ou **rejeter avec motif précis**.
- Le candidat est notifié automatiquement de chaque décision.

### Paiements (`/admin/paiements`)
- Liste des transactions : montant, méthode, référence, statut (`valide`, `en_attente`, `rejete`, `rembourse`).

### Notes (`/admin/notes`)
- Choisir concours → filière → saisir les notes par matière (coefficients affichés), calculer la moyenne, verrouiller/valider selon la procédure de l'établissement.

### Messagerie (`/admin/messagerie`)
- Conversations par candidature : répondre aux candidats, historique conservé.

### Établissements, niveaux, filières (`/admin/gestion-etablissements`, `/admin/etablissements`, `/admin/niveaux`, `/admin/filieres`)
- Créer/modifier/désactiver (super-admin). La désactivation ne supprime pas l'historique.

### Sous-administrateurs (`/admin/sous-admins`)
- Créer un sous-admin (rôle notes **ou** documents), rattacher à un établissement. **Limite : 3 actifs** par établissement.

### Statistiques (`/admin/statistiques`) et rapports
- Répartitions par concours/filière, taux de dossiers validés (parmi les dossiers décidés), montants encaissés. Les exports (Excel/CSV) servent aux rapports.

### Journaux (`/admin/logs`, `/admin/logs-admin`)
- Traçabilité : connexions, validations, rejets, modifications. À consulter en cas de litige.

### Archives (`/admin/archives`)
- Concours clôturés/archivés : **lecture seule** (aucune modification de dossier, document ou note).

### Configuration IA (`/admin/configuration-ia`)
- Réservé aux habilités : consignes de validation/rejet par pièce, relance d'analyse, suivi des échecs. Voir §12. Sans clé API configurée, l'IA est marquée indisponible et la validation manuelle s'applique.

### Support (`/admin/support`)
- Demandes d'assistance des candidats : répondre en citant le NUPCAN.

---

## 12. Validation des documents (procédure admin)

1. Ouvrir la file (**Dossiers** ou fiche candidat).
2. Filtrer les documents **en attente / à vérifier** (priorité aux signalements IA).
3. Ouvrir le fichier : lisibilité, type conforme, pages complètes, cohérence avec la candidature.
4. Décider : **Valider** ou **Rejeter**.
5. En cas de rejet : motif **précis et utile** (ex. « page 2 manquante », « photo illisible », « acte expiré le… » — éviter « non conforme » seul).
6. Enregistrer : le candidat est notifié et peut remplacer le document.

**Rôle de l'IA** : recommandation (`approve` / `reject` / `review`) + indice de confiance. Sous 90 % de confiance, un **contrôle humain est exigé**. La décision administrative **prévaut toujours** sur la recommandation IA. Ne jamais valider uniquement sur recommandation automatique.

---

## 13. FAQ et dépannage

### Candidat

| Problème | Que faire |
|---|---|
| « NIP non trouvé » | Vérifier la saisie ; sinon continuer manuellement, le NIP est optionnel. |
| « Session requise » / 401 | Session de 24 h expirée : se reconnecter (`/connexion`). |
| Code email non reçu / expiré | Vérifier les spams, l'adresse saisie, puis redemander un code (validité 10 min). |
| « Ce téléphone ou identifiant est déjà utilisé » | Utiliser la récupération de compte avec l'email d'origine. |
| « Vous êtes déjà inscrit à ce concours » | Normal : une seule candidature par concours ; la retrouver dans le tableau de bord. |
| Âge rejeté | Vérifier date de naissance et limite du concours ; au-delà du maximum, inscription impossible. |
| Fichier refusé (taille/type) | PDF/JPEG/PNG/WebP, ≤ 10 Mo (photo ≤ 5 Mo) ; convertir ou compresser le fichier. |
| Document « rejeté » | Lire le motif, corriger, utiliser **Remplacer** (pas d'envoi en double). |
| Paiement en échec | Vérifier le solde mobile, le numéro saisi, puis recommencer ; conserver la référence. |
| Page blanche / erreur d'affichage | Recharger (Ctrl+F5) ; si persistant, signaler avec NUPCAN + capture au support. |

### Administrateur

| Problème | Que faire |
|---|---|
| « Permission insuffisante » (403) | L'action dépasse votre rôle ou établissement : escalader au super-admin. |
| Concours non modifiable | Concours archivé/clôturé : lecture seule, créer une nouvelle session si besoin. |
| « Limite de trois sous-administrateurs » | Désactiver un compte avant d'en créer un nouveau. |
| IA indisponible | Vérifier la configuration (clé, modèle) puis basculer en validation manuelle. |

---

## 14. Sécurité et confidentialité

- **NUPCAN et NIPCAN** : personnels. Ne les publiez pas (réseaux sociaux, captures publiques).
- **Mot de passe** : 10 caractères minimum, jamais partagé ni envoyé par message ; chaque session candidat expire après 24 h.
- **Documents** : ne les téléchargez/partagez qu'avec les outils de la plateforme ; ne demandez jamais un mot de passe par messagerie.
- **Données** : nom, email, téléphone, photo sont utilisés uniquement pour le traitement des candidatures.
- En cas de suspicion d'accès frauduleux : changez le mot de passe, déconnectez-vous partout et prévenez l'administration en citant le NUPCAN.

---

*Fin du guide. Pour la validation fonctionnelle, voir le document compagnon : `CAHIER_DE_TESTS_UTILISATEUR.md`.*
