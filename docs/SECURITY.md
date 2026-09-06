# Sécurité

Le serveur moderne applique Helmet, CORS par liste blanche, limitation de débit, limite JSON de 1 Mo, cookies, corrélation et messages d’erreur sans détails internes. La production refuse de démarrer sans `JWT_SECRET`. L’accès administratif vérifie rôle et établissements attribués.

Les documents ne sont jamais exposés en répertoire statique. Le modèle stocke uniquement clé privée, empreinte, MIME détecté et conservation. La prochaine intégration S3/R2/MinIO devra produire une URL signée de courte durée après contrôle d’autorisation. Ne journaliser ni pièces, ni tokens, ni données personnelles.

Le paiement `development` est interdit en production. Les webhooks réels doivent vérifier la signature du fournisseur et utiliser les identifiants uniques avant de marquer une candidature payée.
