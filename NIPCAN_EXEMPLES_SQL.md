# 🗄️ NIPCAN - Exemples SQL

## 📋 Requêtes Utiles pour Tester et Gérer les NIPCAN

---

## 1️⃣ Vérifier les NIPCAN Existants

### Voir tous les NIPCAN
```sql
SELECT 
    nipcan,
    nomcan,
    prncan,
    maican,
    created_at
FROM candidats
WHERE nipcan IS NOT NULL
ORDER BY created_at DESC;
```

### Compter les NIPCAN uniques
```sql
SELECT COUNT(DISTINCT nipcan) as total_candidats_uniques
FROM candidats
WHERE nipcan IS NOT NULL;
```

### Voir le dernier NIPCAN créé
```sql
SELECT 
    nipcan,
    nomcan,
    prncan,
    created_at
FROM candidats
WHERE nipcan IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

---

## 2️⃣ Rechercher un Candidat

### Par NIPCAN
```sql
SELECT * 
FROM candidats 
WHERE nipcan = 'NIP2026000001';
```

### Par Email
```sql
SELECT nipcan, nomcan, prncan, maican
FROM candidats
WHERE maican = 'jean.dupont@example.com'
AND nipcan IS NOT NULL
LIMIT 1;
```

### Par Nom et Prénom
```sql
SELECT nipcan, nomcan, prncan, maican, created_at
FROM candidats
WHERE nomcan = 'DUPONT'
AND prncan = 'Jean'
AND nipcan IS NOT NULL;
```

---

## 3️⃣ Voir les Candidatures d'un NIPCAN

### Toutes les candidatures
```sql
SELECT 
    c.nipcan,
    c.nupcan,
    con.libcnc as concours,
    f.nomfil as filiere,
    c.created_at as date_candidature
FROM candidats c
LEFT JOIN concours con ON c.concours_id = con.id
LEFT JOIN filieres f ON c.filiere_id = f.id
WHERE c.nipcan = 'NIP2026000001'
ORDER BY c.created_at DESC;
```

### Compter les candidatures
```sql
SELECT 
    nipcan,
    COUNT(*) as nombre_candidatures
FROM candidats
WHERE nipcan = 'NIP2026000001'
GROUP BY nipcan;
```

---

## 4️⃣ Statistiques NIPCAN

### Par année
```sql
SELECT 
    SUBSTRING(nipcan, 4, 4) as annee,
    COUNT(DISTINCT nipcan) as total_candidats
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY SUBSTRING(nipcan, 4, 4)
ORDER BY annee DESC;
```

### Candidats avec plusieurs candidatures
```sql
SELECT 
    nipcan,
    nomcan,
    prncan,
    COUNT(*) as nombre_candidatures
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY nipcan, nomcan, prncan
HAVING COUNT(*) > 1
ORDER BY nombre_candidatures DESC;
```

### Top 10 candidats les plus actifs
```sql
SELECT 
    c.nipcan,
    c.nomcan,
    c.prncan,
    COUNT(*) as total_candidatures
FROM candidats c
WHERE c.nipcan IS NOT NULL
GROUP BY c.nipcan, c.nomcan, c.prncan
ORDER BY total_candidatures DESC
LIMIT 10;
```

---

## 5️⃣ Vérifier le Compteur NIPCAN

### État actuel du compteur
```sql
SELECT * FROM nipcan_counters ORDER BY year DESC;
```

### Prochain NIPCAN qui sera généré
```sql
SELECT 
    year,
    counter + 1 as prochain_numero,
    CONCAT('NIP', year, LPAD(counter + 1, 6, '0')) as prochain_nipcan
