# Inventaire des éléments obsolètes

Doublons confirmés à traiter après validation métier: routes `support*`, `messaging*`, `documentValidation*`, `admin-management`/`adminManagement`, `statistics*`; pages `DashboardCandidat` présentes dans plusieurs dossiers; variantes `Documents*`, `Paiement*`, `Succes*`; nombreux comptes rendus et correctifs SQL à la racine.

Les fichiers utilisateurs sous `backend/uploads/`, `.env`, `.idea/` et `.vscode/` sont ignorés désormais mais n’ont pas été supprimés afin de préserver les données existantes. Les scripts SQL historiques doivent être déplacés vers `legacy/mysql/` seulement après vérification qu’aucun processus externe ne dépend de leur chemin actuel.
