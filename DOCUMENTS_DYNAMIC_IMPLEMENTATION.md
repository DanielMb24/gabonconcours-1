# Implémentation des Documents Dynamiques

## Modifications à apporter à `frontend/src/pages/Documents.tsx`

### 1. Récupérer les documents requis du concours

Ajouter après la récupération de `candidatureData`:

```typescript
// Récupérer le concours avec ses documents requis
const { data: concoursData } = useQuery({
    queryKey: ['concours', candidatureData?.concours?.id],
    queryFn: async () => {
        if (!candidatureData?.concours?.id) return null;
        const response = await apiService.getConcoursById(candidatureData.concours.id.toString());
        return response.data;
    },
    enabled: !!candidatureData?.concours?.id
});

const concours = concoursData;
const documentsRequis = concours?.documents_requis || [];
```

### 2. Créer les options de documents dynamiques

Remplacer la constante `documentOptions` statique par:

```typescript
// Créer les options de documents à partir des données du concours
const documentOptions: DocumentOption[] = useMemo(() => {
    if (!documentsRequis || documentsRequis.length === 0) {
        // Fallback vers les documents par défaut si aucun n'est défini
        return [
            {value: 'cni', label: 'Carte Nationale d\'Identité', required: true, description: ''},
            {value: 'diplome', label: 'Diplôme ou Attestation', required: true, description: ''},
            {value: 'certificat_medical', label: 'Certificat médical', required: true, description: ''},
            {value: 'acte_naissance', label: 'Acte de naissance', required: true, description: ''},
        ];
    }
    
    return documentsRequis.map((doc: any) => ({
        value: doc.nom.toLowerCase().replace(/['\s]+/g, '_'),
        label: doc.nom,
        required: doc.obligatoire,
        description: doc.description || ''
    }));
}, [documentsRequis]);
```

### 3. Séparer documents obligatoires et optionnels

```typescript
const requiredDocs = useMemo(() => 
    documentOptions.filter(doc => doc.required), 
    [documentOptions]
);

const optionalDocs = useMemo(() => 
    documentOptions.filter(doc => !doc.required), 
    [documentOptions]
);
```

### 4. Calculer la progression sur les obligatoires uniquement

```typescript
const uploadedRequiredDocs = useMemo(() => 
    Array.from(uploadedDocuments.values()).filter(doc => doc.required),
    [uploadedDocuments]
);

const progress = requiredDocs.length > 0 
    ? (uploadedRequiredDocs.length / requiredDocs.length) * 100 
    : 0;
```

### 5. Mettre à jour l'interface utilisateur

```tsx
<Card>
    <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Dépôt des Documents de Candidature</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                    {concours?.libcnc && `Concours: ${concours.libcnc}`}
                </p>
            </div>
            <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                    {uploadedRequiredDocs.length}/{requiredDocs.length}
                </div>
                <p className="text-xs text-muted-foreground">
                    Documents obligatoires
                </p>
            </div>
        </div>
    </CardHeader>
    <CardContent>
        <Progress value={progress} className="mb-6" />
        
        {/* Documents obligatoires */}
        {requiredDocs.length > 0 && (
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Documents Obligatoires ({uploadedRequiredDocs.length}/{requiredDocs.length})
                </h3>
                <div className="space-y-3">
                    {requiredDocs.map((doc) => (
                        <DocumentCard
                            key={doc.value}
                            document={doc}
                            uploaded={uploadedDocuments.has(doc.value)}
                            onUpload={() => handleUploadClick(doc.value)}
                            onRemove={() => handleRemoveDocument(doc.value)}
                        />
                    ))}
                </div>
            </div>
        )}
        
        {/* Documents optionnels */}
        {optionalDocs.length > 0 && (
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Documents Optionnels (Recommandés)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Ces documents ne sont pas obligatoires mais peuvent renforcer votre dossier.
                </p>
                <div className="space-y-3">
                    {optionalDocs.map((doc) => (
                        <DocumentCard
                            key={doc.value}
                            document={doc}
                            uploaded={uploadedDocuments.has(doc.value)}
                            onUpload={() => handleUploadClick(doc.value)}
                            onRemove={() => handleRemoveDocument(doc.value)}
                        />
                    ))}
                </div>
            </div>
        )}
        
        {/* Consignes d'upload */}
        <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
                <h4 className="font-semibold mb-2 text-blue-900">📋 Consignes d'Upload</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Formats acceptés: PDF, JPEG, PNG</li>
                    <li>• Taille maximale: 5 Mo par fichier</li>
                    <li>• Documents lisibles et de bonne qualité</li>
                    <li>• Tous les documents obligatoires sont requis</li>
                </ul>
            </CardContent>
        </Card>
    </CardContent>
</Card>
```

### 6. Créer le composant DocumentCard

```tsx
interface DocumentCardProps {
    document: DocumentOption;
    uploaded: boolean;
    onUpload: () => void;
    onRemove: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    uploaded,
    onUpload,
    onRemove
}) => {
    return (
        <Card className={`transition-all ${uploaded ? 'border-green-500 bg-green-50' : 'hover:shadow-md'}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className={`h-5 w-5 ${uploaded ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className="font-medium">
                                {document.label}
                                {document.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                )}
                            </span>
                        </div>
                        {document.description && (
                            <p className="text-sm text-muted-foreground ml-7">
                                {document.description}
                            </p>
                        )}
                        {!document.required && (
                            <span className="text-xs text-blue-600 ml-7">Optionnel</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {uploaded ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRemove}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <Button onClick={onUpload} size="sm">
                                <Upload className="h-4 w-4 mr-2" />
                                Téléverser
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
```

### 7. Mettre à jour le type DocumentOption

Dans `frontend/src/types/entities.ts`, ajouter le champ `description`:

```typescript
export interface DocumentOption {
    value: string;
    label: string;
    required: boolean;
    description?: string; // NOUVEAU
}
```

## Modifications Backend

### Mettre à jour l'appel email dans la route de création de candidature

Dans `backend/routes/candidats.js` (ou le fichier approprié), modifier l'appel à `sendRegistrationConfirmation`:

```javascript
// Récupérer le concours avec ses documents
const concours = await Concours.findById(candidat.concours_id);

// Envoyer l'email avec les informations du concours
await emailService.sendRegistrationConfirmation(candidat, concours);
```

## Résultat Attendu

### Email de confirmation
- ✅ Liste des documents obligatoires en rouge
- ✅ Liste des documents optionnels en bleu
- ✅ Description de chaque document
- ✅ Consignes d'upload
- ✅ Lien vers l'espace candidat

### Page Documents
- ✅ Affichage dynamique des documents du concours
- ✅ Séparation obligatoires/optionnels
- ✅ Progression calculée sur les obligatoires uniquement
- ✅ Description de chaque document
- ✅ Indicateur visuel (rouge pour obligatoire, bleu pour optionnel)
- ✅ Consignes d'upload visibles

## Tests

1. Créer un concours avec:
   - 3 documents obligatoires
   - 2 documents optionnels

2. Créer une candidature pour ce concours

3. Vérifier l'email:
   - Les 3 documents obligatoires sont listés en rouge
   - Les 2 documents optionnels sont listés en bleu
   - Les descriptions sont affichées

4. Accéder à la page Documents:
   - Les 5 documents s'affichent
   - Séparation claire obligatoires/optionnels
   - Progression sur 3 (pas 5)
   - Upload fonctionne pour tous

5. Uploader uniquement les 3 obligatoires:
   - Progression = 100%
   - Bouton "Continuer" activé
