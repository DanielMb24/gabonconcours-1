# Instructions Finales - Système Multi-Candidature

## ⚠️ IMPORTANT: À faire dans l'ordre exact

### Étape 1: Mettre à jour la base de données

1. **Ouvre phpMyAdmin** (http://localhost/phpmyadmin)

2. **Sélectionne la base** `gabconcoursv5`

3. **Va dans l'onglet SQL**

4. **Copie-colle ce script** et exécute-le:

```sql
-- Ajouter nipcan
ALTER TABLE `candidats` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;

-- Ajouter username  
ALTER TABLE `candidats`
ADD COLUMN `username` VARCHAR(100) DEFAULT NULL AFTER `nipcan`;

-- Ajouter les index
ALTER TABLE `candidats` 
ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

ALTER TABLE `candidats`
ADD INDEX `idx_username` (`username`);

-- Créer la table des compteurs NIPCAN
CREATE TABLE IF NOT EXISTS `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer le compteur pour 2025 et 2026
INSERT INTO `nipcan_counters` (`year`, `counter`) 
VALUES (2025, 1), (2026, 1)
ON DUPLICATE KEY UPDATE counter = counter;

-- Générer NIPCAN et USERNAME pour tous les candidats existants
UPDATE `candidats` 
SET 
  `nipcan` = CONCAT('NIP', YEAR(COALESCE(created_at, NOW())), LPAD(id, 6, '0')),
  `username` = LOWER(CONCAT(SUBSTRING(nomcan, 1, 1), REPLACE(prncan, ' ', '')))
WHERE `nipcan` IS NULL OR `nipcan` = '' OR `username` IS NULL OR `username` = '';

-- Vérifier les colonnes dans dossiers
ALTER TABLE `dossiers`
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `dossiers`
ADD INDEX `idx_nupcan_dossier` (`nupcan`);

-- Vérifier les colonnes dans paiements  
ALTER TABLE `paiements`
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `paiements`
ADD INDEX `idx_nupcan_paiement` (`nupcan`);
```

5. **Ignore les erreurs** du type "Column already exists" ou "Table already exists"

6. **Vérifie que ça a marché** en exécutant:

```sql
SELECT id, nipcan, nupcan, username, nomcan, prncan 
FROM candidats 
ORDER BY id DESC 
LIMIT 5;
```

Tu devrais voir des NIPCAN comme `NIP2025000001` et des usernames comme `dmakanda`.

### Étape 2: Redémarrer le backend

1. **Va dans le terminal** où tourne le serveur backend
2. **Arrête-le** avec `Ctrl+C`
3. **Relance-le** avec `npm start` ou `node server.js`
4. **Vérifie** qu'il n'y a pas d'erreurs au démarrage

### Étape 3: Tester la connexion

1. **Va sur** http://localhost:5173/connexion (ou ton port frontend)

2. **Entre un NIPCAN** existant (ex: `NIP2025000001`)
   - Tu peux le trouver dans phpMyAdmin avec la requête ci-dessus

3. **Clique sur "Accéder à mon dashboard"**

4. **Tu devrais voir** le dashboard avec toutes les candidatures du candidat

### Étape 4: Tester la création de candidature

1. **Va sur** http://localhost:5173/concours

2. **Choisis un concours** et crée une nouvelle candidature

3. **Remplis le formulaire** complètement

4. **Soumets**

5. **Vérifie** que:
   - Un NIPCAN est généré (si nouveau candidat)
   - Un NUPCAN est généré
   - Un USERNAME est généré
   - Tu es redirigé vers le dashboard

## 🔍 En cas de problème

### Erreur 500 sur `/api/candidats/nipcan/XXX/dashboard`

**Cause**: La colonne `nipcan` n'existe pas dans la table `candidats`

**Solution**: Exécute le script SQL de l'Étape 1

### Erreur "Column 'nipcan' doesn't exist"

**Cause**: Le script SQL n'a pas été exécuté ou a échoué

**Solution**: 
1. Vérifie dans phpMyAdmin que la colonne existe:
   ```sql
   SHOW COLUMNS FROM candidats;
   ```
2. Si elle n'existe pas, exécute manuellement:
   ```sql
   ALTER TABLE `candidats` ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL;
   ```

### Erreur "Table 'nipcan_counters' doesn't exist"

**Cause**: La table n'a pas été créée

**Solution**: Exécute dans phpMyAdmin:
```sql
CREATE TABLE `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO `nipcan_counters` (`year`, `counter`) VALUES (2025, 1), (2026, 1);
```

### Dashboard vide ou erreur

**Cause**: Aucune candidature trouvée pour ce NIPCAN

**Solution**: Vérifie dans phpMyAdmin:
```sql
SELECT * FROM candidats WHERE nipcan = 'NIP2025000001';
```

Si aucun résultat, le NIPCAN n'existe pas. Utilise un NIPCAN existant.

## 📝 Vérifications finales

Exécute ces requêtes dans phpMyAdmin pour tout vérifier:

```sql
-- 1. Vérifier les colonnes
SHOW COLUMNS FROM candidats;

-- 2. Vérifier les tables
SHOW TABLES LIKE '%nipcan%';

-- 3. Compter les candidats
SELECT 
  'Total' as type, COUNT(*) as nombre FROM candidats
UNION ALL
SELECT 
  'Avec NIPCAN' as type, COUNT(*) as nombre FROM candidats WHERE nipcan IS NOT NULL
UNION ALL
SELECT 
  'Avec USERNAME' as type, COUNT(*) as nombre FROM candidats WHERE username IS NOT NULL;

-- 4. Voir quelques exemples
SELECT id, nipcan, nupcan, username, nomcan, prncan FROM candidats LIMIT 5;
```

## ✅ Système fonctionnel

Quand tout marche, tu devrais pouvoir:

1. ✅ Te connecter avec un NIPCAN
2. ✅ Voir toutes tes candidatures dans le dashboard
3. ✅ Créer une nouvelle candidature (génère nouveau NUPCAN, garde le NIPCAN)
4. ✅ Voir les documents de chaque candidature
5. ✅ Naviguer entre les candidatures dans la sidebar

## 🆘 Besoin d'aide?

Si ça ne marche toujours pas:

1. **Montre-moi les logs du terminal backend** (là où tu as lancé `node server.js`)
2. **Exécute** `backend/scripts/VERIFIER_BD.sql` dans phpMyAdmin et montre-moi le résultat
3. **Dis-moi** quelle erreur exacte tu vois (copie-colle le message complet)
