# Guide de Mise à Jour de la Base de Données

## 📋 Objectif
Mettre à jour la base de données `gabconcoursv5` pour supporter le système multi-candidature avec authentification NIPCAN.

## ⚠️ IMPORTANT - Avant de commencer

### 1. Sauvegarde de la Base de Données
```bash
# Créer une sauvegarde complète
mysqldump -u root -p gabconcoursv5 > backup_gabconcoursv5_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Vérifier la version de MySQL
```sql
SELECT VERSION();
-- Doit être >= 5.7 pour supporter JSON et les triggers avancés
```

## 🚀 Exécution du Script

### Méthode 1: Via phpMyAdmin
1. Ouvrir phpMyAdmin
2. Sélectionner la base de données `gabconcoursv5`
3. Aller dans l'onglet "SQL"
4. Copier-coller le contenu de `backend/scripts/update-multi-candidature.sql`
5. Cliquer sur "Exécuter"

### Méthode 2: Via ligne de commande
```bash
# Se placer dans le dossier backend/scripts
cd backend/scripts

# Exécuter le script
mysql -u root -p gabconcoursv5 < update-multi-candidature.sql
```

### Méthode 3: Via MySQL Workbench
1. Ouvrir MySQL Workbench
2. Se connecter à la base de données
3. File > Open SQL Script
4. Sélectionner `update-multi-candidature.sql`
5. Exécuter le script (⚡ icône)

## 📊 Ce qui sera créé/modifié

### Nouvelles Tables

#### 1. `candidat_sessions`
- Gestion des sessions d'authentification
- Stockage des tokens JWT
- Suivi des connexions actives

#### 2. `candidat_auth`
- Authentification des candidats
- Mots de passe hashés (bcrypt)
- Tokens de réinitialisation
- Protection contre les attaques brute-force

#### 3. `candidat_login_history`
- Historique des connexions
- Suivi des tentatives échouées
- Audit de sécurité

#### 4. `candidat_preferences`
- Préférences utilisateur
- Langue, thème, notifications
- Paramètres personnalisés

#### 5. `candidat_activities`
- Fil d'activités du candidat
- Historique des actions
- Notifications internes

### Tables Modifiées

#### `candidats`
- ✅ Ajout de `password` (VARCHAR 255)
- ✅ Ajout de `last_login` (TIMESTAMP)
- ✅ Ajout de `email_verified` (TINYINT)
- ✅ Index unique sur `nipcan`

#### `candidatures`
- ✅ Ajout de `nipcan` (VARCHAR 50)
- ✅ Ajout de `etape_actuelle` (ENUM)
- ✅ Ajout de `documents_valides` (INT)
- ✅ Ajout de `documents_total` (INT)
- ✅ Ajout de `paiement_statut` (ENUM)
- ✅ Ajout de `notes_disponibles` (TINYINT)

#### `paiements`
- ✅ Ajout de `nipcan` (VARCHAR 50) si manquant
- ✅ Index sur `nipcan`

### Vues Créées

#### `v_candidat_dashboard`
Vue complète pour le dashboard candidat avec:
- Informations personnelles
- Liste des candidatures
- Statistiques documents
- Statut paiement
- Progression calculée

### Procédures Stockées

#### `sp_get_candidat_dashboard(nipcan)`
Procédure pour récupérer toutes les données du dashboard en une seule requête:
- Infos candidat
- Liste candidatures
- Notifications non lues
- Activités récentes

### Triggers Créés

#### `after_candidat_insert_activity`
- Crée automatiquement une activité lors d'une nouvelle candidature

#### `after_document_validation_activity`
- Crée une activité lors de la validation/rejet d'un document

### Fonctions Créées

#### `generate_nipcan()`
- Génère un NIPCAN unique au format: NIP{ANNÉE}{NUMÉRO}
- Exemple: NIP2026000001

## ✅ Vérification Post-Installation

### 1. Vérifier les tables créées
```sql
SHOW TABLES LIKE 'candidat%';
-- Doit afficher: candidat_sessions, candidat_auth, candidat_login_history, 
--                candidat_preferences, candidat_activities
```

### 2. Vérifier les colonnes ajoutées
```sql
DESCRIBE candidats;
-- Vérifier: password, last_login, email_verified

