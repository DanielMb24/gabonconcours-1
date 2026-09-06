-- 🔍 VÉRIFICATION URGENTE - Exécutez dans phpMyAdmin

-- 1. Vérifier votre candidat
SELECT 
    'CANDIDAT' as type,
    id,
    nipcan,
    nupcan,
    nomcan,
    prncan
FROM candidats
WHERE nipcan = 'NIP2026000001'
   OR nupcan LIKE '%2026082%';

-- 2. Vérifier les dossiers liés
SELECT 
    'DOSSIERS' as type,
    dos.id,
    dos.candidat_id,
    dos.nipcan as valeur_colonne_nipcan,
    dos.document_id,
    c.nipcan as nipcan_candidat,
    c.nupcan as nupcan_candidat
FROM dossiers dos
LEFT JOIN candidats c ON dos.candidat_id = c.id
WHERE c.nipcan = 'NIP2026000001'
   OR c.nupcan LIKE '%2026082%'
   OR dos.nipcan LIKE '%2026082%';

-- 3. Test de la requête du dashboard
SELECT 
    'TEST REQUETE' as type,
    COUNT(*) as total,
    SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as valides
FROM dossiers dos
LEFT JOIN documents d ON dos.document_id = d.id
WHERE dos.nipcan = '2026082-2';
