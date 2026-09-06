# 🚨 ERREUR: "dos.nupcan inconnu" - SOLUTION ICI

## Le problème
```
Erreur: Champ 'dos.nupcan' inconnu dans where clause
```

## La solution (2 minutes)

### 1️⃣ Ouvre phpMyAdmin
http://localhost/phpmyadmin

### 2️⃣ Sélectionne la base
Clique sur `gabconcoursv5` dans la liste à gauche

### 3️⃣ Va dans SQL
Clique sur l'onglet **SQL** en haut

### 4️⃣ Exécute le script
Ouvre le fichier: **`backend/scripts/EXECUTE_MOI.sql`**

Copie TOUT le contenu et colle-le dans phpMyAdmin, puis clique sur **Exécuter**

**OU** copie-colle directement ce code:

```sql
-- Ajouter NIPCAN et USERNAME dans candidats
ALTER TABLE `candidats` ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;
ALTER TABLE `candidats` ADD COLUMN `username` VARCHAR(100) DEFAULT NULL AFTER `nipcan`;
ALTER TABLE `candidats` ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

-- Créer table compteurs
CREATE TABLE `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO `nipcan_counters` (`year`, `counter`) VALUES (2025, 1), (2026, 1);

-- Générer NIPCAN et USERNAME
UPDATE `candidats` 
SET `nipcan` = CONCAT('NIP', YEAR(COALESCE(created_at, NOW())), LPAD(id, 6, '0')),
    `username` = LOWER(CONCAT(SUBSTRING(nomcan, 1, 1), REPLACE(prncan, ' ', '')))
WHERE `nipcan` IS NULL OR `username` IS NULL;

-- 🔥 CRITIQUE: Ajouter NUPCAN dans dossiers et paiements
ALTER TABLE `dossiers` ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;
ALTER TABLE `dossiers` ADD INDEX `idx_nupcan_dossier` (`nupcan`);
ALTER TABLE `paiements` ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;
ALTER TABLE `paiements` ADD INDEX `idx_nupcan_paiement` (`nupcan`);

-- Copier les valeurs
UPDATE `dossiers` SET `nupcan` = `nipcan` WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;
UPDATE `paiements` SET `nupcan` = `nipcan` WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;
```

### 5️⃣ Redémarre le backend
Dans le terminal:
```bash
Ctrl+C
npm start
```

### 6️⃣ Teste
Va sur http://localhost:8001/connexion

Entre un NIPCAN (ex: `NIP2025000001`)

✅ Ça devrait marcher!

---

## 📚 Plus d'infos

- **SOLUTION_FINALE.md** - Guide complet avec explications
- **FIX_URGENT_README.md** - Guide rapide
- **INSTRUCTIONS_FINALES.md** - Instructions détaillées

## ❓ Ça ne marche toujours pas?

Copie-colle l'erreur exacte du terminal backend et montre-moi.
