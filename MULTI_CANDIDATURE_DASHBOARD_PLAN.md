# Plan d'Amélioration: Dashboard Multi-Candidatures

## 🎯 Objectif
Permettre à un candidat de gérer plusieurs candidatures depuis un seul dashboard unifié, en utilisant le NIPCAN comme identifiant principal.

## 📊 Concepts Clés

### NIPCAN (Numéro d'Identification Personnel du Candidat)
- Identifiant unique et permanent pour chaque candidat
- Utilisé pour toutes les candidatures du candidat
- Permet l'authentification et l'accès au dashboard global

### NUPCAN (Numéro Unique de Participation au Concours)
- Identifiant unique pour chaque candidature spécifique
- Format: `YYYYMMDD-X` (ex: 20260222-4)
- Un candidat peut avoir plusieurs NUPCAN (une par concours)

## 🏗️ Architecture Proposée

### 1. Système d'Authentification
```
Route: /connexion
- Connexion avec NIPCAN (ou email/téléphone)
- Redirection vers: /dashboard/{NIPCAN}
```

### 2. Dashboard Principal
```
Route: /dashboard/{NIPCAN}

Sections:
├── Vue d'ensemble (Résumé de toutes les candidatures)
├── Mes Candidatures (Liste des candidatures actives)
├── Nouvelle Candidature (Bouton pour postuler à un nouveau concours)
├── Profil (Informations personnelles)
└── Notifications (Alertes globales)
```

### 3. Dashboard par Candidature
```
Route: /dashboard/{NIPCAN}/candidature/{NUPCAN}

Sections:
├── Informations du concours
├── Documents (Upload/Validation)
├── Paiement (Statut/Reçu)
├── Notes/Résultats
└── Messagerie (Support)
```

## 🎨 Design Inspiré de anbg.ga

### Layout Principal
```
┌─────────────────────────────────────────────────────┐
│  Header: Logo | Nom Candidat | Notifications | ⚙️   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Candidature │  │ Candidature │  │  Nouvelle   │ │
│  │   Active    │  │  En attente │  │ Candidature │ │
│  │             │  │             │  │      +      │ │
│  │  Concours A │  │  Concours B │  │             │ │
│  │  📄 ✅ 💳   │  │  📄 ⏳ ❌   │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ Activités Récentes                            │  │
│  │ • Document validé - Concours A                │  │
│  │ • Paiement confirmé - Concours B              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Card Candidature
```
┌─────────────────────────────────────┐
│ 🎓 Concours National 2026           │
│ NUPCAN: 20260222-4                  │
├─────────────────────────────────────┤
│ Filière: Informatique               │
│ Établissement: ENS                  │
├─────────────────────────────────────┤
│ Progression:                        │
│ ████████░░ 80%                      │
│                                     │
│ ✅ Inscription                      │
│ ✅ Documents (4/4)                  │
│ ✅ Paiement                         │
│ ⏳ Résultats                        │
├─────────────────────────────────────┤
│ [Voir Détails] [Documents] [Notes]  │
└─────────────────────────────────────┘
```

## 🔧 Modifications Techniques Nécessaires

### Backend

#### 1. Routes à Créer/Modifier
```javascript
// Authentification
POST /api/auth/login-candidat
  Body: { nipcan, password } ou { email, password }
  Response: { nipcan, token, candidatures: [] }

// Dashboard principal
GET /api/candidats/nipcan/:nipcan/dashboard
  Response: {
    candidat: { nipcan, nom, prenom, ... },
    candidatures: [
      { nupcan, concours, statut, progression, ... }
    ],
    notifications: [],
    activites_recentes: []
  }

// Candidatures par NIPCAN
GET /api/candidats/nipcan/:nipcan/candidatures
  Response: [ { nupcan, concours, documents, paiement, notes } ]

// Détails d'une candidature
GET /api/candidatures/:nupcan
  Response: { candidature, documents, paiement, notes, messages }
```

#### 2. Modèles à Modifier
```javascript
// Candidat.js
- Ajouter méthode: findByNipcan(nipcan)
- Ajouter méthode: getCandidaturesByNipcan(nipcan)
- Ajouter méthode: getDashboardData(nipcan)

