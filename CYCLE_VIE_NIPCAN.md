# 🔑 Cycle de Vie du NIPCAN

## 📌 Qu'est-ce que le NIPCAN ?

Le **NIPCAN** (Numéro d'Identification Permanent du Candidat) est un identifiant unique et permanent attribué à chaque candidat lors de sa **première inscription**.

### Format
```
NIP + ANNÉE + NUMÉRO_SÉQUENTIEL (6 chiffres)
Exemple: NIP2026000001
```

---

## 🔄 Quand est-il créé ?

### Moment de Création
Le NIPCAN est créé **lors de la première candidature** d'un candidat à un concours.

### Flux Complet

```
1. Candidat remplit le formulaire d'inscription
   ↓
2. Soumission du formulaire (POST /api/candidats)
   ↓
3. Backend vérifie si NIPCAN fourni
   ├─ OUI → Utilise le NIPCAN existant (multi-candidature)
   └─ NON → Génère un nouveau NIPCAN
   ↓
4. NIPCAN stocké dans la table candidats
   ↓
5. Email de confirmation envoyé avec le NIPCAN
   ↓
6. Candidat peut se connecter avec ce NIPCAN
```

---

## 💻 Code Backend - Génération

### Fichier: `backend/models/Counter.js`

```javascript
static async getNextNipcan() {
    const connection = getConnection();
    const year = new Date().getFullYear();

    // Vérifier compteur pour l'année en cours
    const [existing] = await connection.execute(
        'SELECT counter FROM nipcan_counters WHERE year = ?',
        [year]
    );

    if (existing.length > 0) {
        // Incrémenter le compteur
        const newCounter = existing[0].counter + 1;
        await connection.execute(
            'UPDATE nipcan_counters SET counter = ? WHERE year = ?',
            [newCounter, year]
        );
        return `NIP${year}${String(newCounter).padStart(6, '0')}`;
    } else {
        // Premier NIPCAN de l'année
        await connection.execute(
            'INSERT INTO nipcan_counters (year, counter) VALUES (?, ?)',
            [year, 1]
        );
        return `NIP${year}000001`;
    }
}
```

### Fichier: `backend/routes/candidats.js`

```javascript
// POST /api/candidats - Création candidat
router.post('/', upload.single('phtcan'), async (req, res) => {
    // ... validation des champs ...

    // Générer NUPCAN (unique par candidature)
    const nupcan = await Counter.getNextNupcan();

    // Gérer NIPCAN
    let nipcan = req.body.nipcan;
    if (!nipcan || nipcan.trim() === '') {
        // 🆕 NOUVEAU CANDIDAT → Générer NIPCAN
        nipcan = await Counter.getNextNipcan();
        console.log('🆕 Nouveau NIPCAN généré:', nipcan);
    } else {
        // ♻️ CANDIDAT EXISTANT → Réutiliser NIPCAN
        console.log('♻️ NIPCAN existant utilisé:', nipcan);
    }

    // Créer le candidat avec le NIPCAN
    const candidat = await Candidat.create({
        ...req.body,
        nipcan: nipcan,
        nupcan: nupcan
    });

    // Envoyer email avec le NIPCAN
    await emailService.sendRegistrationConfirmation(candidat);
});
```

---

## 🗄️ Stockage en Base de Données

### Table: `nipcan_counters`
```sql
CREATE TABLE nipcan_counters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL UNIQUE,           -- Année (ex: 2026)
    counter INT NOT NULL DEFAULT 1,     -- Compteur séquentiel
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Exemple de données
| id | year | counter | created_at          |
|----|------|---------|---------------------|
| 1  | 2026 | 15      | 2026-01-15 10:30:00 |

Cela signifie : 15 candidats créés en 2026
Prochain NIPCAN : `NIP2026000016`

### Table: `candidats`
```sql
CREATE TABLE candidats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nipcan VARCHAR(20) UNIQUE,          -- NIPCAN permanent
    nupcan VARCHAR(50) UNIQUE,          -- NUPCAN par candidature
    nomcan VARCHAR(100),
    prncan VARCHAR(100),
    maican VARCHAR(100),
    -- ... autres champs ...
);
```

---

## 🔄 Système Multi-Candidature

### Principe
Un candidat peut postuler à **plusieurs concours** avec le **même NIPCAN**.

### Exemple Concret

**Candidat: Jean DUPONT**
- **NIPCAN**: `NIP2026000001` (créé à la 1ère candidature)

**Candidatures:**
1. Concours ENS - NUPCAN: `20260115-1`
2. Concours ENSP - NUPCAN: `20260120-5`
3. Concours ENAM - NUPCAN: `20260125-3`

### Flux Multi-Candidature

```
Première candidature (ENS)
  ↓
NIPCAN créé: NIP2026000001
  ↓
Stocké dans localStorage
  ↓
Deuxième candidature (ENSP)
  ↓
Formulaire pré-rempli avec NIPCAN existant
  ↓
Backend réutilise le même NIPCAN
  ↓
