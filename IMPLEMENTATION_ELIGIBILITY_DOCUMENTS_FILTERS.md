# Implémentation: Éligibilité, Documents Dynamiques et Filtres

## Objectifs

1. **Vérifier les conditions d'éligibilité** lors de la création de candidature
2. **Afficher les documents requis spécifiques** à chaque concours (obligatoires et optionnels)
3. **Ajouter un filtre par série du bac** pour les concours de première année

---

## 1. Vérification des Conditions d'Éligibilité

### Modifications Backend

#### `backend/routes/concours.js`
Ajouter un endpoint pour vérifier l'éligibilité:

```javascript
// Vérifier l'éligibilité d'un candidat pour un concours
router.post('/:id/check-eligibility', async (req, res) => {
    try {
        const concoursId = req.params.id;
        const { age, serie_bac, nationalite } = req.body;
        
        const concours = await Concours.findById(concoursId);
        if (!concours) {
            return res.status(404).json({ error: 'Concours non trouvé' });
        }
        
        const errors = [];
        const warnings = [];
        
        // Vérifier l'âge
        if (concours.agecnc && age > concours.agecnc) {
            errors.push(`Âge maximum dépassé (${concours.agecnc} ans requis)`);
        }
        
        // Vérifier la série du bac pour les concours de première année
        if (concours.type_concours === 'premiere_annee' && concours.series_bac_acceptees) {
            const seriesAcceptees = concours.series_bac_acceptees;
            if (seriesAcceptees.length > 0 && !seriesAcceptees.includes(serie_bac)) {
                errors.push(`Série du bac non acceptée. Séries acceptées: ${seriesAcceptees.join(', ')}`);
            }
        }
        
        // Vérifier les conditions d'éligibilité obligatoires
        if (concours.conditions_eligibilite) {
            concours.conditions_eligibilite.forEach(condition => {
                if (condition.obligatoire) {
                    warnings.push(condition.condition);
                }
            });
        }
        
        res.json({
            eligible: errors.length === 0,
            errors,
            warnings,
            concours: {
                libcnc: concours.libcnc,
                agecnc: concours.agecnc,
                series_bac_acceptees: concours.series_bac_acceptees,
                conditions_eligibilite: concours.conditions_eligibilite
            }
        });
    } catch (error) {
        console.error('Erreur vérification éligibilité:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
```

### Modifications Frontend

#### `frontend/src/pages/Candidature.tsx`
Ajouter la vérification avant de permettre la candidature:

```typescript
// Ajouter un état pour l'éligibilité
const [eligibilityCheck, setEligibilityCheck] = useState<{
    checked: boolean;
    eligible: boolean;
    errors: string[];
    warnings: string[];
} | null>(null);

// Ajouter un champ pour la série du bac
const [serieBac, setSerieBac] = useState('');

// Fonction pour vérifier l'éligibilité
const checkEligibility = async () => {
    if (!candidat.dtncan || !concoursId) return;
    
    const age = calculateAge(candidat.dtncan);
    
    try {
        const response = await apiService.makeRequest(
            `/concours/${concoursId}/check-eligibility`,
            'POST',
            {
                age,
                serie_bac: serieBac,
                nationalite: 'gabonaise' // À adapter selon vos besoins
            }
        );
        
        setEligibilityCheck({
            checked: true,
            eligible: response.eligible,
            errors: response.errors || [],
            warnings: response.warnings || []
        });
        
        if (!response.eligible) {
            toast({
                title: 'Non éligible',
                description: response.errors.join(', '),
                variant: 'destructive'
            });
        }
    } catch (error) {
        console.error('Erreur vérification éligibilité:', error);
    }
};

// Vérifier l'éligibilité quand la date de naissance ou la série change
useEffect(() => {
    if (candidat.dtncan && concours?.type_concours === 'premiere_annee' && serieBac) {
        checkEligibility();
    } else if (candidat.dtncan && concours?.type_concours !== 'premiere_annee') {
        checkEligibility();
    }
}, [candidat.dtncan, serieBac]);
```

