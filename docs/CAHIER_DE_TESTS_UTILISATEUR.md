# Cahier de tests utilisateur — GabConcours

> Recette fonctionnelle de la plateforme, à exécuter avant chaque mise en production.
> Document compagnon : `GUIDE_UTILISATEUR_COMPLET.md` (usage de référence).

---

## 1. Cadre

### 1.1 Objectif et périmètre
Vérifier, du point de vue de l'utilisateur final, que les parcours **candidat** (compte, candidature, documents, paiement, résultats) et **administration** (concours, dossiers, validation, notes, paiements, statistiques) fonctionnent comme décrit dans le guide. Hors périmètre : tests de charge, audit de code, configuration serveur.

### 1.2 Environnement de test
- URL de recette : `________________________________` (à compléter)
- Jeu de données : 1 concours ouvert (frais > 0), 1 concours gratuit, 1 concours clôturé, 2 filières avec matières et coefficients, 3 provinces, pièces requises configurées.
- Comptes : 1 super-admin, 1 admin établissement, 1 sous-admin documents, 1 sous-admin notes, 1 compte finances, 2 candidats (emails distincts accessibles pour les codes).
- Fichiers : 1 PDF valide (< 10 Mo), 1 image lisible, 1 fichier > 10 Mo, 1 fichier de type refusé (ex. `.exe` ou `.zip`), 1 image floue/illisible.

