# 🔄 Migration: Renommage colonne nipcan → nupcan dans table dossiers

## 📋 Résumé

La table `dossiers` avait une colonne nommée `nipcan` qui contenait en réalité le **NUPCAN** (numéro de candidature), pas le NIPCAN (identifiant permanent du candidat). Cette confusion de nommage a été corrigée.

---

## ✅ Changements Effectués

### 1. Script SQL de Migration

**Fichier:** `backend/scripts/rename-dossiers-nipcan-to-nupcan.sql`

```sql
ALTER TABLE dossiers 
CHANGE COLUMN nipcan nupcan VARCHAR(50);
```

### 2. Fichiers Backend Modifiés

#### `backend/models/Dossier.js`
- ✅ Méthode `create()`: Utilise maintenant `nupcan` au lieu de `nipcan`
- ✅ Méthode `findByNupcan()`: Requête SQL mise à jour avec `dos.nupcan`
- ✅ Accepte les deux noms (`nupcan` ou `nipcan`) pour compatibilité temporaire

#### `backend/routes/dossiers.js`
- ✅ Route POST `/`: Utilise `nupcan` lors de la création de dossiers
- ✅ Route POST `/add-document`: Utilise `nupcan`
- ✅ Requête de comptage des documents: `WHERE dos.nupcan = ?`

#### `backend/routes/candidat-dashboard-simple.js`
- ✅ Comptage des documents: `WHERE dos.nupcan = ?`
- ✅ Commentaires mis à jour pour refléter le changement

#### `backend/routes/candidat-dashboard.js`
- ✅ Comptage des documents: `WHERE dos.nupcan = ?`
- ✅ Activités récentes: `WHERE dos.nupcan IN (...)`

#### `backend/models/Document.js`
- ✅ Méthode de récupération: `WHERE dos.nupcan = ?`

#### `backend/models/Candidat.js`
- ✅ Méthode de récupération des documents: `WHERE dos.nupcan = ?`

---

## 🚀 Instructions de Migration

### Étape 1: Exécuter le Script SQL

Dans phpMyAdmin, exécutez:

```sql
ALTER TABLE dossiers 
CHANGE COLUMN nipcan nupcan VARCHAR(50);
```

### Étape 2: Vérifier la Migration

```sql
-- Vérifier la structure de la table
DESCRIBE dossiers;

-- Vérifier que les données sont toujours là
SELECT nupcan, COUNT(*) as nb_docs
FROM dossiers
GROUP BY nupcan;
```

### Étape 3: Redémarrer le Serveur Backend

```bash
cd backend
# Arrêter le serveur (Ctrl+C)
npm start
```

### Étape 4: Tester

1. Aller sur le dashboard
2. Vérifier que les documents s'affichent correctement
3. Téléverser un nouveau document
4. Vérifier qu'il apparaît immédiatement

---

## 📊 Avant / Après

### Avant (Confus)

```javascript
// Table dossiers
{
    id: 1,
    candidat_id: 123,
    nipcan: "2026082-2"  // ⚠️ Contient le NUPCAN!
}

// Code
WHERE dos.nipcan = cand.nupcan  // Confus!
```

### Après (Clair)

```javascript
// Table dossiers
{
    id: 1,
    candidat_id: 123,
    nupcan: "2026082-2"  // ✅ Nom correct!
}

// Code
WHERE dos.nupcan = cand.nupcan  // Clair!
```

---

## ⚠️ Points d'Attention

### Compatibilité Temporaire

Le modèle `Dossier.js` accepte temporairement les deux noms:

```javascript
nupcan: dossierData.nupcan || dossierData.nipcan || null
```

Cela permet une transition en douceur si du code ancien utilise encore `nipcan`.

### Vérification des Données

Après la migration, vérifiez que tous les documents sont toujours accessibles:

```sql
SELECT 
    c.nipcan,
    c.nupcan,
    COUNT(d.id) as total_documents
FROM candidats c
LEFT JOIN dossiers dos ON dos.nupcan = c.nupcan
LEFT JOIN documents d ON dos.document_id = d.id
GROUP BY c.nipcan, c.nupcan;
```

---

## 🎯 Bénéfices

1. **Clarté du code**: Le nom de la colonne reflète son contenu réel
2. **Moins d'erreurs**: Plus de confusion entre NIPCAN et NUPCAN
3. **Maintenance facilitée**: Les futurs développeurs comprendront immédiatement
4. **Cohérence**: Alignement avec le reste du système

---

## 📝 Nomenclature Clarifiée

| Terme | Signification | Portée | Exemple |
|-------|---------------|--------|---------|
| **NIPCAN** | Numéro d'Identification Permanent du CANdidat | 1 par candidat (permanent) | NIP2026000001 |
| **NUPCAN** | NUméro de Participation au Concours du CANdidat | 1 par candidature | 2026082-2 |

### Relation

```
1 Candidat (NIPCAN) → Plusieurs Candidatures (NUPCAN)
```

Exemple:
- Candidat avec NIPCAN `NIP2026000001`
  - Candidature 1: NUPCAN `2026082-1` (Concours BBS)
  - Candidature 2: NUPCAN `2026082-2` (Concours ISTA)
  - Candidature 3: NUPCAN `2026082-3` (Concours ENS)

---

**Date:** 3 avril 2026  
**Statut:** ✅ MIGRATION COMPLÈTE  
**Impact:** 🟢 Amélioration de la clarté du code