FROM nipcan_counters
WHERE year = YEAR(CURDATE());
```

---

## 6️⃣ Créer un Candidat de Test

### Avec NIPCAN automatique
```sql
-- Le NIPCAN sera généré automatiquement par le backend
INSERT INTO candidats (
    nupcan, nomcan, prncan, maican, telcan,
    dtncan, ldncan, niveau_id, proorg,
    created_at, updated_at
) VALUES (
    '20260403-TEST1',
    'TEST',
    'Candidat',
    'test@example.com',
    '+241 00 00 00 00',
    '2000-01-01',
    'Libreville',
    1,
    'Gabon',
    NOW(),
    NOW()
);
```

### Avec NIPCAN spécifique (pour tests)
```sql
INSERT INTO candidats (
    nipcan, nupcan, nomcan, prncan, maican, telcan,
    dtncan, ldncan, niveau_id, proorg,
    created_at, updated_at
) VALUES (
    'NIP2026999999',
    '20260403-TEST2',
    'DEMO',
    'Test',
    'demo@example.com',
    '+241 11 11 11 11',
    '1995-05-15',
    'Port-Gentil',
    1,
    'Gabon',
    NOW(),
    NOW()
);
```

---

## 7️⃣ Nettoyer les Données de Test

### Supprimer un candidat de test
```sql
DELETE FROM candidats 
WHERE nipcan = 'NIP2026999999';
```

### Supprimer tous les candidats de test
```sql
DELETE FROM candidats 
WHERE maican LIKE '%test%' 
OR maican LIKE '%demo%';
```

---

## 8️⃣ Corriger des Problèmes

### Candidats sans NIPCAN
```sql
-- Voir les candidats sans NIPCAN
SELECT id, nomcan, prncan, maican, created_at
FROM candidats
WHERE nipcan IS NULL
ORDER BY created_at DESC;
```

### Générer NIPCAN pour candidats existants
```sql
-- ⚠️ À exécuter avec précaution !
-- Cette requête nécessite un script backend pour générer les NIPCAN corrects
SELECT 
    id,
    nomcan,
    prncan,
    'À GÉNÉRER' as nipcan_manquant
FROM candidats
WHERE nipcan IS NULL;
```

---

## 9️⃣ Vérifications de Cohérence

### NIPCAN dupliqués (ne devrait pas exister)
```sql
SELECT 
    nipcan,
    COUNT(*) as occurrences
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY nipcan
HAVING COUNT(*) > 1;
```

### Format NIPCAN invalide
```sql
SELECT 
    nipcan,
    nomcan,
    prncan
FROM candidats
WHERE nipcan IS NOT NULL
AND nipcan NOT REGEXP '^NIP[0-9]{10}$';
```

### Candidats avec email en double
```sql
SELECT 
    maican,
    COUNT(DISTINCT nipcan) as nombre_nipcan
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY maican
HAVING COUNT(DISTINCT nipcan) > 1;
```

---

## 🔟 Rapports Utiles

### Rapport complet d'un candidat
```sql
SELECT 
    c.nipcan,
    c.nomcan,
    c.prncan,
    c.maican,
    c.telcan,
    COUNT(DISTINCT c2.nupcan) as total_candidatures,
    MIN(c2.created_at) as premiere_candidature,
    MAX(c2.created_at) as derniere_candidature
FROM candidats c
LEFT JOIN candidats c2 ON c.nipcan = c2.nipcan
WHERE c.nipcan = 'NIP2026000001'
GROUP BY c.nipcan, c.nomcan, c.prncan, c.maican, c.telcan;
```

### Activité par mois
```sql
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as mois,
    COUNT(DISTINCT nipcan) as nouveaux_candidats,
    COUNT(*) as total_candidatures
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY mois DESC;
```

---

## 🎯 Requêtes pour le Dashboard

### Données dashboard d'un candidat
```sql
SELECT 
    c.nipcan,
    c.nomcan,
    c.prncan,
    c.maican,
    c.phtcan,
    COUNT(DISTINCT c2.nupcan) as total_candidatures,
    SUM(CASE WHEN c2.etape != 'complete' THEN 1 ELSE 0 END) as en_cours,
    SUM(CASE WHEN c2.etape = 'complete' THEN 1 ELSE 0 END) as completes
FROM candidats c
LEFT JOIN candidats c2 ON c.nipcan = c2.nipcan
WHERE c.nipcan = 'NIP2026000001'
GROUP BY c.nipcan, c.nomcan, c.prncan, c.maican, c.phtcan;
```

---

## 📝 Notes Importantes

### ⚠️ Précautions
- Ne jamais modifier manuellement les NIPCAN existants
- Utiliser les scripts backend pour générer les NIPCAN
- Toujours faire un backup avant des modifications massives

### ✅ Bonnes Pratiques
- Vérifier l'unicité des NIPCAN régulièrement
- Surveiller le compteur pour éviter les doublons
- Garder une trace des NIPCAN générés

---

**Date:** 3 avril 2026
