# 📋 Instructions de Test - Correction Documents Dashboard

## 🔄 Étapes de Redémarrage

### 1. Arrêter le Serveur Backend

Si le serveur backend est en cours d'exécution, arrêtez-le:

```bash
# Dans le terminal du backend
Ctrl + C
```

### 2. Redémarrer le Serveur Backend

```bash
cd backend
npm start
```

Attendez le message:
```
✅ Serveur démarré sur le port 3001
✅ Base de données connectée
```

### 3. Vérifier le Frontend

Le frontend devrait déjà être en cours d'exécution. Si ce n'est pas le cas:

```bash
cd frontend
npm run dev
```

---

## 🧪 Scénario de Test Complet

### Préparation

1. Ouvrir la console du navigateur (F12)
2. Ouvrir la console du serveur backend
3. Avoir un candidat avec un NIPCAN valide (ex: `NIP2026000001`)

### Test 1: Upload de Documents

#### Étape 1: Connexion au Dashboard

1. Aller sur `http://localhost:8001/connexion`
2. Entrer le NIPCAN: `NIP2026000001`
3. Cliquer sur "Se connecter"
4. ✅ **Vérifier:** Redirection vers le dashboard

#### Étape 2: Accéder à la Page Documents

1. Dans le dashboard, cliquer sur "Gérer documents" pour une candidature
2. ✅ **Vérifier:** Redirection vers `/documents/NUP2026000001`
3. ✅ **Vérifier:** Page documents s'affiche correctement

#### Étape 3: Téléverser des Documents

1. Cliquer sur "Upload" pour un document obligatoire (ex: CNI)
2. Sélectionner un fichier PDF ou image
3. ✅ **Vérifier:** Toast de confirmation "Document ajouté"
4. ✅ **Vérifier:** Fichier apparaît dans la liste avec une coche verte
5. Répéter pour au moins 2-3 documents obligatoires

#### Étape 4: Enregistrer et Continuer

1. Cliquer sur "Enregistrer et continuer"
2. ✅ **Vérifier:** Message "Enregistrement..." apparaît
3. ✅ **Vérifier:** Message "Documents enregistrés avec succès"
4. ✅ **Vérifier:** Message "Redirection vers votre tableau de bord..."

#### Étape 5: Vérification Dashboard

1. Attendre la redirection automatique (1.5 secondes)
2. ✅ **Vérifier:** Retour au dashboard
3. ✅ **Vérifier:** Les documents apparaissent immédiatement
4. ✅ **Vérifier:** Le compteur de documents est mis à jour
5. ✅ **Vérifier:** La progression est recalculée

---

## 📊 Logs à Vérifier

### Console Frontend (Navigateur)

Après l'upload, vous devriez voir:

```
📎 Ajout fichier: CNI.pdf pour Carte Nationale d'Identité
📤 Envoi de 3 fichier(s) au serveur
✅ Documents enregistrés !
🔄 Rechargement candidature...
➡️ Redirection vers dashboard avec refresh=true
```

Après la redirection:

```
🔍 Détection paramètre refresh=true
📊 Récupération dashboard pour NIPCAN: NIP2026000001
✅ Dashboard récupéré: 1 candidature(s)
🧹 Nettoyage paramètre refresh de l'URL
```

### Console Backend (Serveur)

Pendant l'upload:

```
📥 Requête reçue - Body: { concours_id: '1', nupcan: 'NUP2026000001' }
📁 Fichiers reçus: 3 fichier(s)
🔍 Recherche candidat avec NUPCAN: NUP2026000001
✅ Candidat trouvé - ID: 123
📄 Traitement de 3 document(s)...
  📄 Document 1: CNI.pdf - documents-1234567890.pdf
  ✅ Document créé - ID: 456
  ✅ Dossier créé - ID: 789
✅ Tous les documents enregistrés avec succès!
```

Pendant le rechargement du dashboard:

```
📊 Récupération dashboard pour NIPCAN: NIP2026000001
✅ Trouvé 1 candidature(s) pour NIPCAN NIP2026000001
  📄 Documents pour NUPCAN NUP2026000001: 3 total, 0 valides
✅ Dashboard récupéré: 1 candidature(s)
```

---

## ✅ Critères de Succès

### Affichage des Documents

- [ ] Les documents apparaissent dans le dashboard sans refresh manuel
- [ ] Le compteur "X documents" est correct
- [ ] Les documents ont le statut "en_attente" (badge jaune)
- [ ] Les noms de fichiers sont affichés correctement

### Progression

- [ ] La barre de progression se met à jour
- [ ] Le pourcentage de progression augmente
- [ ] L'étape "Documents" est marquée comme complète (si tous les docs obligatoires sont uploadés)

