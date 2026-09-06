-- ============================================
-- SQL pour Tester la Connexion Candidat
-- ============================================

-- 1. Vérifier les NIPCAN existants
SELECT nipcan, nomcan, prncan, maican 
FROM candidats 
WHERE nipcan IS NOT NULL 
LIMIT 10;

-- 2. Compter les candidats avec NIPCAN
SELECT COUNT(*) as total_avec_nipcan 
FROM candidats 
WHERE nipcan IS NOT NULL;

-- 3. Vérifier un NIPCAN spécifique
SELECT * FROM candidats WHERE nipcan = 'NIP2026000001';

-- 4. Voir les candidatures d'un candidat
SELECT 
    c.nipcan,
    c.nupcan,
    c.nomcan,
    c.prncan,
    con.libcnc as concours,
    f.nomfil as filiere
FROM candidats c
LEFT JOIN concours con ON c.concours_id = con.id
LEFT JOIN filieres f ON c.filiere_id = f.id
WHERE c.nipcan = 'NIP2026000001';

-- 5. Créer un candidat de test (si besoin)
INSERT INTO candidats (
    nipcan, nupcan, nomcan, prncan, maican, 
    telcan, dtncan, ldncan, niveau_id, proorg,
    created_at, updated_at
) VALUES (
    'NIP2026999999',
    'GABCONCOURS-26-999999',
    'TEST',
    'Candidat',
    'test@example.com',
    '+241 00 00 00 00',
    '2000-01-01',
    'Libreville',
    1,
    'Gabon',
    NOW(),
    NOW()
);

-- 6. Vérifier les statistiques d'un candidat
SELECT 
    c.nipcan,
    COUNT(DISTINCT c2.id) as total_candidatures,
    COUNT(DISTINCT CASE WHEN c2.etape != 'complete' THEN c2.id END) as en_cours,
    COUNT(DISTINCT CASE WHEN c2.etape = 'complete' THEN c2.id END) as completes
FROM candidats c
LEFT JOIN candidats c2 ON c.nipcan = c2.nipcan
WHERE c.nipcan = 'NIP2026000001'
GROUP BY c.nipcan;
