# Guide de Test - Connexion Candidat

## 🧪 Tests à Effectuer

### Test 1 : Connexion avec NIPCAN Valide
1. Aller sur `/connexion`
2. Saisir un NIPCAN existant (ex: `NIP2026000001`)
3. Cliquer sur "Accéder à mon dashboard"
4. ✅ Vérifier : Redirection vers dashboard avec données

### Test 2 : NIPCAN Invalide (Format)
1. Saisir `NIP123` (trop court)
2. ✅ Vérifier : Message d'erreur format
3. Saisir `ABC2026000001` (ne commence pas par NIP)
4. ✅ Vérifier : Message d'erreur format

### Test 3 : NIPCAN Inexistant
1. Saisir `NIP9999999999`
2. ✅ Vérifier : Message "NIPCAN introuvable"

### Test 4 : Dashboard Sans Candidature
1. Se connecter avec un NIPCAN sans candidature
2. ✅ Vérifier : Écran d'accueil avec bouton "Créer"
3. ✅ Vérifier : Statistiques à 0

### Test 5 : Dashboard Avec Candidatures
1. Se connecter avec un NIPCAN ayant des candidatures
2. ✅ Vérifier : Liste des candidatures
3. ✅ Vérifier : Statistiques correctes
4. ✅ Vérifier : Navigation sidebar

## 🔧 Commandes de Test

```bash
# Démarrer le backend
cd backend
npm start

# Démarrer le frontend
cd frontend
npm run dev
```

## ✅ Checklist Complète
- [ ] Format NIPCAN validé
- [ ] Vérification existence backend
- [ ] Messages d'erreur clairs
- [ ] Dashboard sans candidature
- [ ] Dashboard avec candidatures
- [ ] Navigation fluide
- [ ] Déconnexion fonctionne
