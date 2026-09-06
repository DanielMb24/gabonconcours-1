# Retour vers MySQL

Avant bascule, figer les écritures, conserver le rapport de rapprochement et sauvegarder MongoDB. En cas d’anomalie: arrêter les écritures, archiver les événements MongoDB post-bascule, définir `DATABASE_DRIVER=mysql`, redémarrer le backend, puis réconcilier manuellement ces événements avant toute nouvelle tentative.

Les sources MySQL ne sont jamais supprimées ou modifiées par le migrateur. Le serveur historique et les scripts SQL restent disponibles durant la transition. Ne désinstaller MySQL/Sequelize qu’après validation fonctionnelle et période de stabilité convenue.
