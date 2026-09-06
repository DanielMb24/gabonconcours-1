-- 🔍 DEBUG COMPLET - Trouvons le problème!
-- Exécutez ces requêtes UNE PAR UNE dans phpMyAdmin

-- ============================================
-- ÉTAPE 1: Trouver votre candidat
-- ============================================
SELECT 
    '=== VOTRE CANDIDAT ===' as info,
    id,
    nipcan,
    nupcan,
    nomcan,
    prncan,
    concours_id,
    filiere_id
FROM candidats
WHERE nipcan LIKE 'NIP2026%'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- ÉTAPE 2: Voir TOUS les dossiers
-- ============================================
SELECT 
    '=== TOUS LES DOSSIERS ===' as info,
    dos.id,
    dos.candidat_id,
    dos.nipcan as valeur_dans_colonne_nipcan,
    dos.document_id,
    dos.created_at
FROM dossiers dos
ORDER BY dos.created_at DESC
LIMIT 20;

-- ============================================
-- ÉTAPE 3: Jointure candidat + dossiers
-- ============================================
SELECT 
    '=== JOINTURE ===' as info,
    c.id as candidat_id,
    c.nipcan,
    c.nupcan,
    dos.id as dossier_id,
    dos.nipcan as valeur_dossier_nipcan,
    dos.document_id,
    d.nomdoc
FROM candidats c
LEFT JOIN dossiers dos ON dos.candidat_id = c.id
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan LIKE 'NIP2026%'
ORDER BY dos.created_at DESC
LIMIT 20;

-- ============================================
-- ÉTAPE 4: Test avec votre NUPCAN exact
-- ============================================
-- Remplacez '2026082-2' par votre NUPCAN si différent
SELECT 
    '=== TEST AVEC NUPCAN ===' as info,
    COUNT(*) as total_documents,
    SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as documents_valides
FROM dossiers dos
LEFT JOIN documents d ON dos.document_id = d.id
WHERE dos.nipcan = '2026082-2';

-- ============================================
-- ÉTAPE 5: Voir si les dossiers ont un candidat_id
-- ============================================
SELECT 
    '=== DOSSIERS AVEC CANDIDAT ===' as info,
    dos.id,
    dos.candidat_id,
    dos.nipcan,
    CASE 
        WHEN dos.candidat_id IS NULL THEN '❌ PAS DE CANDIDAT_ID'
        ELSE '✅ OK'
    END as statut
FROM dossiers dos
ORDER BY dos.created_at DESC
LIMIT 20;

-- ============================================
-- ÉTAPE 6: Chercher les dossiers orphelins
-- ============================================
SELECT 
    '=== DOSSIERS ORPHELINS ===' as info,
    dos.id,
    dos.candidat_id,
    dos.nipcan,
    dos.document_id
FROM dossiers dos
WHERE dos.candidat_id NOT IN (SELECT id FROM candidats)
   OR dos.candidat_id IS NULL
LIMIT 20;

-- ============================================
-- RÉSULTATS ATTENDUS:
-- ============================================
/*
ÉTAPE 1: Devrait montrer votre candidat avec nipcan et nupcan
ÉTAPE 2: Devrait montrer 16 dossiers
ÉTAPE 3: Devrait montrer la jointure entre candidat et dossiers
ÉTAPE 4: Devrait montrer 16 documents (ou le nombre que vous avez uploadé)
ÉTAPE 5: Tous les dossiers devraient avoir un candidat_id
ÉTAPE 6: Ne devrait rien retourner (pas de dossiers orphelins)

SI ÉTAPE 4 RETOURNE 0:
→ Le NUPCAN dans la colonne dos.nipcan ne correspond pas à c.nupcan

SI ÉTAPE 5 MONTRE DES DOSSIERS SANS candidat_id:
→ Les dossiers n'ont pas été liés au candidat correctement

SI ÉTAPE 6 RETOURNE DES RÉSULTATS:
→ Les dossiers sont orphelins (candidat_id invalide)
*/