### Expérience Utilisateur

- [ ] Pas besoin de rafraîchir manuellement (F5)
- [ ] Transition fluide entre les pages
- [ ] Messages de confirmation clairs
- [ ] Pas d'erreurs dans la console

---

## ❌ Problèmes Potentiels

### Problème 1: Documents Toujours à 0

**Symptôme:** Le compteur reste à 0 même après upload

**Causes possibles:**
1. Serveur backend pas redémarré
2. Erreur SQL dans la requête
3. Colonne `nipcan` dans `dossiers` contient autre chose que le NUPCAN

**Solution:**
```bash
# Redémarrer le backend
cd backend
npm start

# Vérifier la base de données
mysql -u root -p
USE gabconcoursv5;
SELECT dos.nipcan, c.nupcan, c.nipcan, d.nomdoc 
FROM dossiers dos
LEFT JOIN candidats c ON dos.candidat_id = c.id
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan = 'NIP2026000001';
```

### Problème 2: Erreur 500 sur le Dashboard

**Symptôme:** Erreur serveur lors du chargement du dashboard

**Causes possibles:**
1. Erreur SQL dans la requête
2. Colonne manquante dans la base de données
3. Problème de connexion à la base

**Solution:**
```bash
# Vérifier les logs du serveur backend
# Chercher les messages d'erreur SQL
```

### Problème 3: Redirection Infinie

**Symptôme:** La page se recharge en boucle

**Causes possibles:**
1. Le paramètre `refresh=true` n'est pas nettoyé
2. Erreur dans le useEffect du dashboard

**Solution:**
Vérifier que le code suivant est présent dans `DashboardNipcan.tsx`:

```typescript
useEffect(() => {
    if (searchParams.get('refresh') === 'true' && actualNipcan) {
        loadDashboardData();
        // Nettoyer le paramètre refresh de l'URL
        navigate(window.location.pathname, { replace: true });
    }
}, [searchParams, actualNipcan, loadDashboardData, navigate]);
```

---

## 🔍 Vérification Base de Données

### Requête 1: Vérifier les Documents Uploadés

```sql
SELECT 
    dos.id as dossier_id,
    dos.nipcan as nupcan_stocke,
    c.nipcan as nipcan_candidat,
    c.nupcan as nupcan_candidat,
    d.id as document_id,
    d.nomdoc,
    d.type,
    d.nom_fichier,
    d.statut,
    d.created_at
FROM dossiers dos
LEFT JOIN candidats c ON dos.candidat_id = c.id
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan = 'NIP2026000001'
ORDER BY d.created_at DESC;
```

**Résultat attendu:**

| dossier_id | nupcan_stocke | nipcan_candidat | nupcan_candidat | document_id | nomdoc      | type  | nom_fichier           | statut     | created_at          |
|------------|---------------|-----------------|-----------------|-------------|-------------|-------|-----------------------|------------|---------------------|
| 1          | NUP2026000001 | NIP2026000001   | NUP2026000001   | 1           | CNI.pdf     | pdf   | documents-123456.pdf  | en_attente | 2026-04-03 10:30:00 |
| 2          | NUP2026000001 | NIP2026000001   | NUP2026000001   | 2           | Diplome.pdf | pdf   | documents-123457.pdf  | en_attente | 2026-04-03 10:30:05 |

### Requête 2: Compter les Documents par Candidat

```sql
SELECT 
    c.nipcan,
    c.nupcan,
    COUNT(DISTINCT d.id) as total_documents,
    SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as documents_valides,
    SUM(CASE WHEN d.statut = 'en_attente' THEN 1 ELSE 0 END) as documents_en_attente
FROM candidats c
LEFT JOIN dossiers dos ON dos.nipcan = c.nupcan
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan = 'NIP2026000001'
GROUP BY c.nipcan, c.nupcan;
```

**Résultat attendu:**

| nipcan        | nupcan        | total_documents | documents_valides | documents_en_attente |
|---------------|---------------|-----------------|-------------------|----------------------|
| NIP2026000001 | NUP2026000001 | 3               | 0                 | 3                    |

---

## 📞 Support

Si les tests échouent après avoir suivi toutes ces étapes:

1. Vérifier que le serveur backend a bien été redémarré
2. Vérifier les logs de la console (frontend et backend)
3. Vérifier la base de données avec les requêtes SQL ci-dessus
4. Consulter le fichier `FIX_DOCUMENTS_DASHBOARD_FINAL.md` pour plus de détails

---

**Date:** 3 avril 2026  
**Version:** 1.0  
**Statut:** ✅ Prêt pour les tests
