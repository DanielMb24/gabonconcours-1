-- 🔍 DIAGNOSTIC COMPLET - Problème Documents Dashboard
-- Exécutez ces requêtes dans phpMyAdmin pour diagnostiquer le problème

-- ============================================
-- 1. VÉRIFIER LES CANDIDATS
-- ============================================
SELECT 
    '=== CANDIDATS ===' as section,
    id,
    nipcan,
    nupcan,
    nomcan,
    prncan,
    created_at
FROM candidats
WHERE nipcan LIKE 'NIP2026%'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 2. VÉRIFIER LES DOCUMENTS DANS DOSSIERS
-- ============================================
SELECT 
    '=== DOSSIERS (Documents) ===' as section,
    dos.id as dossier_id,
    dos.nipcan as valeur_colonne_nipcan,
    dos.candidat_id,
    dos.document_id,
    d.nomdoc,
    d.statut,
    dos.created_at
FROM dossiers dos
LEFT JOIN documents d ON dos.document_id = d.id
ORDER BY dos.created_at DESC
LIMIT 10;

-- ============================================
-- 3. JOINTURE CANDIDATS + DOSSIERS
-- ============================================
SELECT 
    '=== JOINTURE CANDIDATS + DOSSIERS ===' as section,
    c.nipcan as nipcan_candidat,
    c.nupcan as nupcan_candidat,
    dos.nipcan as valeur_dans_dossiers_nipcan,
    d.nomdoc,
    d.statut,
    CASE 
        WHEN c.nupcan = dos.nipcan THEN '✅ MATCH'
        ELSE '❌ PAS DE MATCH'
    END as correspondance
FROM candidats c
LEFT JOIN dossiers dos ON dos.candidat_id = c.id
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan LIKE 'NIP2026%'
ORDER BY dos.created_at DESC
LIMIT 10;

-- ============================================
-- 4. COMPTER LES DOCUMENTS PAR CANDIDAT
-- ============================================
SELECT 
    '=== COMPTAGE DOCUMENTS ===' as section,
    c.nipcan,
    c.nupcan,
    COUNT(DISTINCT d.id) as total_documents,
    SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as documents_valides,
    SUM(CASE WHEN d.statut = 'en_attente' THEN 1 ELSE 0 END) as documents_en_attente,
    SUM(CASE WHEN d.statut = 'rejete' THEN 1 ELSE 0 END) as documents_rejetes
FROM candidats c
LEFT JOIN dossiers dos ON dos.candidat_id = c.id
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan LIKE 'NIP2026%'
GROUP BY c.nipcan, c.nupcan;

-- ============================================
-- 5. REQUÊTE UTILISÉE PAR LE DASHBOARD (AVANT CORRECTION)
-- ============================================
-- Cette requête cherchait avec c.nipcan (INCORRECT)
SELECT 
    '=== REQUÊTE DASHBOARD AVANT (INCORRECT) ===' as section,
    COUNT(*) as total,
    SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as valides
FROM candidats c
LEFT JOIN dossiers dos ON dos.nipcan = c.nipcan  -- ❌ INCORRECT
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan = 'NIP2026000001';

-- ============================================
-- 6. REQUÊTE UTILISÉE PAR LE DASHBOARD (APRÈS CORRECTION)
-- ============================================
-- Cette requête cherche avec c.nupcan (CORRECT)
SELECT 
    '=== REQUÊTE DASHBOARD APRÈS (CORRECT) ===' as section,
    COUNT(*) as total,
    SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as valides
FROM candidats c
LEFT JOIN dossiers dos ON dos.nipcan = c.nupcan  -- ✅ CORRECT
LEFT JOIN documents d ON dos.document_id = d.id
WHERE c.nipcan = 'NIP2026000001';

-- ============================================
-- 7. VÉRIFIER LA COHÉRENCE DES DONNÉES
-- ============================================
SELECT 
    '=== VÉRIFICATION COHÉRENCE ===' as section,
    dos.id,
    dos.nipcan as valeur_stockee,
    c.nipcan as nipcan_candidat,
    c.nupcan as nupcan_candidat,
    CASE 
        WHEN dos.nipcan = c.nupcan THEN '✅ Cohérent (NUPCAN)'
        WHEN dos.nipcan = c.nipcan THEN '⚠️ Incohérent (NIPCAN stocké)'
        ELSE '❌ Aucune correspondance'
    END as diagnostic
FROM dossiers dos
LEFT JOIN candidats c ON dos.candidat_id = c.id
WHERE c.nipcan LIKE 'NIP2026%'
LIMIT 10;

-- ============================================
-- 8. LISTE COMPLÈTE DES DOCUMENTS POUR UN CANDIDAT
-- ============================================
SELECT 
    '=== DOCUMENTS DÉTAILLÉS ===' as section,
    d.id as document_id,
    d.nomdoc,
    d.type,
    d.nom_fichier,
    d.statut,
    dos.nipcan as nupcan_dans_dossier,
    c.nipcan as nipcan_candidat,
    c.nupcan as nupcan_candidat,
    d.created_at
FROM documents d
LEFT JOIN dossiers dos ON d.id = dos.document_id
LEFT JOIN candidats c ON dos.candidat_id = c.id
WHERE c.nipcan = 'NIP2026000001'
ORDER BY d.created_at DESC;

-- ============================================
-- 9. STATISTIQUES GLOBALES
-- ============================================
SELECT 
    '=== STATISTIQUES GLOBALES ===' as section,
    (SELECT COUNT(*) FROM candidats) as total_candidats,
    (SELECT COUNT(*) FROM documents) as total_documents,
    (SELECT COUNT(*) FROM dossiers) as total_dossiers,
    (SELECT COUNT(*) FROM candidats WHERE nipcan IS NOT NULL) as candidats_avec_nipcan,
    (SELECT COUNT(*) FROM candidats WHERE nupcan IS NOT NULL) as candidats_avec_nupcan;

-- ============================================
-- 10. VÉRIFIER LES DOUBLONS
-- ============================================
SELECT 
    '=== DOUBLONS POTENTIELS ===' as section,
    nipcan,
    COUNT(*) as nombre_occurrences
FROM dossiers
GROUP BY nipcan
HAVING COUNT(*) > 1
ORDER BY nombre_occurrences DESC;

-- ============================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================
/*
RÉSULTATS ATTENDUS:

1. Requête 5 (AVANT): total = 0
   → Confirme que l'ancienne requête ne trouvait rien

2. Requête 6 (APRÈS): total = 16 (ou votre nombre de documents)
   → Confirme que la nouvelle requête fonctionne

3. Requête 7 (COHÉRENCE): Tous les résultats doivent être "✅ Cohérent (NUPCAN)"
   → Confirme que les données sont correctes

SI LES RÉSULTATS SONT DIFFÉRENTS:

- Si Requête 5 = 0 et Requête 6 = 0:
  → Problème de données: les NUPCAN ne correspondent pas

- Si Requête 5 > 0:
  → Les données utilisent le NIPCAN au lieu du NUPCAN (problème de conception)

- Si Requête 7 montre "⚠️ Incohérent":
  → Les dossiers ont été créés avec le NIPCAN au lieu du NUPCAN
*/
