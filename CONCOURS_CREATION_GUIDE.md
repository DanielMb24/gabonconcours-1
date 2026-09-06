# Guide de Création de Concours Multi-Étapes

## 1. Script SQL de Mise à Jour

Le script `backend/scripts/update-concours-table.sql` a été créé avec les modifications suivantes:

### Nouvelles colonnes ajoutées à la table `concours`:

```sql
- series_bac_acceptees JSON - Séries du baccalauréat acceptées
- documents_requis JSON - Liste des documents requis
- criteres_selection JSON - Critères de sélection
- modalites_inscription JSON - Modalités d'inscription
- date_publication_resultats DATE - Date de publication des résultats
- date_debut_cours DATE - Date de début des cours
- description_concours TEXT - Description détaillée
- conditions_eligibilite JSON - Conditions d'éligibilité
- informations_complementaires TEXT - Infos complémentaires
- contact_email VARCHAR(255) - Email de contact
- contact_telephone VARCHAR(50) - Téléphone de contact
- lieu_examen VARCHAR(255) - Lieu de l'examen
- type_concours ENUM - Type de concours (premiere_annee, master, doctorat, autre)
- nombre_places_total INT - Nombre total de places
- duree_formation VARCHAR(100) - Durée de la formation
- diplome_delivre VARCHAR(255) - Diplôme délivré
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

### Pour exécuter le script:

```bash
# Depuis le dossier backend
mysql -u votre_utilisateur -p votre_base_de_donnees < scripts/update-concours-table.sql
```

## 2. Formulaire Multi-Étapes

Le composant `CreateConcoursMultiStep.tsx` comprend 6 étapes:

### Étape 1: Informations de Base
- Nom du concours (libcnc)
- Établissement
- Niveau d'études
- Session
- Type de concours (première année, master, doctorat, autre)
- Description du concours

### Étape 2: Dates et Conditions
- Date de début des inscriptions
- Date de fin des inscriptions
- Âge limite
- Frais d'inscription
- Nombre total de places
- Durée de la formation
- Diplôme délivré
- Date de publication des résultats
- Date de début des cours

### Étape 3: Séries du Bac (uniquement pour première année)
- Sélection multiple des séries acceptées:
  - Série A
  - Série C
  - Série D
  - Série G
  - Série E
  - Série F

### Étape 4: Documents Requis
- Liste des documents avec:
  - Nom du document
  - Obligatoire (oui/non)
  - Description
- Possibilité d'ajouter/supprimer des documents
- Documents par défaut pré-remplis

### Étape 5: Critères de Sélection
- Liste des critères avec:
  - Nom du critère
  - Poids (pourcentage)
  - Description
- Possibilité d'ajouter/supprimer des critères
- Critères par défaut pré-remplis

### Étape 6: Modalités et Contacts
- Modalités d'inscription (étapes)
- Conditions d'éligibilité
- Email de contact
- Téléphone de contact
- Lieu de l'examen
- Informations complémentaires

## 3. Structure JSON des Données

### series_bac_acceptees
```json
["Série A", "Série C", "Série D", "Série G"]
```

### documents_requis
```json
[
  {
    "nom": "Acte de naissance",
    "obligatoire": true,
    "description": "Acte de naissance original ou copie certifiée"
  },
  {
    "nom": "Certificat de nationalité",
    "obligatoire": true,
    "description": "Certificat de nationalité gabonaise"
  }
]
```

### criteres_selection
```json
[
  {
    "critere": "Moyenne générale au Baccalauréat",
    "poids": 40,
    "description": "Note minimale requise: 12/20"
  },
  {
    "critere": "Notes dans les matières principales",
    "poids": 30,
    "description": "Mathématiques, Français, etc."
  }
]
```

### modalites_inscription
```json
[
  {
    "etape": 1,
    "titre": "Inscription en ligne",
    "description": "Créer un compte et remplir le formulaire"
  },
  {
    "etape": 2,
    "titre": "Paiement des frais",
    "description": "Payer les frais d'inscription"
  }
]
```

### conditions_eligibilite
```json
[
  {
    "condition": "Nationalité gabonaise",
    "obligatoire": true
  },
  {
    "condition": "Âge maximum respecté",
    "obligatoire": true
  }
]
```

## 4. Mise à Jour du Backend

### Modèle Concours (backend/models/Concours.js)

Ajouter les méthodes pour gérer les nouveaux champs JSON:

```javascript
static async create(data) {
    const connection = require('../config/database').getConnection();
    
    // Parser les champs JSON si nécessaire
    const series_bac = data.series_bac_acceptees ? 
        (typeof data.series_bac_acceptees === 'string' ? 
            data.series_bac_acceptees : 
            JSON.stringify(data.series_bac_acceptees)) : null;
    
    const documents = data.documents_requis ? 
        (typeof data.documents_requis === 'string' ? 
            data.documents_requis : 
            JSON.stringify(data.documents_requis)) : null;
    
    // ... autres champs JSON
    
    const [result] = await connection.execute(
        `INSERT INTO concours (
            libcnc, etablissement_id, niveau_id, sescnc, type_concours,
            description_concours, debcnc, fincnc, agecnc, fracnc,
            nombre_places_total, duree_formation, diplome_delivre,
            date_publication_resultats, date_debut_cours,
            series_bac_acceptees, documents_requis, criteres_selection,
            modalites_inscription, conditions_eligibilite,
            contact_email, contact_telephone, lieu_examen,
            informations_complementaires, stacnc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.libcnc, data.etablissement_id, data.niveau_id, data.sescnc,
            data.type_concours, data.description_concours, data.debcnc,
            data.fincnc, data.agecnc, data.fracnc, data.nombre_places_total,
            data.duree_formation, data.diplome_delivre,
            data.date_publication_resultats, data.date_debut_cours,
            series_bac, documents, criteres, modalites, conditions,
            data.contact_email, data.contact_telephone, data.lieu_examen,
            data.informations_complementaires, data.stacnc || '1'
        ]
    );
    
    return result;
}
```

## 5. Mise à Jour de ConcoursDetails.tsx

Le composant a été mis à jour pour afficher toutes les nouvelles informations dans des onglets:

- Vue d'ensemble (avec séries du bac si première année)
- Filières et matières
- Documents requis
- Critères de sélection
- Calendrier

## 6. Intégration dans l'Interface Admin

Pour utiliser le nouveau formulaire, remplacer la modale simple par:

```tsx
import { CreateConcoursMultiStep } from '@/components/admin/CreateConcoursMultiStep';

// Dans votre composant admin
<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <CreateConcoursMultiStep 
      onClose={() => setShowCreateDialog(false)}
      onSuccess={() => {
        refetchConcours();
        setShowCreateDialog(false);
      }}
    />
  </DialogContent>
</Dialog>
```

## 7. Avantages de cette Approche

1. **Données complètes**: Toutes les informations nécessaires sont collectées
2. **Expérience utilisateur**: Formulaire divisé en étapes logiques
3. **Flexibilité**: Les admins peuvent personnaliser chaque aspect
4. **Validation**: Chaque étape peut être validée avant de passer à la suivante
5. **Réutilisabilité**: Les données JSON permettent une grande flexibilité
6. **Évolutivité**: Facile d'ajouter de nouveaux champs ou étapes

## 8. Prochaines Étapes

1. Exécuter le script SQL de mise à jour
2. Mettre à jour le modèle Concours.js
3. Compléter le composant CreateConcoursMultiStep.tsx
4. Tester la création de concours
5. Vérifier l'affichage dans ConcoursDetails.tsx