### 1.3 Conventions
- **ID** : `TU-C-xxx` (candidat), `TU-A-xxx` (admin), `TU-T-xxx` (transverse).
- **Priorité** : `P1` bloquant (le parcours principal échoue), `P2` majeur (fonction dégradée), `P3` mineur (confort).
- **Verdict par test** : `OK` / `KO` (+ n° d'anomalie). Un test KO de priorité P1 bloque la recette.

### 1.4 Critères d'acceptation de la version
- 100 % des tests P1 `OK`, ≥ 90 % des P2 `OK`, aucune anomalie bloquante restante.
- Aucune page blanche (erreur non gérée) sur les parcours nominaux.

---

## 2. Tests candidat — compte et connexion

| ID | Titre (P) | Préconditions | Étapes | Résultat attendu |
|---|---|---|---|---|
| TU-C-01 | Création de compte nominale (P1) | Email unused accessible | 1. `/connexion` → mode création 2. Saisir prénom, nom, email, téléphone `+241…`, identifiant, mot de passe ≥ 10 car. 3. « Recevoir le code » 4. Saisir le code reçu 5. Valider | Compte créé, redirection `/dashboard/:nipcan`, NIPCAN affiché, token stocké |
| TU-C-02 | Code expiré / invalide (P2) | Compte en cours de création | 1. Attendre > 10 min OU saisir un code erroné 5 fois | Message d'erreur explicite, renvoi de code possible |
| TU-C-03 | Activation NIPCAN existant (P1) | Candidature créée sans compte, avec email connu | 1. Mode création avec cet email + NIPCAN existant 2. Valider le code | Compte lié : photo, provinces, candidatures conservées |
| TU-C-04 | Récupération mot de passe (P1) | Compte existant, mot de passe oublié | 1. Même formulaire de création avec l'email du compte 2. Valider le code 3. Nouveau mot de passe | Connexion possible avec le nouveau mot de passe, anciennes sessions révoquées |
| TU-C-05 | Connexion nominale (P1) | Compte existant | 1. Saisir identifiant (email, tél. ou pseudo) + mot de passe 2. Valider | Arrivée sur le tableau de bord du NIPCAN |
| TU-C-06 | Identifiants invalides (P2) | — | 1. Mauvais mot de passe 2. Identifiant inexistant | Message « Identifiant ou mot de passe incorrect », pas de connexion |
| TU-C-07 | Règles des identifiants (P2) | — | 1. Pseudo de 2 car. / ne commençant pas par une lettre 2. Tél. < 8 chiffres 3. Mot de passe de 9 car. 4. Email déjà utilisé | Chaque cas rejeté avec message explicite |
| TU-C-08 | Session expirée (P2) | Connecté | 1. Supprimer `candidate_token` du stockage (ou attendre 24 h) 2. Ouvrir `/dashboard/:nipcan` | Redirection/écran « Session requise », pas de page blanche |
| TU-C-09 | Déconnexion (P2) | Connecté | 1. Paramètres → Se déconnecter 2. Rouvrir le dashboard | Accès refusé, retour à la connexion |
| TU-C-09bis | Compte auto-créé affiché en confirmation (P1) | Sans compte, 1ère candidature | 1. Créer une candidature 2. Lire l'encadré bleu | Nom d'utilisateur `nip…` (non modifiable) + mot de passe temporaire affichés ; mention paramètres présente ; email reçu si possible |
| TU-C-09ter | Modification du mot de passe (P1) | Compte auto-créé, connecté | 1. Paramètres → Modifier mon mot de passe (actuel + nouveau ≥ 10 car. + confirmation) 2. Se déconnecter 3. Se reconnecter (ancien puis nouveau) | Ancien refusé, nouveau accepté ; autres sessions révoquées ; NIPCAN, utilisateur et NUPCAN inchangés |

---

## 3. Tests candidat — candidature

| ID | Titre (P) | Préconditions | Étapes | Résultat attendu |
|---|---|---|---|---|
| TU-C-10 | Parcours nominal complet (P1) | Connecté, concours ouvert avec places | 1. `/concours` → fiche → Candidater 2. Choisir filière 3. Formulaire complet + photo 4. « Créer ma candidature » | Page `/confirmation/:nupcan` avec NUPCAN, email reçu avec NUPCAN |
| TU-C-11 | Recherche NIP pré-remplit (P1) | NIPCAN connu avec profil complet | 1. Formulaire : saisir NIPCAN → Rechercher | Nom, prénom, naissance, contacts, photo pré-remplis ; toast de confirmation |
| TU-C-12 | NIP inconnu (P2) | — | 1. Saisir un NIP inexistant → Rechercher | Toast « NIP non trouvé », saisie manuelle toujours possible, **aucun crash** |
| TU-C-13 | Champs obligatoires (P1) | — | 1. Soumettre avec nom, email ou photo manquants | Blocage + message « Champs requis » / « Photo requise » |
| TU-C-14 | Email invalide (P2) | — | 1. Saisir `test@` 2. Soumettre | Message « Email invalide » |
| TU-C-15 | Âge limite (P1) | Concours avec âge max (ex. 35) | 1. Date de naissance → âge 40 ans 2. Soumettre | Alerte rouge + bouton désactivé ; âge < 16 ans refusé aussi |
| TU-C-16 | Double inscription même concours (P2) | 1 candidature existante | 1. Recommencer le parcours pour le même concours | Message « déjà inscrit », renvoi vers le dashboard, pas de doublon |
| TU-C-17 | Photo > 5 Mo ou non-image (P2) | — | 1. Joindre un fichier de 6 Mo / un PDF comme photo | Refus avec message explicite |

---

## 4. Tests candidat — tableau de bord, documents, paiement, résultats

| ID | Titre (P) | Préconditions | Étapes | Résultat attendu |
|---|---|---|---|---|
| TU-C-18 | Dashboard multi-candidatures (P1) | 2 candidatures sur 2 concours | 1. Ouvrir `/dashboard/:nipcan` | Statistiques correctes, les 2 candidatures listées, bouton « Nouvelle » |
| TU-C-19 | Dépôt des pièces requises (P1) | Candidature créée | 1. `/documents/:nupcan` 2. Déposer chaque pièce requise (PDF/image ≤ 10 Mo) | Compteur `x/y` à jour, statuts `en_attente` |
| TU-C-20 | Fichier refusé (P2) | — | 1. Déposer un `.zip` / un fichier de 12 Mo / un format interdit pour la pièce | Refus avec motif (type ou taille), pièce non enregistrée |
| TU-C-21 | Doublon de pièce (P2) | Pièce déjà déposée | 1. Redéposer la même pièce | Message « déjà téléversée, utilisez le remplacement » |
| TU-C-22 | Document rejeté → remplacement (P1) | 1 document rejeté par l'admin (motif visible) | 1. Mes documents → motif lu 2. Modifier → nouveau fichier | Statut repasse `en_attente`, notification admin |
| TU-C-23 | Interdictions (P2) | 1 doc `valide`, 1 doc `en_attente` | 1. Tenter supprimer le doc validé 2. Modifier le doc validé | Actions impossibles (boutons désactivés ou refus) |
| TU-C-24 | Paiement Mobile Money (P1) | Documents déposés, concours payant | 1. `/paiement/:nupcan` 2. Montant vérifié 3. Méthode + numéro 4. Valider | Statut `valide`, référence affichée |
| TU-C-25 | Concours gratuit (P2) | Concours à 0 FCFA | 1. Ouvrir le paiement | Badge « GRATUIT », aucune transaction exigée |
| TU-C-26 | Paiement bloqué si documents non validés (P2) | Docs en attente (selon règle du concours) | 1. Tenter d'accéder au paiement | Avertissement « documents non validés », redirection ou blocage |
| TU-C-27 | Reçus PDF/PNG/email (P2) | Paiement `valide` | 1. Télécharger PDF 2. Télécharger PNG 3. Envoyer par email | Fichiers lisibles (identité, NUPCAN, montant), email reçu |
| TU-C-28 | Résultats et bulletin (P2) | Notes saisies | 1. Onglet Résultats 2. Télécharger PDF | Matières, coefficients, moyenne corrects |
| TU-C-29 | Notifications et messagerie (P3) | 1 décision admin + 1 message admin | 1. Lire la notification 2. Répondre via Messages | Badge de non-lus à jour, message envoyé et visible côté admin |
| TU-C-30 | Statut public par NUPCAN (P2) | NUPCAN connu | 1. `/statut/:nupcan` | Fiche lisible, boutons Continuer vers documents/paiement |

---

## 5. Tests administration

| ID | Titre (P) | Préconditions | Étapes | Résultat attendu |
|---|---|---|---|---|
| TU-A-01 | Connexion admin + changement mdp (P1) | Compte admin avec mdp provisoire | 1. `/admin/login` 2. À l'invite, définir un mdp (10 car., maj/min/chiffre) | Accès au dashboard, obligation levée |
| TU-A-02 | Isolation par établissement (P1) | Admin rattaché à l'établissement E1, concours sur E2 | 1. Lister concours/candidatures 2. Tenter d'ouvrir un dossier E2 (URL directe) | Dossiers E2 invisibles, accès direct refusé (403) |
| TU-A-03 | Création concours (P1) | Super-admin, établissement + niveau existants | 1. Créer : libellé, dates, frais, âge max, places + ≥ 1 document requis 2. Publier | Concours visible côté candidat (`/concours`) avec filières et pièces |
| TU-A-04 | Création sans document requis (P2) | Super-admin | 1. Créer un concours sans pièce | Refus : « Définissez au moins un document » |
| TU-A-05 | Modification / archivage (P2) | Concours existant puis clôturé | 1. Modifier les frais 2. Archiver 3. Tenter une modification | Modification OK avant clôture ; après archivage : lecture seule |
| TU-A-06 | Filières, matières, coefficients (P1) | Concours créé | 1. Associer 2 filières + places 2. Associer matières + coefficients 3. Côté candidat, vérifier la fiche | Filières/matières/coefficients affichés correctement |
| TU-A-07 | Fiche candidature admin (P1) | Candidature avec docs + paiement | 1. `/admin/candidats/:nupcan` | Identité, candidature(s), documents, paiement, messages visibles |
| TU-A-08 | Valider un document (P1) | Doc `en_attente` lisible | 1. Dossiers → ouvrir → Valider | Statut `valide` côté candidat + notification reçue |
| TU-A-09 | Rejeter avec motif (P1) | Doc illisible/incomplet | 1. Rejeter avec motif précis 2. Côté candidat, lire le motif 3. Remplacer le fichier | Motif visible, remplacement possible, traçabilité au journal |
| TU-A-10 | Rejet sans motif (P2) | — | 1. Rejeter sans motif | Refus ou demande de motif (pas de rejet muet) |
| TU-A-11 | Saisie des notes (P1) | Sous-admin notes ou admin | 1. Choisir concours/filière 2. Saisir notes 3. Vérifier moyenne | Moyenne calculée, bulletin candidat à jour |
| TU-A-12 | Sous-admin documents restreint (P2) | Compte `documents_validator` | 1. Valider un document (OK) 2. Tenter saisie de note / création de concours | Action 1 OK, actions 2 refusées |
| TU-A-13 | Rôle finances restreint (P2) | Compte `finance` | 1. Consulter paiements 2. Tenter validation de document | Lecture OK, validation refusée |
| TU-A-14 | Limite de 3 sous-admins (P2) | 3 sous-admins actifs sur E1 | 1. Créer un 4ᵉ | Refus « limite atteinte » ; OK après désactivation d'un compte |
| TU-A-15 | Paiements : lecture et statuts (P2) | Transactions variées | 1. `/admin/paiements` : filtrer `valide`/`en_attente`/`rejete` | Montants, méthodes, références corrects |
| TU-A-16 | Messagerie admin (P2) | Message candidat reçu | 1. Répondre depuis `/admin/messagerie` 2. Vérifier côté candidat | Message visible des deux côtés, historique conservé |
| TU-A-17 | Statistiques et exports (P2) | Données de recette | 1. `/admin/statistiques` : comparer totaux avec les listes 2. Exporter | Chiffres cohérents, export exploitable |
| TU-A-18 | Journaux d'activité (P3) | Actions TU-A-08/09 effectuées | 1. `/admin/logs` : rechercher la candidature | Décisions tracées (qui, quoi, quand) |
| TU-A-19 | IA indisponible → manuel (P2) | Clé IA absente/invalide (recette) | 1. Déposer un document 2. Tenter une relance IA | Mention « IA indisponible », validation manuelle toujours possible |
| TU-A-20 | Support candidat (P3) | Demande avec NUPCAN | 1. `/admin/support` : répondre en citant le NUPCAN | Réponse envoyée et traçable |

---

## 6. Tests transverses

| ID | Titre (P) | Étapes | Résultat attendu |
|---|---|---|---|
| TU-T-01 | Mobile 360 px (P1) | Parcours TU-C-10 complet sur smartphone | Formulaires, dépôt de fichier et paiement utilisables, sans chevauchement bloquant |
| TU-T-02 | Deux navigateurs (P2) | Rejouer TU-C-10 + TU-C-19 sur Chrome et Firefox | Résultats identiques |
| TU-T-03 | Accès direct sans droit (P1) | Sans session : ouvrir `/dashboard/NIPxxxx`, `/admin/dossiers`, `/admin/concours` | Redirection connexion ou 401/403 propre, **jamais** de données affichées ni de page blanche |
| TU-T-04 | Session admin et candidat séparées (P2) | Connecté candidat + ouvrir `/admin/` (et inverse) | Pas de confusion de session, chaque espace exige son authentification |
| TU-T-05 | Rechargement et retour arrière (P3) | Pendant le formulaire puis après création : F5, précédent | Pas de double création, pas de perte bloquante (brouillon conservé si prévu) |
| TU-T-06 | Fichiers limites (P2) | Déposer exactement 10 Mo ; photo de 5 Mo ; nom avec accents/espaces | Acceptés et téléchargeables ; nom assaini sans erreur |
| TU-T-07 | Robustesse données inattendues (P1) | Simuler une réponse API d'erreur sur documents/dashboard | Écran d'erreur géré (ErrorBoundary) + bouton Recharger, pas de page blanche |

---

## 7. Traçabilité et livrables de recette

### 7.1 Grille de suivi (à recopier par campagne)

| ID | Titre | P | Exécuté par / le | Verdict | Anomalie n° |
|---|---|---|---|---|---|
| TU-C-01 | … | P1 | | OK / KO | |
| … | | | | | |

### 7.2 Fiche d'anomalie (une par KO)

1. **N° / date / auteur** :
2. **Test concerné (ID)** :
3. **Environnement** (URL, navigateur, rôle, NUPCAN/NIPCAN de test) :
4. **Étapes pour reproduire** (numérotées) :
5. **Résultat obtenu** (+ capture d'écran, message exact) :
6. **Résultat attendu** :
7. **Gravité** (bloquant / majeur / mineur) + **priorité proposée** :
8. **Pièces jointes** (captures, fichiers de test — sans mot de passe) :

### 7.3 Bilan de campagne

- Tests exécutés : `____ / ____` — OK : `____` — KO : `____` (dont P1 : `____`)
- Anomalies restantes par gravité : bloquantes `__`, majeures `__`, mineures `__`
- Décision : `GO / GO sous réserve / NO-GO` — Réserves : `______________`
- Signatures : recette `______`, produit `______`, date `______`

---

*Fin du cahier de tests. En cas d'écart avec le comportement observé, mettre à jour le test (ID conservé) plutôt que de le supprimer, afin de garder l'historique de recette.*
