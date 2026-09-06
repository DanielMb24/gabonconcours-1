# Améliorations du Dashboard Candidat

## Problèmes identifiés

### 1. ✅ CORRIGÉ - Erreur 500 sur validation de documents
**Erreur**: `Champ 'dos.nipcan' inconnu dans field list`
**Cause**: La requête SQL utilisait `dos.nipcan` au lieu de `dos.nupcan`
**Solution**: Correction dans `backend/routes/documentValidation.js`

### 2. 🔄 EN COURS - Dashboard incomplet
Le dashboard actuel (`DashboardNipcan.tsx`) manque plusieurs fonctionnalités de l'ancien dashboard:
- ❌ Liste détaillée des documents avec statuts
- ❌ Notifications
- ❌ Messagerie
- ❌ Notes/Résultats
- ❌ Historique des activités

## Solutions proposées

### Option 1: Enrichir DashboardNipcan.tsx (RECOMMANDÉ)
Ajouter des onglets supplémentaires dans le dashboard actuel:
- **Documents**: Liste complète des documents avec statuts (valide/rejeté/en attente)
- **Notifications**: Afficher les notifications liées aux documents et paiements
- **Messages**: Système de messagerie avec l'administration
- **Résultats**: Afficher les notes quand disponibles

**Avantages**:
- Interface moderne déjà en place
- Multi-candidature déjà géré
- Cohérent avec le nouveau design

### Option 2: Utiliser CandidatDashboard.tsx
Rediriger vers l'ancien dashboard qui a déjà toutes les fonctionnalités.

**Inconvénients**:
- Ne gère pas le multi-candidature
- Design moins moderne
- Duplication de code

## Plan d'implémentation (Option 1)

### Étape 1: Ajouter l'interface Document
```typescript
interface Document {
    id: number;
    nomdoc: string;
    typdoc: string;
    statut: 'en_attente' | 'valide' | 'rejete';
    fichier: string;
    created_at: string;
    updated_at: string;
}
```

### Étape 2: Créer une route API pour récupérer les documents
**Backend**: `GET /api/candidats/nupcan/:nupcan/documents`
```javascript
router.get('/nupcan/:nupcan/documents', async (req, res) => {
    const { nupcan } = req.params;
    const [documents] = await connection.execute(`
        SELECT d.*, dos.nupcan
        FROM documents d
        INNER JOIN dossiers dos ON d.id = dos.document_id
        WHERE dos.nupcan = ?
        ORDER BY d.created_at DESC
    `, [nupcan]);
    
    res.json({ success: true, data: documents });
});
```

### Étape 3: Ajouter un onglet "Documents" dans DashboardNipcan
- Afficher la liste des documents avec badges de statut
- Permettre le téléchargement
- Afficher les commentaires de rejet

### Étape 4: Ajouter les notifications
**Backend**: Route déjà existante dans `documentValidation.js`
- `GET /api/document-validation/notifications/:nupcan`

**Frontend**: 
- Afficher les notifications dans un onglet dédié
- Badge avec le nombre de notifications non lues
- Marquer comme lu au clic

### Étape 5: Ajouter la messagerie (optionnel)
Créer un système simple de messages entre candidat et administration.

### Étape 6: Ajouter les résultats (optionnel)
Afficher les notes quand elles sont disponibles.

## Priorités

1. **URGENT**: ✅ Corriger l'erreur 500 sur validation documents
2. **HAUTE**: Afficher les documents dans le dashboard candidat
3. **MOYENNE**: Ajouter les notifications
4. **BASSE**: Messagerie et résultats

## Fichiers à modifier

### Backend
- ✅ `backend/routes/documentValidation.js` - Corriger nipcan → nupcan
- 🔄 `backend/routes/candidat-dashboard-simple.js` - Ajouter route documents détaillés
- 🔄 `backend/routes/candidat-dashboard-simple.js` - Ajouter route notifications

### Frontend
- 🔄 `frontend/src/pages/candidat/DashboardNipcan.tsx` - Ajouter onglet Documents
- 🔄 `frontend/src/pages/candidat/DashboardNipcan.tsx` - Ajouter onglet Notifications
- 🔄 `frontend/src/pages/candidat/DashboardNipcan.tsx` - Afficher badge notifications

## État actuel

### ✅ Fonctionnalités qui marchent
- Connexion avec NIPCAN
- Affichage des candidatures multiples
- Compteur de documents (0/4 validés)
- Statut du paiement
- Progression globale
- Navigation vers page Documents
- Navigation vers page Paiement

### ❌ Fonctionnalités manquantes
- Liste détaillée des documents dans le dashboard
- Notifications de validation/rejet
- Messagerie
- Notes/Résultats
- Historique des activités

## Prochaines étapes

1. Créer la route API pour récupérer les documents d'un NUPCAN
2. Ajouter un onglet "Documents" dans DashboardNipcan
3. Afficher la liste des documents avec statuts
4. Ajouter les notifications
5. Tester le flux complet
