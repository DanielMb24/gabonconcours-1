# API v1

Toutes les réponses suivent `{ success, data, message, errors }` et les erreurs ajoutent `correlationId`.

- `GET /api/v1/health`
- `GET /api/v1/contests?q=` et `GET /api/v1/contests/:id`
- `POST /api/v1/applications`
- `GET|PATCH /api/v1/applications/:nupcan`
- `POST /api/v1/payments`
- `GET /api/v1/admin/applications` (administrateur authentifié)

Anciennes routes: toutes les routes sous `/api/*` de `backend/server.js` sont conservées uniquement lorsque `DATABASE_DRIVER=mysql`. Elles sont dépréciées; aucune nouvelle intégration ne doit les utiliser.
