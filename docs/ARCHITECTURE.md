# Architecture

GabConcours utilise React/Vite côté client et Express/Mongoose côté serveur. Le point d’entrée moderne est `backend/server-mongodb.js`, qui construit l’application dans `backend/app.js`. Les routes versionnées vivent sous `/api/v1`; contrôleurs légers, services métier et modèles MongoDB sont séparés.

`DATABASE_DRIVER=mongodb` est la valeur normale. `mysql` redirige temporairement vers l’ancien `backend/server.js` afin de rendre le basculement réversible. Ce serveur historique est déprécié et ne doit pas être exposé durablement.

Les candidatures (`applications`) sont la source de vérité. Un candidat peut posséder plusieurs candidatures, mais une seule par couple candidat/concours. Les fichiers sont conservés hors MongoDB et aucune route statique `/uploads` n’existe dans l’application moderne.
