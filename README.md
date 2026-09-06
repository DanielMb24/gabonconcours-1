# GabConcours - Plateforme de Gestion des Concours

## 🎓 Description

GabConcours est une plateforme complète de gestion des concours nationaux permettant aux candidats de s'inscrire, soumettre leurs documents et effectuer leurs paiements en ligne, tandis que les administrateurs peuvent gérer l'ensemble du processus.

Consulter le [Guide utilisateur GabConcours](GUIDE_UTILISATEUR.md) pour le parcours candidat, la gestion administrative des documents et le fonctionnement prévu de l'assistance IA.

## ✨ Fonctionnalités

### Pour les Candidats
- ✅ Inscription en ligne avec génération de NUPCAN
- ✅ Barre de progression en 3 étapes (Inscription → Documents → Paiement)
- ✅ Soumission et gestion des documents requis
- ✅ Modification/suppression des documents non validés
- ✅ Remplacement des documents rejetés
- ✅ Paiement en ligne (Airtel Money, Moov Money), pour l'instant statique, juste enregistrement dans la base de données
- ✅ Génération automatique de reçus PDF
- ✅ Notifications en temps réel
- ✅ Messagerie avec l'administration
- ✅ Tableau de bord personnel
- ✅ Support multilingue (FR/EN)
- ✅ Mode sombre/clair

### Pour les Super Administrateur
- ✅ Tableau de bord avec statistiques complètes
- ✅ Gestion des concours, filières, filiere_matieres, concours_filieres et établissements

- ✅ Création d'administrateurs par établissement 
- ✅ Gestion des permissions (Super Admin, Admin Établissement)
- ✅ Exports PDF et Excel (candidats, documents, paiements)
- ✅ Messagerie avec les candidats
- ✅ Profil administrateur modifiable
- ✅ Changement de mot de passe
- ✅ Notifications email automatiques

### Pour les Administrateurs
- ✅ Tableau de bord avec statistiques complètes

- ✅ Validation/rejet des documents avec commentaires
- ✅ Gestion des paiements
- ✅ Création d'administrateurs par établissement avec rôles

- ✅ Exports PDF et Excel (candidats, documents, paiements)
- ✅ Messagerie avec les candidats
- ✅ Profil administrateur modifiable
- ✅ Changement de mot de passe
- ✅ Notifications email automatiques
## 🛠️ Technologies

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- React Router
- Axios
- React Query

### Backend
- Node.js + Express
- MySQL
- Nodemailer (emails)
- PDFKit (génération PDF)
- ExcelJS (exports Excel)
- bcrypt (sécurité mots de passe)

## 📦 Installation

### Prérequis
- Node.js 16+
- MySQL 8+
- npm ou yarn

### 1. Cloner le projet
```bash
git clone <repository-url>
cd gabconcours
```

### 2. Installer les dépendances
```bash
# Installation complète
npm install
```

### 3. Configuration de la base de données

Exécuter les scripts SQL dans l'ordre:
```bash
mysql -u root -p < backend/scripts/complete-database-schema.sql
mysql -u root -p < backend/scripts/add-indexes.sql
mysql -u root -p < backend/scripts/fix-paiements-table.sql
mysql -u root -p < backend/scripts/add-notifications-table.sql
mysql -u root -p < backend/scripts/add-messages-table.sql
```

### 4. Configuration des variables d'environnement

Créer un fichier `.env` dans le dossier `backend`:
```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gabconcours

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app
FROM_EMAIL=noreply@gabconcours.com

# Frontend URL
FRONTEND_URL=http://localhost:8080

# Server
PORT=3001
```

