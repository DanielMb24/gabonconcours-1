# 🎓 Système Multi-Candidature GABConcours

## 📖 Vue d'ensemble

Le système multi-candidature permet à un candidat de gérer plusieurs candidatures à différents concours depuis un seul dashboard unifié, en utilisant un identifiant unique permanent (NIPCAN).

## 🚀 Démarrage Rapide

### 1. Mise à jour de la Base de Données

```bash
# Sauvegarde de sécurité
mysqldump -u root -p gabconcoursv5 > backup_$(date +%Y%m%d_%H%M%S).sql

# Application du script de mise à jour
mysql -u root -p gabconcoursv5 < backend/scripts/update-multi-candidature.sql

# Vérification avec les tests
mysql -u root -p gabconcoursv5 < backend/scripts/test-multi-candidature.sql
```

### 2. Démarrage des Serveurs

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 3. Accès au Dashboard

```
URL: http://localhost:5173/dashboard/{NIPCAN}
Exemple: http://localhost:5173/dashboard/NIP2026000001
```

## 📚 Documentation

### Guides Disponibles

1. **[MULTI_CANDIDATURE_DASHBOARD_PLAN.md](./MULTI_CANDIDATURE_DASHBOARD_PLAN.md)**
   - Plan complet du système
   - Architecture et design
   - Fonctionnalités détaillées

2. **[IMPLEMENTATION_MULTI_CANDIDATURE.md](./IMPLEMENTATION_MULTI_CANDIDATURE.md)**
   - Détails techniques d'implémentation
   - Code et exemples
   - Structure des données

3. **[GUIDE_MISE_A_JOUR_BD.md](./GUIDE_MISE_A_JOUR_BD.md)**
   - Guide pas à pas de mise à jour BD
   - Résolution des problèmes
   - Vérifications post-installation

4. **[RESUME_IMPLEMENTATION_COMPLETE.md](./RESUME_IMPLEMENTATION_COMPLETE.md)**
   - Résumé complet de ce qui a été fait
   - Ce qu'il reste à faire
   - Métriques et statistiques

## 🎯 Concepts Clés

### NIPCAN vs NUPCAN

| Concept | Description | Format | Exemple | Unicité |
|---------|-------------|--------|---------|---------|
| **NIPCAN** | Numéro d'Identification Personnel du Candidat | NIP{ANNÉE}{NUMÉRO} | NIP2026000001 | 1 par candidat |
| **NUPCAN** | Numéro Unique de Participation au Concours | YYYYMMDD-X | 20260222-4 | 1 par candidature |

### Relation

```
👤 CANDIDAT (NIPCAN: NIP2026000001)
    │
    ├── 📝 Candidature 1 (NUPCAN: 20260222-1) → Concours A
    ├── 📝 Candidature 2 (NUPCAN: 20260222-2) → Concours B
    └── 📝 Candidature 3 (NUPCAN: 20260222-3) → Concours C
```

## 🎨 Interface Utilisateur

### Dashboard Principal

Le dashboard affiche:
- **Header**: Avatar, nom, NIPCAN, notifications
- **Statistiques**: Total candidatures, en cours, complètes, notifications
- **Cards Candidatures**: Une card par candidature avec:
  - Nom du concours et établissement
  - Filière choisie
  - Barre de progression (0-100%)
  - Statut des étapes (✅ ou ⏳)
  - Bouton "Voir Détails"
- **Nouvelle Candidature**: Card dashed pour créer une nouvelle candidature
- **Activités Récentes**: Fil des dernières actions

### Étapes de Progression

Chaque candidature suit 4 étapes:

1. ✅ **Inscription** (25%) - Formulaire complété
2. 📄 **Documents** (50%) - Documents uploadés et validés
3. 💳 **Paiement** (75%) - Frais d'inscription payés
4. 📊 **Résultats** (100%) - Notes publiées

## 🔧 API Endpoints

