# Sécurité

Le serveur moderne applique Helmet, CORS par liste blanche, limitation de débit, limite JSON de 1 Mo, cookies, corrélation et messages d’erreur sans détails internes. La production refuse de démarrer sans `JWT_SECRET`. L’accès administratif vérifie rôle et établissements attribués.

Les documents ne sont jamais exposés en répertoire statique. Le modèle stocke uniquement clé privée, empreinte, MIME détecté et conservation. La prochaine intégration S3/R2/MinIO devra produire une URL signée de courte durée après contrôle d’autorisation. Ne journaliser ni pièces, ni tokens, ni données personnelles.

Le paiement `development` est interdit en production. Les webhooks réels doivent vérifier la signature du fournisseur et utiliser les identifiants uniques avant de marquer une candidature payée.

## Anti-injection et anti-doublons

- `express-mongo-sanitize` supprime les clés `$` et `.` des entrées HTTP (body/query/params). Toutes les requêtes Mongo sont construites côté serveur : aucun usage légitime n’est impacté.
- **Unicité candidat** : nom et prénom peuvent se répéter (homonymes autorisés), mais **ni l’email ni le numéro de téléphone**. Les numéros sont canonicalisés (`utils/phone.js` : espaces et `00`/`+` harmonisés) et comparés sous leurs deux écritures (`+241…` / `241…`), à l’inscription comme à la connexion et à la première candidature. Index uniques en renfort : `username`, `accountPhone`, `nipcan`, `email` (partiel).
- La recherche publique par NIPCAN reste exacte (pas de listing) et limitée en débit (60 req/15 min) contre l’énumération.
