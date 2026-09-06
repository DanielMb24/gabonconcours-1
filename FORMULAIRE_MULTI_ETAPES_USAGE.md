# Utilisation du Formulaire Multi-Étapes pour Créer un Concours

## Composant Créé

Le composant `CreateConcoursMultiStep.tsx` est maintenant complet avec **6 étapes**:

### Étape 1: Informations de Base
- Nom du concours
- Établissement (dropdown)
- Niveau d'études (dropdown)
- Session
- Type de concours (première année, master, doctorat, autre)
- Description

### Étape 2: Dates et Conditions
- Date de début des inscriptions
- Date de fin des inscriptions
- Date de publication des résultats
- Date de début des cours
- Âge limite
- Frais d'inscription (0 pour gratuit)
- Nombre de places total
- Durée de la formation
- Diplôme délivré

### Étape 3: Séries du Bac (uniquement si première année)
- Sélection multiple des séries acceptées
- Cette étape est automatiquement sautée si ce n'est pas un concours de première année

### Étape 4: Documents Requis
- Liste dynamique de documents
- Pour chaque document:
  - Nom
  - Description
  - Obligatoire (oui/non)
- Boutons pour ajouter/supprimer des documents
- Documents par défaut pré-remplis

### Étape 5: Critères de Sélection
- Liste dynamique de critères
- Pour chaque critère:
  - Nom du critère
  - Poids (pourcentage)
  - Description
- Validation du total des poids (doit être 100%)
- Boutons pour ajouter/supprimer des critères

### Étape 6: Modalités et Contacts
- Email de contact
- Téléphone de contact
- Lieu de l'examen
- Informations complémentaires

## Comment l'Intégrer

### Dans votre page admin (ex: GestionConcours.tsx)

```tsx
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateConcoursMultiStep from '@/components/admin/CreateConcoursMultiStep';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const GestionConcours = () => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const handleSuccess = () => {
        // Rafraîchir la liste des concours
        refetchConcours();
        setShowCreateDialog(false);
    };

    return (
        <div>
            {/* Bouton pour ouvrir le formulaire */}
            <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un concours
            </Button>

            {/* Dialog avec le formulaire multi-étapes */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <CreateConcoursMultiStep 
                        onClose={() => setShowCreateDialog(false)}
                        onSuccess={handleSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};
```

## Fonctionnalités

### Navigation Intelligente
- Barre de progression visuelle en haut
- Étapes complétées marquées avec une coche verte
- Étape active mise en surbrillance
- L'étape 3 (Séries du Bac) est automatiquement sautée si ce n'est pas un concours de première année

### Validation
- Champs requis marqués avec *
- Validation du total des poids des critères (doit être 100%)
- Messages d'erreur clairs

### Données Pré-remplies
- Documents par défaut (7 documents standards)
- Critères de sélection par défaut (4 critères avec poids)
- Modalités d'inscription par défaut (5 étapes)
- Conditions d'éligibilité par défaut (3 conditions)

### Soumission
- Conversion automatique des données en JSON
- Envoi à l'API `/concours` en POST
- Toast de succès/erreur
- Fermeture automatique après succès

## Avantages par Rapport à la Modale Simple

1. **Expérience utilisateur améliorée**: Formulaire divisé en étapes logiques
2. **Moins d'erreurs**: Validation à chaque étape
3. **Plus de données**: Collecte toutes les informations nécessaires
4. **Flexibilité**: Les admins peuvent personnaliser chaque aspect
5. **Visibilité**: Barre de progression claire
6. **Adaptabilité**: Étapes conditionnelles (séries du bac)

## Dépendances Requises

Assurez-vous d'avoir ces composants UI:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`
- `Input`, `Textarea`
- `Label`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Badge`
- `Checkbox`
- `Dialog`, `DialogContent`

## Prochaines Étapes

1. ✅ Exécuter le script SQL de mise à jour
2. ✅ Mettre à jour le modèle Concours.js
3. ✅ Créer le composant CreateConcoursMultiStep
4. 🔄 Intégrer dans la page admin
5. 🔄 Tester la création de concours
6. 🔄 Vérifier l'affichage dans ConcoursDetails

## Exemple de Données Envoyées

```json
{
  "libcnc": "Concours d'entrée à l'USS",
  "etablissement_id": "1",
  "niveau_id": "2",
  "sescnc": "2025-2026",
  "type_concours": "premiere_annee",
  "description_concours": "Concours pour l'admission en première année...",
  "debcnc": "2025-01-15",
  "fincnc": "2025-03-15",
  "agecnc": 25,
  "fracnc": 20000,
  "nombre_places_total": 100,
  "duree_formation": "3 ans",
  "diplome_delivre": "Licence",
  "date_publication_resultats": "2025-04-15",
  "date_debut_cours": "2025-09-01",
  "series_bac_acceptees": "[\"Série A\",\"Série C\",\"Série D\"]",
  "documents_requis": "[{\"nom\":\"Acte de naissance\",\"obligatoire\":true,\"description\":\"...\"}]",
  "criteres_selection": "[{\"critere\":\"Moyenne au Bac\",\"poids\":40,\"description\":\"...\"}]",
  "modalites_inscription": "[{\"etape\":1,\"titre\":\"Inscription en ligne\",\"description\":\"...\"}]",
  "conditions_eligibilite": "[{\"condition\":\"Nationalité gabonaise\",\"obligatoire\":true}]",
  "contact_email": "contact@uss.ga",
  "contact_telephone": "+241 XX XX XX XX",
  "lieu_examen": "Campus principal",
  "informations_complementaires": "Informations supplémentaires...",
  "stacnc": "1"
}
```