### 5. Démarrer l'application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (depuis la racine)
npm run dev
```

L'application sera accessible sur:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

## 🔐 Comptes de test

### Administrateur Super Admin
```
Email: admin@gabconcours.com
Mot de passe: admin123
```

## 📱 Système de notifications

- Notifications en temps réel dans l'application
- Emails automatiques pour chaque action:
  - Validation/rejet de document
  - Confirmation de paiement
  - Nouveaux messages
  - Création de compte admin

## 🎨 Personnalisation

### Thème
- Mode sombre/clair disponible via le bouton en haut à droite
- Personnalisation via `src/index.css` et `tailwind.config.ts`

### Langues
- Français (par défaut)
- Anglais
- Ajout de nouvelles langues via `src/contexts/LanguageContext.tsx`

## 📊 Exports

Les administrateurs peuvent exporter:
- Liste des candidats par concours (PDF/Excel)
- Statuts des documents (Excel)
- Suivi des paiements (Excel)

## 🔒 Sécurité

- Validation côté client et serveur
- Protection CSRF
- Hachage des mots de passe avec bcrypt
- Validation des fichiers uploadés (taille max 2MB, type MIME)
- Gestion des permissions par rôle
- Sanitization des données
- Tokens sécurisés pour les sessions admin

## 📈 Performance

- Index MySQL sur les colonnes clés (`nupcan`, `candidat_id`, `concours_id`)
- Optimisation des requêtes SQL avec JOIN
- Chargement paresseux des composants React
- Mise en cache des données fréquemment accédées

## 🐛 Dépannage

### Erreur de connexion à la base de données
Vérifier les credentials dans le fichier `.env`

### Erreur d'envoi d'email
Vérifier la configuration SMTP et activer "Applications moins sécurisées" pour Gmail ou utiliser un "App Password"

### Erreur 500 sur les paiements
1. Exécuter le script `backend/scripts/fix-paiements-table.sql`
2. Vérifier que la colonne `nupcan` existe dans la table `paiements`

### Documents non uploadés
Vérifier que le dossier `backend/uploads` existe et a les bonnes permissions

## 📝 Structure du projet

```
gabconcours/
├── backend/
│   ├── config/          # Configuration DB
│   ├── models/          # Modèles de données
│   ├── routes/          # Routes API
│   ├── services/        # Services (PDF, Email)
│   ├── middleware/      # Middleware (validation fichiers)
│   ├── scripts/         # Scripts SQL
│   ├── uploads/         # Fichiers uploadés
│   └── server.js        # Point d'entrée backend
├── src/
│   ├── components/      # Composants React
│   │   ├── admin/       # Composants admin
│   │   └── ui/          # Composants UI Shadcn
│   ├── pages/           # Pages de l'application
│   ├── contexts/        # Contextes React
│   ├── hooks/           # Hooks personnalisés
│   ├── services/        # Services frontend (API)
│   ├── utils/           # Utilitaires
│   └── types/           # Types TypeScript
└── public/              # Fichiers statiques
```

## 🚀 Déploiement

### Production
1. Build du frontend: `npm run build`
2. Configurer nginx/apache pour servir les fichiers statiques
3. Configurer les variables d'environnement de production
4. Démarrer le backend avec PM2: `pm2 start backend/server.js`

## 🔄 Workflows

### Parcours candidat
1. Inscription → Génération NUPCAN
2. Soumission documents → Validation admin
3. Paiement → Génération reçu PDF
4. Confirmation → Email + Notification

### Parcours admin
1. Connexion
2. Validation documents avec commentaires
3. Gestion paiements
4. Exports et statistiques

## 📚 API Endpoints

### Candidats
- `POST /api/candidats` - Créer un candidat
- `GET /api/candidats/nupcan/:nupcan` - Récupérer par NUPCAN

### Paiements
- `POST /api/paiements` - Créer un paiement
- `GET /api/paiements/nupcan/:nupcan` - Récupérer par NUPCAN

### Documents
- `POST /api/dossiers` - Soumettre un document
- `PUT /api/documents/:id/replace` - Remplacer un document
- `DELETE /api/documents/:id` - Supprimer un document
- `PUT /api/document-validation/:id` - Valider/Rejeter

### Admin
- `POST /api/admin/management/admins` - Créer un admin
- `PUT /api/admin/management/admins/:id/password` - Changer mot de passe

### Exports
- `GET /api/exports/candidats/:concoursId/pdf` - Export PDF
- `GET /api/exports/candidats/:concoursId/excel` - Export Excel

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de:
1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Support

Pour toute question : support@gabconcours.com