Ajouter le champ série du bac dans le formulaire:

```tsx
{concours?.type_concours === 'premiere_annee' && (
    <div>
        <Label htmlFor="serieBac">Série du Baccalauréat *</Label>
        <Select value={serieBac} onValueChange={setSerieBac}>
            <SelectTrigger>
                <SelectValue placeholder="Sélectionner votre série" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Série A">Série A</SelectItem>
                <SelectItem value="Série C">Série C</SelectItem>
                <SelectItem value="Série D">Série D</SelectItem>
                <SelectItem value="Série E">Série E</SelectItem>
                <SelectItem value="Série F">Série F</SelectItem>
                <SelectItem value="Série G">Série G</SelectItem>
            </SelectContent>
        </Select>
    </div>
)}

{/* Afficher les erreurs d'éligibilité */}
{eligibilityCheck && !eligibilityCheck.eligible && (
    <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
            <ul className="list-disc pl-4">
                {eligibilityCheck.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                ))}
            </ul>
        </AlertDescription>
    </Alert>
)}

{/* Afficher les conditions à respecter */}
{eligibilityCheck && eligibilityCheck.warnings.length > 0 && (
    <Alert>
        <AlertDescription>
            <p className="font-semibold mb-2">Conditions à respecter:</p>
            <ul className="list-disc pl-4">
                {eligibilityCheck.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                ))}
            </ul>
        </AlertDescription>
    </Alert>
)}
```

Bloquer la soumission si non éligible:

```tsx
<Button
    onClick={handleSubmit}
    disabled={
        candidatureLoading || 
        !eligibilityCheck?.eligible ||
        // autres conditions...
    }
>
    {eligibilityCheck?.eligible ? 'Continuer' : 'Non éligible'}
</Button>
```

---

## 2. Documents Requis Dynamiques

### Modifications Frontend

#### `frontend/src/pages/Documents.tsx`

Remplacer la liste statique par les documents du concours:

```typescript
const Documents = () => {
    const { numeroCandidature } = useParams();
    const { candidatureData } = useCandidature();
    
    // Récupérer les documents requis du concours
    const { data: concoursData } = useQuery({
        queryKey: ['concours', candidatureData?.concours?.id],
        queryFn: async () => {
            if (!candidatureData?.concours?.id) return null;
            return await apiService.getConcoursById(candidatureData.concours.id);
        },
        enabled: !!candidatureData?.concours?.id
    });
    
    const concours = concoursData?.data;
    const documentsRequis = concours?.documents_requis || [];
    
    // Créer les options de documents à partir des données du concours
    const documentOptions: DocumentOption[] = documentsRequis.map(doc => ({
        value: doc.nom.toLowerCase().replace(/\s+/g, '_'),
        label: doc.nom,
        required: doc.obligatoire,
        description: doc.description
    }));
    
    // Calculer la progression
    const requiredDocs = documentOptions.filter(doc => doc.required);
    const uploadedRequiredDocs = Array.from(uploadedDocuments.values())
        .filter(doc => doc.required);
    const progress = requiredDocs.length > 0 
        ? (uploadedRequiredDocs.length / requiredDocs.length) * 100 
        : 0;
    
    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Documents requis pour {concours?.libcnc}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {requiredDocs.length} documents obligatoires, 
                            {documentOptions.length - requiredDocs.length} documents optionnels
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Progress value={progress} className="mb-6" />
                        
                        {/* Documents obligatoires */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3">Documents obligatoires</h3>
                            <div className="space-y-3">
                                {documentOptions.filter(doc => doc.required).map(doc => (
                                    <DocumentUploadCard
                                        key={doc.value}
                                        document={doc}
                                        uploaded={uploadedDocuments.has(doc.value)}
                                        onUpload={() => handleUploadClick(doc.value)}
                                        onRemove={() => handleRemoveDocument(doc.value)}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        {/* Documents optionnels */}
                        {documentOptions.some(doc => !doc.required) && (
                            <div>
                                <h3 className="font-semibold mb-3">Documents optionnels</h3>
                                <div className="space-y-3">
                                    {documentOptions.filter(doc => !doc.required).map(doc => (
                                        <DocumentUploadCard
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
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};
```

