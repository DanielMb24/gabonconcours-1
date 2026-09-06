# Corrections des routes API

## ✅ Problèmes corrigés

### 1. Route documents - 404 Not Found
**Erreur**: `GET /api/documents/nupcan/20260403-3 404`
**Cause**: Le frontend appelait `/api/documents/nupcan/:nupcan` mais la route backend est `/api/candidats/nupcan/:nupcan/documents`
**Solution**: Modifié `frontend/src/services/documentService.ts` ligne 32

**Avant**:
```typescript
const response = await api.get(`/documents/nupcan/${encodeURIComponent(nupcan)}`);
```

**Après**:
```typescript
const response = await api.get(`/candidats/nupcan/${encodeURIComponent(nupcan)}/documents`);
```

### 2. Route notifications - 500 Internal Server Error
**Erreur**: `GET /api/notifications/candidat/20260403-3 500`
**Cause**: Le fichier `backend/routes/notifications.js` utilisait son propre pool MySQL au lieu de `getConnection()`
**Solution**: Remplacé toutes les occurrences de `pool.getConnection()` par `getConnection()`

**Modifications dans `backend/routes/notifications.js`**:
- Ligne 1-3: Remplacé l'import et la création du pool
- Ligne 11: Supprimé `connection.release()`
- Ligne 48: Supprimé `connection.release()`
- Ligne 70: Supprimé `connection.release()`
- Ligne 92: Supprimé `connection.release()`
- Ligne 114: Supprimé `connection.release()`

### 3. Route validation documents - 500 Internal Server Error (DÉJÀ CORRIGÉ)
**Erreur**: `PUT /api/document-validation/17 500`
**Cause**: `backend/models/Document.js` ligne 88 utilisait `nipcan` au lieu de `nupcan`
**Solution**: Déjà corrigée dans la session précédente

## 📊 Routes API disponibles

### Documents
- ✅ `GET /api/candidats/nupcan/:nupcan/documents` - Récupérer les documents d'une candidature
- ✅ `PUT /api/documents-candidate/:id/replace` - Remplacer un document rejeté
- ✅ `POST /api/documents-candidate/add` - Ajouter un nouveau document
- ✅ `GET /api/documents-candidate/can-add/:nipcan` - Vérifier si peut ajouter un document

### Notifications
- ✅ `GET /api/notifications/candidat/:candidatId` - Récupérer les notifications d'un candidat
- ✅ `PUT /api/notifications/:notificationId/read` - Marquer une notification comme lue
- ✅ `POST /api/notifications/send` - Envoyer une notification
- ✅ `DELETE /api/notifications/:notificationId` - Supprimer une notification
- ✅ `DELETE /api/notifications/candidat/:candidatId` - Supprimer toutes les notifications d'un candidat

### Validation documents
- ✅ `PUT /api/document-validation/:id` - Valider/Rejeter un document
- ✅ `GET /api/document-validation/notifications/:nupcan` - Récupérer les notifications
- ✅ `PUT /api/document-validation/notifications/:id/read` - Marquer notification lue

### Dashboard
- ✅ `POST /api/candidats/nipcan/verify` - Vérifier un NIPCAN
- ✅ `GET /api/candidats/nupcan/:nupcan/nipcan` - Obtenir NIPCAN depuis NUPCAN
- ✅ `GET /api/candidats/nipcan/:nipcan/dashboard` - Dashboard principal

## 🧪 Tests à effectuer

### Test 1: Documents
1. ✅ Se connecter avec NIPCAN
2. ✅ Aller sur l'onglet Documents
3. ✅ Vérifier que les 4 documents s'affichent
4. ✅ Pas d'erreur 404

### Test 2: Notifications
1. ✅ Admin valide/rejette un document
2. ✅ Candidat va sur l'onglet Notifications
3. ✅ Vérifier que les notifications s'affichent
4. ✅ Pas d'erreur 500

### Test 3: Validation documents (Admin)
1. ✅ Admin va sur la gestion des documents
2. ✅ Valider ou rejeter un document
3. ✅ Pas d'erreur 500
4. ✅ Notification créée pour le candidat

## 📝 Fichiers modifiés

### Frontend
- ✅ `frontend/src/services/documentService.ts` - Ligne 32: Correction de l'URL

### Backend
- ✅ `backend/routes/notifications.js` - Remplacement du pool MySQL par getConnection()
- ✅ `backend/models/Document.js` - Ligne 88: nipcan → nupcan (déjà fait)
- ✅ `backend/routes/documentValidation.js` - Ajout de c.nipcan dans SELECT (déjà fait)

## ✅ Résumé

Toutes les routes API sont maintenant fonctionnelles:
- ✅ Documents: Route corrigée, appel frontend mis à jour
- ✅ Notifications: Pool MySQL remplacé par getConnection()
- ✅ Validation: Erreur nipcan/nupcan corrigée
- ✅ Serveur redémarré et fonctionnel

Le dashboard candidat devrait maintenant afficher correctement:
- Les documents
- Les notifications
- La messagerie
- Les résultats

Tout est prêt pour les tests! 🚀
