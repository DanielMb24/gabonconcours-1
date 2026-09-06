# Guide d'Installation Simple - Multi-Candidature

## 🚀 Installation Rapide

### Étape 1: Sauvegarde (IMPORTANT!)

Avant toute chose, faites une sauvegarde de votre base de données:

**Via phpMyAdmin:**
1. Sélectionner la base `gabconcoursv5`
2. Cliquer sur "Exporter"
3. Cliquer sur "Exécuter"
4. Sauvegarder le fichier `.sql`

**Via ligne de commande:**
```bash
mysqldump -u root -p gabconcoursv5 > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Étape 2: Exécuter le Script

**Méthode 1: Via phpMyAdmin (Recommandé)**

1. Ouvrir phpMyAdmin
2. Sélectionner la base de données `gabconcoursv5`
3. Cliquer sur l'onglet "SQL"
4. Ouvrir le fichier `backend/scripts/update-simple.sql`
5. Copier tout le contenu
6. Coller dans la zone de texte SQL
7. Cliquer sur "Exécuter"

**Méthode 2: Via ligne de commande**

```bash
cd backend/scripts
mysql -u root -p gabconcoursv5 < update-simple.sql
```

### Étape 3: Vérification

Après l'exécution, vérifiez que tout s'est bien passé:

```sql
-- Vérifier les nouvelles tables
SHOW TABLES LIKE 'candidat%';

-- Doit afficher:
-- candidat_activities
-- candidat_auth
-- candidat_login_history
-- candidat_preferences
-- candidat_sessions

-- Vérifier les nouvelles colonnes dans candidats
DESCRIBE candidats;

-- Doit inclure: password, last_login, email_verified
```

## ⚠️ En cas de problème

### Si vous avez des erreurs

**Erreur: "Column already exists"**
- C'est normal si vous avez déjà exécuté le script
- Vous pouvez ignorer cette erreur

**Erreur: "Table already exists"**
- Les tables ont déjà été créées
- Vous pouvez ignorer cette erreur

**Erreur: "Duplicate key"**
- Un index existe déjà
- Vous pouvez ignorer cette erreur

### Rollback (Annuler les modifications)

Si vous voulez annuler toutes les modifications:

```bash
mysql -u root -p gabconcoursv5 < backend/scripts/rollback-multi-candidature.sql
```

Puis restaurer votre sauvegarde:

```bash
mysql -u root -p gabconcoursv5 < backup_YYYYMMDD_HHMMSS.sql
```

## ✅ Après l'installation

### 1. Démarrer les serveurs

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Tester le dashboard

```
URL: http://localhost:5173/dashboard/NIP2026000001

Remplacer NIP2026000001 par un NIPCAN existant dans votre base
```

### 3. Vérifier les données

```sql
-- Voir les NIPCAN générés
SELECT id, nipcan, nupcan, nomcan, prncan 
FROM candidats 
LIMIT 10;

-- Voir les candidatures par NIPCAN
SELECT nipcan, COUNT(*) as nb_candidatures
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY nipcan;
```

## 📊 Ce qui a été ajouté

### Nouvelles Tables (5)
- ✅ `candidat_sessions` - Sessions d'authentification
- ✅ `candidat_auth` - Mots de passe et sécurité
- ✅ `candidat_login_history` - Historique connexions
- ✅ `candidat_preferences` - Préférences utilisateur
- ✅ `candidat_activities` - Fil d'activités

### Colonnes Ajoutées

**Dans `candidats`:**
- `password` - Mot de passe hashé
- `last_login` - Dernière connexion
- `email_verified` - Email vérifié

**Dans `candidatures`:**
- `nipcan` - NIPCAN du candidat
- `etape_actuelle` - Étape actuelle
- `documents_valides` - Nombre docs validés
- `documents_total` - Nombre docs total
- `paiement_statut` - Statut paiement
- `notes_disponibles` - Notes disponibles

**Dans `paiements`:**
- `nipcan` - NIPCAN du candidat

### Index Créés
- Index unique sur `candidats.nipcan`
- Index sur `candidatures.nipcan`
- Index sur `paiements.nipcan`
- Index composites pour performance

## 🎯 Prochaines Étapes

1. ✅ Base de données mise à jour
2. ⏳ Implémenter l'authentification NIPCAN
3. ⏳ Tester le dashboard multi-candidatures
4. ⏳ Créer le système de connexion

## 📞 Support

En cas de problème:
1. Vérifier les logs MySQL
2. Consulter le fichier `GUIDE_MISE_A_JOUR_BD.md` pour plus de détails
3. Utiliser le script de rollback si nécessaire

---

**Version**: 1.0  
**Date**: 22 Février 2026  
**Fichiers**: 
- `backend/scripts/update-simple.sql` (Installation)
- `backend/scripts/rollback-multi-candidature.sql` (Rollback)
