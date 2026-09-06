# Migration MySQL vers MongoDB

1. Créer un utilisateur MySQL en lecture seule et renseigner les variables `DB_*`.
2. Renseigner `MONGODB_URI`; pour Atlas, utiliser l’URI `mongodb+srv://...` fournie par Atlas sans la committer.
3. Lancer `npm run migrate:dry-run` dans `backend`.
4. Examiner les fichiers de `backend/migration-reports/` et corriger erreurs/doublons.
5. Lancer `npm run migrate`, puis relancer le dry-run pour le rapprochement.

Le traitement se fait par lots (`--batch-size=250`), utilise `legacyId` comme clé d’upsert et peut donc être repris. Il ne modifie jamais MySQL. Le socle migre d’abord les référentiels et personnes; candidatures, documents, paiements et communications nécessitent la validation des correspondances spécifiques du schéma de production avant bascule.

Les tables dénormalisées ou accidentelles ne sont pas migrées comme collections : `compose` duplique les données de `notes`, tandis que `gabconcours(C1)` contient des lignes de texte SQL et non des données métier. Les sessions sont migrées uniquement lorsque leur candidat existe et leur token est converti en empreinte SHA-256.