DESCRIBE candidatures;
-- Vérifier: nipcan, etape_actuelle, documents_valides, etc.
```

### 3. Vérifier la vue
```sql
SELECT * FROM v_candidat_dashboard LIMIT 1;
-- Doit retourner des données si des candidats existent
```

### 4. Tester la procédure stockée
```sql
-- Remplacer NIP2026000001 par un NIPCAN existant
CALL sp_get_candidat_dashboard('NIP2026000001');
```

### 5. Tester la fonction
```sql
SELECT generate_nipcan() as nouveau_nipcan;
-- Doit retourner un NIPCAN au format NIP2026XXXXXX
```

### 6. Vérifier les triggers
```sql
SHOW TRIGGERS WHERE `Table` = 'candidats';
SHOW TRIGGERS WHERE `Table` = 'documents';
```

## 🔧 Migration des Données Existantes

Le script migre automatiquement les données existantes:

### NIPCAN pour candidats existants
```sql
-- Vérifier que tous les candidats ont un NIPCAN
SELECT COUNT(*) as sans_nipcan 
FROM candidats 
WHERE nipcan IS NULL OR nipcan = '';
-- Doit retourner 0
```

### Format des NIPCAN générés
- Format: `NIP{ANNÉE}{NUMÉRO_SÉQUENTIEL}`
- Exemple: `NIP2026000001`, `NIP2026000002`, etc.

## 🐛 Résolution des Problèmes

### Erreur: "Table already exists"
```sql
-- Supprimer la table et réessayer
DROP TABLE IF EXISTS candidat_sessions;
-- Puis réexécuter le script
```

### Erreur: "Duplicate key"
```sql
-- Vérifier les doublons dans nipcan
SELECT nipcan, COUNT(*) as count 
FROM candidats 
GROUP BY nipcan 
HAVING count > 1;

-- Corriger les doublons manuellement
```

### Erreur: "Trigger already exists"
```sql
-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS after_candidat_insert_activity;
DROP TRIGGER IF EXISTS after_document_validation_activity;
-- Puis réexécuter le script
```

### Erreur: "View already exists"
```sql
-- Supprimer la vue
DROP VIEW IF EXISTS v_candidat_dashboard;
-- Puis réexécuter le script
```

## 📈 Performance

### Index créés pour optimiser les requêtes
- `idx_nipcan_unique` sur `candidats(nipcan)`
- `idx_candidats_nipcan_concours` sur `candidats(nipcan, concours_id)`
- `idx_dossiers_nipcan_document` sur `dossiers(nipcan, document_id)`
- `idx_notifications_nipcan_statut` sur `notifications(candidat_nupcan, statut)`

### Requêtes optimisées
La vue `v_candidat_dashboard` utilise des LEFT JOIN optimisés et des sous-requêtes indexées.

## 🔐 Sécurité

### Mots de passe
- Stockés avec bcrypt (hash)
- Jamais en clair dans la base
- Protection contre brute-force (tentatives limitées)

### Sessions
- Tokens JWT avec expiration
- Suivi des IP et user agents
- Révocation possible

### Audit
- Historique complet des connexions
- Traçabilité des actions
- Logs de sécurité

## 📝 Notes Importantes

1. **NIPCAN vs NUPCAN**
   - NIPCAN = Identifiant permanent du candidat (un seul par personne)
   - NUPCAN = Identifiant de candidature (plusieurs par candidat)

2. **Compatibilité**
   - Le script est compatible avec les données existantes
   - Aucune perte de données
   - Migration automatique des NIPCAN

3. **Rollback**
   - En cas de problème, restaurer la sauvegarde:
   ```bash
   mysql -u root -p gabconcoursv5 < backup_gabconcoursv5_YYYYMMDD_HHMMSS.sql
   ```

## ✨ Prochaines Étapes

Après l'exécution du script:

1. ✅ Tester les nouvelles routes backend
2. ✅ Implémenter l'authentification NIPCAN
3. ✅ Créer les pages frontend
4. ✅ Tester le flux complet

## 📞 Support

En cas de problème:
1. Vérifier les logs MySQL
2. Consulter la documentation MySQL
3. Vérifier les permissions de l'utilisateur MySQL
4. Contacter l'équipe de développement

---

**Date de création**: 2026-02-22  
**Version**: 1.0  
**Auteur**: Équipe GABConcours