// Candidature.js (nouveau modèle)
- Créer modèle pour gérer les candidatures
- Méthodes: create, findByNupcan, updateStatus, getProgression
```

### Frontend

#### 1. Pages à Créer
```
/src/pages/candidat/
├── DashboardNipcan.tsx          (Dashboard principal)
├── CandidatureDetails.tsx       (Détails d'une candidature)
├── NouvelleCandidature.tsx      (Formulaire nouvelle candidature)
└── ProfilCandidat.tsx           (Profil et paramètres)
```

#### 2. Composants à Créer
```
/src/components/candidat/
├── CandidatureCard.tsx          (Card résumé candidature)
├── ProgressionTimeline.tsx      (Timeline des étapes)
├── CandidaturesList.tsx         (Liste des candidatures)
├── QuickActions.tsx             (Actions rapides)
└── ActivityFeed.tsx             (Fil d'activités)
```

#### 3. Services à Créer
```javascript
// candidatService.ts
- loginWithNipcan(nipcan, password)
- getDashboardData(nipcan)
- getCandidatures(nipcan)
- createNouvelleCandidature(nipcan, concoursId, filiereId)

// candidatureService.ts
- getCandidatureDetails(nupcan)
- updateCandidatureStatus(nupcan, status)
- getProgression(nupcan)
```

## 📱 Flux Utilisateur

### Scénario 1: Première Candidature
1. Candidat remplit le formulaire d'inscription
2. Système génère NIPCAN + NUPCAN
3. Redirection vers /dashboard/{NIPCAN}
4. Dashboard affiche la première candidature

### Scénario 2: Nouvelle Candidature
1. Candidat se connecte avec NIPCAN
2. Accède au dashboard /dashboard/{NIPCAN}
3. Clique sur "Nouvelle Candidature"
4. Sélectionne concours et filière
5. Système génère nouveau NUPCAN
6. Candidature ajoutée au dashboard

### Scénario 3: Suivi Multi-Candidatures
1. Candidat se connecte avec NIPCAN
2. Dashboard affiche toutes ses candidatures
3. Peut basculer entre les candidatures
4. Chaque candidature a son propre suivi

## 🎯 Fonctionnalités Clés

### Dashboard Principal
- ✅ Vue d'ensemble de toutes les candidatures
- ✅ Statut en temps réel (documents, paiement, notes)
- ✅ Notifications centralisées
- ✅ Accès rapide aux actions importantes
- ✅ Historique des activités

### Gestion des Candidatures
- ✅ Créer plusieurs candidatures
- ✅ Suivre la progression de chaque candidature
- ✅ Gérer documents par candidature
- ✅ Voir les résultats par candidature
- ✅ Messagerie par candidature

### Profil Unifié
- ✅ Informations personnelles partagées
- ✅ Historique complet
- ✅ Paramètres de notification
- ✅ Sécurité et confidentialité

## 🚀 Plan d'Implémentation

### Phase 1: Backend (Priorité Haute)
1. Créer routes d'authentification avec NIPCAN
2. Créer endpoint dashboard principal
3. Modifier modèles pour supporter multi-candidatures
4. Créer système de progression

### Phase 2: Frontend (Priorité Haute)
1. Créer page DashboardNipcan
2. Créer composants CandidatureCard
3. Implémenter navigation entre candidatures
4. Créer système de notifications

### Phase 3: Améliorations (Priorité Moyenne)
1. Timeline de progression
2. Fil d'activités
3. Statistiques et graphiques
4. Export de documents

### Phase 4: Optimisations (Priorité Basse)
1. Cache et performance
2. Mode hors ligne
3. Notifications push
4. Thème personnalisable

## 📊 Métriques de Succès
- Temps de navigation entre candidatures < 1s
- Taux de complétion des candidatures > 80%
- Satisfaction utilisateur > 4.5/5
- Réduction des demandes de support de 40%

## 🔐 Sécurité
- Authentification par NIPCAN + mot de passe
- Token JWT pour les sessions
- Validation des permissions par candidature
- Logs d'activité pour audit

## 📝 Notes
- Inspiration: anbg.ga (design moderne et intuitif)
- Mobile-first approach
- Accessibilité WCAG 2.1 AA
- Support multilingue (FR/EN)