### Dashboard

```http
GET /api/candidats/nipcan/:nipcan/dashboard
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "candidat": {
      "nipcan": "NIP2026000001",
      "nom": "Doe",
      "prenom": "John",
      "email": "john@example.com",
      "telephone": "+241...",
      "photo": null
    },
    "candidatures": [
      {
        "nupcan": "20260222-4",
        "concours": {
          "id": 1,
          "libcnc": "Concours National 2026",
          "etablissement": "ENS"
        },
        "filiere": {
          "id": 1,
          "nomfil": "Informatique"
        },
        "statut": "en_cours",
        "progression": 75,
        "etapes": {
          "inscription": true,
          "documents": true,
          "paiement": true,
          "resultats": false
        }
      }
    ],
    "notifications": [],
    "activites_recentes": []
  }
}
```

### Liste des Candidatures

```http
GET /api/candidats/nipcan/:nipcan/candidatures
```

## 🗄️ Structure de la Base de Données

### Nouvelles Tables

#### candidat_sessions
Gestion des sessions d'authentification JWT.

```sql
CREATE TABLE candidat_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nipcan VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### candidat_auth
Authentification et sécurité des comptes.

```sql
CREATE TABLE candidat_auth (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nipcan VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    last_login DATETIME
);
```

#### candidat_activities
Fil d'activités du candidat.

```sql
CREATE TABLE candidat_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nipcan VARCHAR(50) NOT NULL,
    nupcan VARCHAR(100),
    activity_type ENUM(...),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Vue Principale

#### v_candidat_dashboard
Vue complète pour le dashboard avec toutes les informations nécessaires.

```sql
CREATE VIEW v_candidat_dashboard AS
SELECT 
    c.nipcan,
    c.nupcan,
    c.nomcan,
    c.prncan,
    con.libcnc as concours_nom,
    f.nomfil as filiere_nom,
    -- Statistiques documents
    (SELECT COUNT(*) FROM dossiers WHERE nipcan = c.nupcan) as documents_total,
    -- Statut paiement
    p.statut as paiement_statut,
    -- Progression calculée
    CASE ... END as progression
FROM candidats c
LEFT JOIN concours con ON c.concours_id = con.id
LEFT JOIN filieres f ON c.filiere_id = f.id
LEFT JOIN paiements p ON c.nupcan = p.nupcan;
```

## 🔐 Sécurité

### Authentification (À Implémenter)

```javascript
// Exemple de flux d'authentification
POST /api/auth/login
{
  "nipcan": "NIP2026000001",
  "password": "********"
}

// Réponse
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "candidat": {
    "nipcan": "NIP2026000001",
    "nom": "Doe",
    "prenom": "John"
  }
}
```

### Protection

- ✅ Mots de passe hashés avec bcrypt
- ✅ Tokens JWT avec expiration
- ✅ Protection contre brute-force
- ✅ Historique des connexions
- ✅ Verrouillage de compte après X tentatives

## 📊 Statistiques et Monitoring

### Requêtes Utiles

```sql
-- Nombre de candidatures par candidat
SELECT 
    nipcan,
    COUNT(*) as nb_candidatures
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY nipcan
ORDER BY nb_candidatures DESC;

-- Progression moyenne par concours
SELECT 
    concours_nom,
    AVG(progression) as progression_moyenne
FROM v_candidat_dashboard
GROUP BY concours_nom;

-- Activités récentes
SELECT * FROM candidat_activities
ORDER BY created_at DESC
LIMIT 20;
```

## 🐛 Résolution des Problèmes

### Problème: Dashboard ne charge pas

**Solution:**
```bash
# Vérifier que le backend est démarré
curl http://localhost:3001/api/candidats/nipcan/NIP2026000001/dashboard

# Vérifier les logs backend
cd backend
npm start
```

### Problème: NIPCAN non trouvé

