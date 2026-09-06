# Corrections de l'affichage des documents dans le dashboard

## Problème identifié
Le backend récupérait correctement les documents (logs confirmaient "📄 Documents pour NUPCAN 20260403-3: 4 total, 0 valides"), mais le frontend ne les affichait pas dans le dashboard.

## Cause du problème
L'interface TypeScript `Candidature` dans `DashboardNipcan.tsx` ne contenait pas les champs `documents_count` et `documents_valides` que le backend envoyait dans la réponse API.

## Corrections apportées

### 1. Mise à jour de l'interface TypeScript
**Fichier**: `frontend/src/pages/candidat/DashboardNipcan.tsx`

Ajout des champs manquants dans l'interface `Candidature`:
```typescript
interface Candidature {
    nupcan: string;
    concours: { ... };
    filiere: { ... };
    statut: string;
    progression: number;
    created_at: string;
    // ✅ NOUVEAUX CHAMPS AJOUTÉS
    documents_count: number;
    documents_valides: number;
    paiement_statut: string | null;
    etapes: {
        inscription: boolean;
        documents: boolean;
        paiement: boolean;
        resultats: boolean;
    };
}
```

### 2. Affichage dans la vue détaillée (onglet Candidatures)
Ajout d'une nouvelle grille pour afficher les documents et le paiement:
```tsx
<div className="grid grid-cols-2 gap-4">
    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <FileText className="h-5 w-5 text-blue-600" />
        <div>
            <p className="text-xs text-gray-600">Documents</p>
            <p className="font-semibold text-sm">
                {currentCandidature.documents_valides || 0} / {currentCandidature.documents_count || 0} validés
            </p>
        </div>
    </div>
    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <CreditCard className="h-5 w-5 text-green-600" />
        <div>
            <p className="text-xs text-gray-600">Paiement</p>
            <p className="font-semibold text-sm">
                {currentCandidature.paiement_statut || 'Non payé'}
            </p>
        </div>
    </div>
</div>
```

### 3. Affichage dans la vue d'ensemble (onglet Overview)
Ajout d'informations compactes sous chaque candidature récente:
```tsx
<div className="flex items-center gap-4 ml-6 mt-2">
    <div className="flex items-center gap-1 text-xs">
        <FileText className="h-3 w-3 text-blue-600" />
        <span className="text-gray-600">
            Documents: <span className="font-semibold text-blue-600">
                {candidature.documents_valides || 0}/{candidature.documents_count || 0}
            </span>
        </span>
    </div>
    <div className="flex items-center gap-1 text-xs">
        <CreditCard className="h-3 w-3 text-green-600" />
        <span className="text-gray-600">
            Paiement: <span className="font-semibold">
                {candidature.paiement_statut || 'Non payé'}
            </span>
        </span>
    </div>
</div>
```

## Résultat
✅ Le dashboard affiche maintenant correctement:
- Le nombre de documents téléversés (ex: 4 total)
- Le nombre de documents validés (ex: 0 validés)
- Le statut du paiement
- Ces informations sont visibles dans les deux vues (Overview et Candidatures)

## Structure des données API
Le backend envoie pour chaque candidature:
```json
{
    "nupcan": "20260403-3",
    "documents_count": 4,
    "documents_valides": 0,
    "paiement_statut": null,
    "etapes": {
        "inscription": true,
        "documents": false,
        "paiement": false,
        "resultats": false
    },
    "progression": 25,
    "statut": "en_cours",
    ...
}
```

## Test
Pour tester:
1. Se connecter avec un NIPCAN (ex: NIP2026000001)
2. Vérifier que le dashboard affiche le compteur de documents pour chaque candidature
3. Cliquer sur une candidature pour voir les détails avec les cartes colorées
4. Les documents devraient s'afficher comme "0 / 4 validés" si 4 documents ont été téléversés mais aucun validé

## Fichiers modifiés
- ✅ `frontend/src/pages/candidat/DashboardNipcan.tsx` - Interface et affichage mis à jour
