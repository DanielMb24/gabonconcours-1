-- 🚀 SOLUTION RAPIDE - Correction des données

-- ============================================
-- DIAGNOSTIC: Trouvons d'abord le problème exact
-- ============================================

-- 1. Voir tous vos candidats
SELECT 
    id,
    nipcan,
    nupcan,
    nomcan,
    prncan
FROM candidats
WHERE nipcan LIKE 'NIP2026%';

-- 2. Voir tous les NUPCAN dans les dossiers
SELECT DISTINCT
    dos.nipcan as nupcan_dans_dossiers,
    COUNT(*) as nombre_documents
FROM dossiers dos
GROUP BY dos.nipcan
ORDER BY nombre_documents DESC;

-- 3. Vérifier la correspondance
SELECT 
    c.nipcan,
    c.nupcan as nupcan_candidat,
    dos.nipcan as nupcan_dossiers,
    COUNT(dos.id) as nombre_dossiers,
    CASE 
        WHEN c.nupcan = dos.nipcan THEN '✅ MATCH'
        ELSE '❌ PAS DE MATCH'
    END as correspondance
FROM candidats c
LEFT JOIN dossiers dos ON dos.candidat_id = c.id
WHERE c.nipcan LIKE 'NIP2026%'
GROUP BY c.nipcan, c.nupcan, dos.nipcan;

-- ============================================
-- CORRECTION: Si les NUPCAN ne correspondent pas
-- ============================================

-- Option A: Si les dossiers ont le mauvais NUPCAN
-- Remplacez 'ANCIEN_NUPCAN' et 'NOUVEAU_NUPCAN' par les vraies valeurs

-- UPDATE dossiers 
-- SET nipcan = 'NOUVEAU_NUPCAN'
-- WHERE nipcan = 'ANCIEN_NUPCAN';

-- Option B: Si le candidat a le mauvais NUPCAN
-- Remplacez 'ANCIEN_NUPCAN' et 'NOUVEAU_NUPCAN' par les vraies valeurs

-- UPDATE candidats
-- SET nupcan = 'NOUVEAU_NUPCAN'
-- WHERE nupcan = 'ANCIEN_NUPCAN';

-- ============================================
-- VÉRIFICATION APRÈS CORRECTION
-- ============================================

-- Comptez les documents après correction
SELECT 
    c.nipcan,
    c.nupcan,
    COUNT(d.id) as total_documents
FROM candidats c
LEFT JOIN dossiers dos ON dos.nipcan = c.nupcan
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan LIKE 'NIP2026%'
GROUP BY c.nipcan, c.nupcan;

-- ============================================
-- INSTRUCTIONS:
-- ============================================
/*
1. Exécutez les requêtes de DIAGNOSTIC (1, 2, 3)
2. Notez les valeurs de:
   - nupcan_candidat (dans la table candidats)
   - nupcan_dossiers (dans la table dossiers)
3. Si elles sont différentes, utilisez une des requêtes UPDATE
4. Exécutez la VÉRIFICATION pour confirmer
5. Redémarrez le serveur backend
6. Rafraîchissez le dashboard
*/