**Solution:**
```sql
-- Vérifier que le candidat existe
SELECT * FROM candidats WHERE nipcan = 'NIP2026000001';

-- Générer un NIPCAN si manquant
UPDATE candidats 
SET nipcan = generate_nipcan() 
WHERE id = 1 AND (nipcan IS NULL OR nipcan = '');
```

### Problème: Documents ne s'uploadent pas

**Solution:**
```javascript
// Vérifier les logs frontend
console.log('Fichiers à envoyer:', uploadedDocuments);

// Vérifier les logs backend
// Chercher: "📥 Requête reçue - Body:"
```

## 🧪 Tests

### Tests Manuels

1. **Test Dashboard**
   ```
   1. Aller sur /dashboard/NIP2026000001
   2. Vérifier que les candidatures s'affichent
   3. Vérifier les statistiques
   4. Cliquer sur "Voir Détails"
   ```

2. **Test Upload Documents**
   ```
   1. Aller sur /documents/20260222-4
   2. Uploader des documents
   3. Vérifier la redirection vers dashboard
   4. Vérifier que les documents apparaissent
   ```

3. **Test Progression**
   ```
   1. Créer une candidature
   2. Uploader documents → Progression 50%
   3. Payer → Progression 75%
   4. Publier notes → Progression 100%
   ```

### Tests Automatisés

```bash
# Tests SQL
mysql -u root -p gabconcoursv5 < backend/scripts/test-multi-candidature.sql

# Tests Backend (à créer)
cd backend
npm test

# Tests Frontend (à créer)
cd frontend
npm test
```

## 📈 Roadmap

### Phase 1: Base (✅ Complète)
- ✅ Structure base de données
- ✅ Routes backend
- ✅ Page dashboard frontend
- ✅ Documentation

### Phase 2: Authentification (🔴 En cours)
- ⏳ Système de connexion NIPCAN
- ⏳ Génération tokens JWT
- ⏳ Middleware d'authentification
- ⏳ Page de connexion

### Phase 3: Multi-Candidatures (🟡 À venir)
- ⏳ Création nouvelle candidature
- ⏳ Gestion plusieurs NUPCAN
- ⏳ Formulaire inscription amélioré

### Phase 4: Fonctionnalités Avancées (🟢 Futur)
- ⏳ Profil candidat
- ⏳ Notifications temps réel
- ⏳ Export PDF
- ⏳ Statistiques avancées

## 🤝 Contribution

### Structure du Code

```
gabonconcours/
├── backend/
│   ├── routes/
│   │   └── candidat-dashboard.js
│   ├── models/
│   ├── middleware/
│   └── scripts/
│       ├── update-multi-candidature.sql
│       └── test-multi-candidature.sql
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── candidat/
│   │   │       └── DashboardNipcan.tsx
│   │   ├── components/
│   │   └── services/
│   └── ...
└── docs/
    ├── MULTI_CANDIDATURE_DASHBOARD_PLAN.md
    ├── IMPLEMENTATION_MULTI_CANDIDATURE.md
    ├── GUIDE_MISE_A_JOUR_BD.md
    └── RESUME_IMPLEMENTATION_COMPLETE.md
```

### Conventions

- **Backend**: JavaScript (Node.js + Express)
- **Frontend**: TypeScript + React
- **Base de données**: MySQL 8.0+
- **Style**: ESLint + Prettier
- **Commits**: Conventional Commits

## 📞 Support

### Ressources

- 📖 Documentation: Voir les fichiers MD dans le projet
- 🐛 Issues: Créer une issue sur GitHub
- 💬 Discussion: Contacter l'équipe de développement

### Contacts

- **Équipe Technique**: dev@gabonconcours.ga
- **Support**: support@gabonconcours.ga

---

**Version**: 1.0  
**Date**: 22 Février 2026  
**Statut**: ✅ Phase 1 Complète  
**Licence**: Propriétaire - GABConcours
