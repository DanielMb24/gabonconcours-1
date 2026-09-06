# Déploiement

Copier `.env.example` vers `.env`, générer un secret JWT long, puis lancer `docker compose up --build`. Créer les collections et index vides avec `docker compose exec backend npm run init-db`. Cette commande n'insère aucune donnée de démonstration. Frontend: `http://localhost:3000`; API: `http://localhost:3001/api/v1`; MongoDB: port 27017.

Pour Atlas, définir `MONGODB_URI` (ou `AUTH_MONGODB_URI`) avec l’URI Atlas et `MONGODB_DB_NAME=gabconcours`, autoriser uniquement le réseau du service, activer TLS et ne jamais placer l’URI dans Git. En production, fournir `JWT_SECRET`, `CORS_ORIGINS` et un stockage objet privé.
