# Modèle MongoDB

Les schémas sont centralisés dans `backend/models/mongo/index.js`: établissements, provinces, niveaux, filières, matières, concours, configurations concours-filières et filières-matières, exigences documentaires, administrateurs, candidats, candidatures, documents, paiements et événements, reçus, notes, notifications et modèles, messages, support, codes de vérification, tentatives de connexion, accès documentaires, audit, sessions, paramètres, compteurs et checkpoints de migration.

Chaque entité migrée garde `legacyId`. Les nouvelles relations utilisent `ObjectId` et les collections métier ont des timestamps. `applications.nupcan`, `payments.paymentReference` et `payments.transactionId` sont uniques. Les recherches administratives disposent d’index composés sur concours, statut et date.

Une candidature embarque un instantané du concours et de la filière au moment du dépôt pour préserver la valeur historique même si le catalogue change.
