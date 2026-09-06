# Instructions pour voir le nouveau formulaire multi-étapes

## Le problème
L'ancienne modale simple s'affiche encore car le navigateur utilise une version en cache du code.

## Solution

### 1. Redémarrer le serveur de développement frontend

Dans votre terminal, allez dans le dossier frontend et redémarrez:

```bash
cd frontend
npm run dev
```

### 2. Vider le cache du navigateur

Une fois le serveur redémarré:

- **Chrome/Edge**: Appuyez sur `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- **Firefox**: Appuyez sur `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)

Ou manuellement:
1. Ouvrez les outils de développement (F12)
2. Faites un clic droit sur le bouton de rafraîchissement
3. Sélectionnez "Vider le cache et actualiser"

### 3. Vérifier que le nouveau formulaire s'affiche

Après le rechargement, quand vous cliquez sur "Ajouter un concours", vous devriez voir:

✅ Un formulaire avec 6 étapes au lieu d'une simple modale
✅ Une barre de progression en haut
✅ Des boutons "Précédent" et "Suivant"
✅ Étape 1: Informations de base
✅ Étape 2: Dates et conditions
✅ Étape 3: Séries du Bac (si première année)
✅ Étape 4: Documents requis
✅ Étape 5: Critères de sélection
✅ Étape 6: Modalités et contacts

## Modifications effectuées

Les fichiers suivants ont été mis à jour:

1. ✅ `frontend/src/components/admin/CreateConcoursMultiStep.tsx` - Formulaire multi-étapes créé
2. ✅ `frontend/src/pages/admin/Concours.tsx` - Intégration du nouveau formulaire
3. ✅ `backend/models/Concours.js` - Support des champs JSON
4. ✅ `backend/scripts/update-concours-table.sql` - Nouvelles colonnes ajoutées

## Si le problème persiste

Si après le redémarrage vous voyez toujours l'ancienne modale:

1. Vérifiez que vous êtes sur la bonne page: `http://localhost:8080/admin/concours`
2. Vérifiez la console du navigateur (F12) pour voir s'il y a des erreurs
3. Assurez-vous que le serveur frontend a bien redémarré sans erreurs
