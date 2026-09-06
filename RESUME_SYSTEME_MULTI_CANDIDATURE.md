# Résumé du Système Multi-Candidature

## Concepts Clés

### NIPCAN (Numéro d'Identification Permanent du Candidat)
- **Format**: `NIP2026000001`
- **Unique par candidat**
- **Permanent**: Ne change jamais, même avec plusieurs candidatures
- **Utilisation**: Identifier le candidat de manière unique

### NUPCAN (Numéro Unique de Participation au Concours)
- **Format**: `20260222-1` (date + compteur)
- **Unique par candidature**
- **Temporaire**: Un nouveau NUPCAN pour chaque candidature
- **Utilisation**: Identifier une candidature spécifique

### USERNAME
- **Format**: `makanda` (première lettre du nom + prénom en minuscules)
- **Unique par candidat**
- **Utilisation**: Connexion au dashboard

## Flux de Création de Candidature

### 1. Première Candidature (Nouveau Candidat)

```
Candidat remplit le formulaire
    ↓
Backend génère:
  - NIPCAN: NIP2026000001
  - NUPCAN: 20260222-1
  - USERNAME: makanda
    ↓
Sauvegarde dans `candidats`:
  - id: 1
  - nipcan: NIP2026000001
  - nupcan: 20260222-1
  - nomcan: MAKANDA
  - prncan: Daniel
  - ...
    ↓
Email envoyé avec:
  - NIPCAN
  - NUPCAN
  - USERNAME
  - Lien dashboard: /dashboard/NIP2026000001
```

### 2. Candidature Suivante (Candidat Existant)

```
Candidat se connecte avec USERNAME
    ↓
Système récupère son NIPCAN
    ↓
Candidat crée nouvelle candidature
    ↓
Backend génère:
  - NUPCAN: 20260223-1 (nouveau)
  - Réutilise NIPCAN: NIP2026000001 (existant)
    ↓
Sauvegarde dans `candidats`:
  - id: 2
  - nipcan: NIP2026000001 (même que candidature 1)
  - nupcan: 20260223-1 (nouveau)
  - nomcan: MAKANDA
  - prncan: Daniel
  - concours_id: 24 (différent)
  - ...
```

## Structure Base de Données

### Table `candidats`
```sql
CREATE TABLE `candidats` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nipcan` VARCHAR(50) UNIQUE,      -- Identifiant permanent
  `nupcan` VARCHAR(50) UNIQUE,      -- Identifiant de candidature
  `nomcan` VARCHAR(100),
  `prncan` VARCHAR(100),
  `concours_id` INT,
  `filiere_id` INT,
  ...
);
```

### Table `dossiers` (Documents)
```sql
CREATE TABLE `dossiers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nipcan` VARCHAR(50),             -- Lien vers le candidat
  `nupcan` VARCHAR(50),             -- Lien vers la candidature
  `document_id` INT,
  ...
);
```

### Table `paiements`
```sql
CREATE TABLE `paiements` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nipcan` VARCHAR(50),             -- Lien vers le candidat
  `nupcan` VARCHAR(50),             -- Lien vers la candidature
  ...
);
```

## Dashboard

### URL
- `/dashboard/NIP2026000001` (avec NIPCAN)
- Ou `/dashboard/20260222-1` (avec NUPCAN, converti automatiquement en NIPCAN)

### Affichage
```
┌─────────────────────────────────────────────────┐
│ Sidebar                                         │
│                                                 │
│ Vue d'ensemble                                  │
│ Mes Candidatures ▼                              │
│   ├─ BBS-2 (20260222-1)                        │
│   ├─ Licence Info (20260223-1)                 │
│   └─ + Nouvelle candidature                    │
│ Mon Profil                                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Contenu Principal                               │
│                                                 │
│ Statistiques:                                   │
│ - Total: 2 candidatures                         │
│ - En cours: 1                                   │
│ - Complètes: 1                                  │
│                                                 │
│ Candidatures récentes:                          │
│ - BBS-2 (20260222-1) - 75% complète            │
│ - Licence Info (20260223-1) - 25% complète     │
└─────────────────────────────────────────────────┘
```

## Problèmes Actuels à Corriger

### 1. Documents ne s'affichent pas
**Cause**: La requête cherche avec `nipcan` au lieu de `nupcan`
**Solution**: Corriger la requête dans `backend/routes/candidat-dashboard-simple.js`

```javascript
// AVANT (incorrect)
WHERE dos.nipcan = ?

// APRÈS (correct)
WHERE dos.nupcan = ?
```

### 2. Création de candidature échoue
**Cause**: Table `nipcan_counters` n'existe pas
**Solution**: Exécuter le script SQL `fix-nipcan-quick.sql`

### 3. USERNAME pas généré
**Cause**: Pas implémenté dans le backend
**Solution**: Ajouter la génération dans `backend/routes/candidats.js`

## Actions à Faire

1. ✅ Exécuter `backend/scripts/fix-nipcan-quick.sql` dans phpMyAdmin
2. ⏳ Corriger la requête documents (nipcan → nupcan)
3. ⏳ Ajouter génération USERNAME
4. ⏳ Ajouter envoi email avec NIPCAN, NUPCAN, USERNAME
5. ⏳ Tester le flux complet

## Exemple Complet

### Candidat: Daniel MAKANDA

**Candidature 1** (BBS-2):
- NIPCAN: `NIP2026000001`
- NUPCAN: `20260222-1`
- USERNAME: `dmakanda`
- Documents: 4 fichiers liés à `20260222-1`
- Paiement: 20000 FCFA lié à `20260222-1`

**Candidature 2** (Licence Info):
- NIPCAN: `NIP2026000001` (même)
- NUPCAN: `20260223-1` (nouveau)
- USERNAME: `dmakanda` (même)
- Documents: 3 fichiers liés à `20260223-1`
- Paiement: 15000 FCFA lié à `20260223-1`

**Dashboard** (`/dashboard/NIP2026000001`):
- Affiche les 2 candidatures
- Chaque candidature a ses propres documents et paiement
- Statistiques globales: 2 candidatures, 7 documents, 35000 FCFA