Nouvelle entrée candidats avec même NIPCAN
```

---

## 📧 Email de Confirmation

Lors de la création du NIPCAN, un email est envoyé au candidat :

```
Objet: Confirmation d'inscription - GABConcours

Bonjour Jean DUPONT,

Votre inscription a été confirmée avec succès !

Votre identifiant permanent (NIPCAN): NIP2026000001

⚠️ IMPORTANT: Conservez précieusement ce numéro !
Il vous permettra de :
- Vous connecter à votre dashboard
- Créer de nouvelles candidatures
- Suivre toutes vos candidatures

Pour vous connecter: https://gabconcours.ga/connexion

Cordialement,
L'équipe GABConcours
```

---

## 🔐 Utilisation du NIPCAN

### 1. Connexion au Dashboard
```
Page: /connexion
Champ: NIPCAN
Action: Vérification + Redirection dashboard
```

### 2. Nouvelle Candidature
```
Page: /candidature/:concours
Champ: NIPCAN (pré-rempli si localStorage)
Action: Réutilisation du NIPCAN existant
```

### 3. Récupération de Données
```
API: GET /api/candidats/nipcan/:nipcan/dashboard
Retour: Toutes les candidatures du candidat
```

---

## 🔍 Vérification NIPCAN

### Requêtes SQL Utiles

```sql
-- 1. Vérifier si un NIPCAN existe
SELECT * FROM candidats WHERE nipcan = 'NIP2026000001';

-- 2. Compter les candidatures d'un NIPCAN
SELECT COUNT(*) as total_candidatures 
FROM candidats 
WHERE nipcan = 'NIP2026000001';

-- 3. Voir toutes les candidatures d'un NIPCAN
SELECT 
    c.nupcan,
    c.nipcan,
    con.libcnc as concours,
    f.nomfil as filiere,
    c.created_at
FROM candidats c
LEFT JOIN concours con ON c.concours_id = con.id
LEFT JOIN filieres f ON c.filiere_id = f.id
WHERE c.nipcan = 'NIP2026000001'
ORDER BY c.created_at DESC;

-- 4. Voir le dernier NIPCAN créé
SELECT nipcan, nomcan, prncan, created_at 
FROM candidats 
WHERE nipcan IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Statistiques NIPCAN par année
SELECT 
    SUBSTRING(nipcan, 4, 4) as annee,
    COUNT(DISTINCT nipcan) as total_candidats
FROM candidats 
WHERE nipcan IS NOT NULL
GROUP BY SUBSTRING(nipcan, 4, 4);
```

---

## ⚠️ Points Importants

### 1. Unicité
- ✅ Un NIPCAN = Un candidat unique
- ✅ Un candidat peut avoir plusieurs NUPCAN (candidatures)
- ✅ Le NIPCAN ne change JAMAIS

### 2. Permanence
- ✅ Valable pour toutes les années
- ✅ Utilisable pour tous les concours
- ✅ Conservé même après validation/rejet

### 3. Sécurité
- ✅ Format validé (regex)
- ✅ Existence vérifiée avant connexion
- ✅ Unique en base de données (contrainte UNIQUE)

### 4. Récupération
Si un candidat perd son NIPCAN :
1. Contacter l'administration
2. Vérification identité (email, nom, prénom)
3. Récupération via requête SQL

```sql
SELECT nipcan 
FROM candidats 
WHERE maican = 'email@example.com' 
AND nomcan = 'DUPONT' 
AND prncan = 'Jean'
LIMIT 1;
```

---

## 📊 Schéma Récapitulatif

```
┌─────────────────────────────────────────────────────┐
│           PREMIÈRE INSCRIPTION                       │
│                                                      │
│  Formulaire → Backend → Génération NIPCAN           │
│                           ↓                          │
│                    NIP2026000001                     │
│                           ↓                          │
│              Stockage en base de données             │
│                           ↓                          │
│                   Email envoyé                       │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│         CANDIDATURES SUIVANTES                       │
│                                                      │
│  Formulaire (NIPCAN pré-rempli) → Backend           │
│                           ↓                          │
│              Réutilisation NIP2026000001             │
│                           ↓                          │
│         Nouveau NUPCAN (20260120-5)                  │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│              CONNEXION DASHBOARD                     │
│                                                      │
│  Saisie NIPCAN → Vérification → Dashboard           │
│                           ↓                          │
│        Affichage toutes les candidatures             │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Résumé

| Aspect | Détail |
|--------|--------|
| **Création** | Lors de la première inscription |
| **Format** | NIP + Année + 6 chiffres |
| **Unicité** | Un par candidat (permanent) |
| **Usage** | Connexion + Multi-candidature |
| **Stockage** | Table candidats (colonne nipcan) |
| **Compteur** | Table nipcan_counters (par année) |
| **Email** | Envoyé automatiquement |
| **Sécurité** | Validé + Vérifié avant accès |

---

**Date:** 3 avril 2026
**Version:** 1.0