Créer un composant pour afficher chaque document:

```typescript
interface DocumentUploadCardProps {
    document: DocumentOption;
    uploaded: boolean;
    onUpload: () => void;
    onRemove: () => void;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
    document,
    uploaded,
    onUpload,
    onRemove
}) => {
    return (
        <Card className={uploaded ? 'border-green-500' : ''}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <span className="font-medium">{document.label}</span>
                            {document.required && (
                                <span className="text-xs text-red-500">*</span>
                            )}
                        </div>
                        {document.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {document.description}
                            </p>
                        )}
                    </div>
                    <div>
                        {uploaded ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRemove}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
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

---

## 3. Filtre par Série du Bac

### Modifications Frontend

#### `frontend/src/pages/Concours.tsx`

Ajouter le filtre série du bac:

```typescript
const [filters, setFilters] = useState({
    search: '',
    etablissement: '',
    status: '',
    session: '',
    niveau: '',
    filiere: '',
    serieBac: '', // NOUVEAU
    minPrice: '',
    maxPrice: ''
});

// Filtrer les concours
const filteredConcours = concours.filter((c: any) => {
    // ... autres filtres existants ...
    
    // Filtre par série du bac (uniquement pour première année)
    if (filters.serieBac && c.type_concours === 'premiere_annee') {
        if (!c.series_bac_acceptees || !c.series_bac_acceptees.includes(filters.serieBac)) {
            return false;
        }
    }
    
    return true;
});
```

Ajouter le select dans l'interface:

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* ... autres filtres ... */}
    
    <div>
        <Label>Série du Bac</Label>
        <Select
            value={filters.serieBac}
            onValueChange={(value) => setFilters({ ...filters, serieBac: value })}
        >
            <SelectTrigger>
                <SelectValue placeholder="Toutes les séries" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="">Toutes les séries</SelectItem>
                <SelectItem value="Série A">Série A</SelectItem>
                <SelectItem value="Série C">Série C</SelectItem>
                <SelectItem value="Série D">Série D</SelectItem>
                <SelectItem value="Série E">Série E</SelectItem>
                <SelectItem value="Série F">Série F</SelectItem>
                <SelectItem value="Série G">Série G</SelectItem>
            </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
            Pour concours de 1ère année
        </p>
    </div>
</div>
```

---

## Résumé des Fichiers à Modifier

### Backend
1. ✅ `backend/routes/concours.js` - Ajouter endpoint `/check-eligibility`

### Frontend
1. ✅ `frontend/src/pages/Candidature.tsx` - Vérification éligibilité + champ série bac
2. ✅ `frontend/src/pages/Documents.tsx` - Documents dynamiques du concours
3. ✅ `frontend/src/pages/Concours.tsx` - Filtre par série du bac

### Types
1. ✅ Ajouter `description` à `DocumentOption` dans `frontend/src/types/entities.ts`

---

## Tests à Effectuer

1. **Éligibilité**:
   - Créer un concours avec âge limite 25 ans
   - Créer un concours première année avec séries A, C, D
   - Tenter de candidater avec âge > 25 → doit bloquer
   - Tenter de candidater avec série E → doit bloquer

2. **Documents**:
   - Créer un concours avec 3 docs obligatoires et 2 optionnels
   - Vérifier que seuls ces documents s'affichent
   - Vérifier que la progression se calcule sur les obligatoires uniquement

3. **Filtres**:
   - Créer plusieurs concours première année avec différentes séries
   - Filtrer par "Série C" → ne doit afficher que les concours acceptant série C
   - Vérifier que le filtre ne s'applique pas aux autres types de concours
