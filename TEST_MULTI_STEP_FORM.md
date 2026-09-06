# Test du Formulaire Multi-Étapes

## Corrections Effectuées

✅ **Problème des selects vides**: Corrigé
- Les requêtes utilisent maintenant `apiService.getEtablissements()` et `apiService.getNiveaux()`
- Ajout de messages de fallback si aucune donnée n'est disponible
- Meilleurs placeholders pour les selects

✅ **Erreurs TypeScript**: Résolues
- Interface `ConcoursFormData` complète avec tous les champs
- Import de `useQuery` ajouté

## Comment Tester

### 1. Redémarrer le serveur frontend

```bash
cd frontend
npm run dev
```

### 2. Vider le cache du navigateur

Appuyez sur `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)

### 3. Accéder à la page admin

Allez sur: `http://localhost:8080/admin/concours`

### 4. Cliquer sur "Ajouter un concours"

Vous devriez maintenant voir:

#### Étape 1: Informations de Base
- ✅ Nom du concours (input)
- ✅ Établissement (select avec liste des établissements)
- ✅ Niveau d'études (select avec liste des niveaux)
- ✅ Session (input)
- ✅ Type de concours (select: première année, master, doctorat, autre)
- ✅ Description (textarea)

#### Étape 2: Dates et Conditions
- Date de début des inscriptions
- Date de fin des inscriptions
- Date de publication des résultats
- Date de début des cours
- Âge limite
- Frais d'inscription
- Nombre de places total
- Durée de la formation
- Diplôme délivré

#### Étape 3: Séries du Bac (si première année sélectionné)
- Checkboxes pour les séries A, C, D, E, F, G

#### Étape 4: Documents Requis
- Liste dynamique avec 7 documents par défaut
- Boutons pour ajouter/supprimer

#### Étape 5: Critères de Sélection
- Liste dynamique avec 4 critères par défaut
- Validation du total des poids (doit être 100%)

#### Étape 6: Modalités et Contacts
- Email de contact
- Téléphone de contact
- Lieu de l'examen
- Informations complémentaires

## Vérifications

### Les selects doivent afficher:

**Établissements:**
- Si vide: "Aucun établissement disponible"
- Sinon: Liste de tous les établissements (USS, UOB, etc.)

**Niveaux:**
- Si vide: "Aucun niveau disponible"
- Sinon: Liste de tous les niveaux (Licence 1, Master 1, etc.)

### Navigation

- ✅ Barre de progression en haut
- ✅ Bouton "Précédent" (sauf étape 1)
- ✅ Bouton "Suivant" (étapes 1-5)
- ✅ Bouton "Créer le concours" (étape 6)
- ✅ L'étape 3 est automatiquement sautée si type ≠ "première année"

## Si les selects sont toujours vides

### Vérifier dans la console du navigateur (F12):

1. Onglet "Network" (Réseau)
2. Chercher les requêtes vers `/etablissements` et `/niveaux`
3. Vérifier que les réponses contiennent des données

### Vérifier que le backend fonctionne:

```bash
# Test manuel
curl http://localhost:3000/api/etablissements
curl http://localhost:3000/api/niveaux
```

Les deux devraient retourner des données JSON.

## Données de Test

Pour créer un concours de test, utilisez:

- **Nom**: Concours Test USS 2025
- **Établissement**: Université des Sciences de la Santé
- **Niveau**: Licence 1
- **Session**: 2025-2026
- **Type**: Première année
- **Description**: Concours de test pour vérifier le formulaire

Puis remplissez les autres étapes et cliquez sur "Créer le concours".

## Résultat Attendu

Après la création:
1. Toast de succès "Le concours a été créé avec succès"
2. La modale se ferme automatiquement
3. Le nouveau concours apparaît dans la liste
4. En cliquant sur le concours dans la liste publique, toutes les données doivent s'afficher dans ConcoursDetails
