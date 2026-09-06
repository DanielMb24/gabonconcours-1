# 🚨 FIX URGENT - Erreur "dos.nupcan inconnu"

## Le problème
L'erreur `Champ 'dos.nupcan' inconnu dans where clause` signifie que la colonne `nupcan` n'existe pas dans la table `dossiers`.

## La solution (3 étapes simples)

### ÉTAPE 1: Ouvre phpMyAdmin
1. Va sur http://localhost/phpmyadmin
2. Clique sur la base de données `gabconcoursv5` (à gauche)
3. Clique sur l'onglet **SQL** (en haut)

### ÉTAPE 2: Exécute ce script SQL

**Copie-colle ce code dans la zone SQL et clique sur "Exécuter":**

```sql
-- Ajouter nupcan dans dossiers
ALTER TABLE `dossiers` 
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `dossiers`
ADD INDEX `idx_nupcan_dossier` (`nupcan`);

-- Ajouter nupcan dans paiements
ALTER TABLE `paiements`
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `paiements`
ADD INDEX `idx_nupcan_paiement` (`nupcan`);

-- Copier les valeurs existantes
UPDATE `dossiers` 
SET `nupcan` = `nipcan` 
WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;

UPDATE `paiements` 
SET `nupcan` = `nipcan` 
WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;
```

**Note:** Si tu vois une erreur "Column already exists", c'est normal, ignore-la et continue.

### ÉTAPE 3: Redémarre le serveur backend

1. Dans le terminal où tourne le backend, appuie sur `Ctrl+C`
2. Relance avec: `npm start` ou `node server.js`

## Vérification

Pour vérifier que ça a marché, exécute dans phpMyAdmin:

```sql
SHOW COLUMNS FROM dossiers LIKE 'nupcan';
```

Tu devrais voir une ligne avec `nupcan` comme nom de colonne.

## Test final

1. Va sur http://localhost:8001/connexion (ou ton port frontend)
2. Entre un NIPCAN (ex: `NIP2025000001`)
3. Le dashboard devrait maintenant charger sans erreur

---

## Si tu as aussi besoin d'ajouter NIPCAN dans candidats

Si tu vois une erreur sur la table `candidats`, exécute aussi ce script:

```sql
-- Ajouter nipcan et username
ALTER TABLE `candidats` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;

ALTER TABLE `candidats`
ADD COLUMN `username` VARCHAR(100) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `candidats` 
ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

-- Créer table compteurs
CREATE TABLE `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO `nipcan_counters` (`year`, `counter`) VALUES (2025, 1), (2026, 1);

-- Générer NIPCAN et USERNAME
UPDATE `candidats` 
SET 
  `nipcan` = CONCAT('NIP', YEAR(COALESCE(created_at, NOW())), LPAD(id, 6, '0')),
  `username` = LOWER(CONCAT(SUBSTRING(nomcan, 1, 1), REPLACE(prncan, ' ', '')))
WHERE `nipcan` IS NULL OR `username` IS NULL;
```

---

## 📞 Besoin d'aide?

Si ça ne marche toujours pas:
1. Copie-colle l'erreur exacte que tu vois dans le terminal backend
2. Exécute dans phpMyAdmin: `SHOW COLUMNS FROM dossiers;` et montre-moi le résultat
