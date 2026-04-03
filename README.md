# UNIKI - Université de Kindu
Système de suivi des frais académiques

## Description
Application React/Vite pour la gestion et le suivi des frais académiques des étudiants de l'Université de Kindu.

## Fonctionnalités
- **Authentification** sécurisée via Supabase
- **Tableau de bord** avec indicateurs de performance (KPI)
- **Gestion des étudiants** avec filtres par statut de paiement
- **Design responsive** avec thème sombre professionnel
- **Navigation** intuitive entre les différentes sections

## Structure du projet

```
src/
├── components/
│   └── Navbar.jsx          # Barre de navigation
├── lib/
│   └── supabase.js         # Client Supabase
├── pages/
│   ├── Login.jsx           # Page de connexion
│   ├── Dashboard.jsx       # Tableau de bord
│   └── Etudiants.jsx       # Liste des étudiants
├── App.jsx                 # Routage et gestion de session
├── main.jsx                # Point d'entrée
└── index.css               # Styles Tailwind CSS
```

## Installation

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd uniki-web
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```
   Ou si vous rencontrez des problèmes réseau :
   ```bash
   npm install @supabase/supabase-js react-router-dom recharts lucide-react tailwindcss postcss autoprefixer --save
   ```

3. **Configurer les variables d'environnement**
   - Le fichier `.env` est déjà configuré avec les clés Supabase
   - Pour un nouveau projet, créez un compte sur [Supabase](https://supabase.com)
   - Ajoutez vos variables dans `.env` :
     ```
     VITE_SUPABASE_URL=votre_url_supabase
     VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
     ```

4. **Démarrer l'application**
   ```bash
   npm run dev
   ```

L'application sera disponible sur `http://localhost:5173`

## Base de données Supabase

### Tables requises

1. **etudiants**
   ```sql
   CREATE TABLE etudiants (
     id SERIAL PRIMARY KEY,
     nom VARCHAR(100) NOT NULL,
     prenom VARCHAR(100) NOT NULL,
     numero_etudiant VARCHAR(50) UNIQUE NOT NULL,
     filiere VARCHAR(100),
     email VARCHAR(100),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **statuts_tranches**
   ```sql
   CREATE TABLE statuts_tranches (
     id SERIAL PRIMARY KEY,
     etudiant_id INTEGER REFERENCES etudiants(id),
     statut VARCHAR(20) CHECK (statut IN ('Payé', 'Partiel', 'En attente')),
     montant_total DECIMAL(10,2),
     montant_paye DECIMAL(10,2),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **vue_dashboard** (Vue pour le tableau de bord)
   ```sql
   CREATE VIEW vue_dashboard AS
   SELECT 
     COUNT(*) as total_etudiants,
     COALESCE(SUM(montant_paye), 0) as total_collecte,
     COUNT(CASE WHEN statut = 'Payé' THEN 1 END) as paiements_complets,
     COUNT(CASE WHEN statut = 'En attente' THEN 1 END) as en_attente
   FROM statuts_tranches;
   ```

## Technologies utilisées

- **React 19** - Framework frontend
- **Vite** - Outil de build
- **React Router DOM** - Routage client
- **Supabase** - Backend et authentification
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Icônes
- **Recharts** - Graphiques (pour futures fonctionnalités)

## Design System

- **Couleurs principales** :
  - Fond : `#0f172a` (slate-900)
  - Cartes : `#1e293b` (slate-800)
  - Accent : `#38bdf8` (sky-500)
- **Statuts de paiement** :
  - Payé : Vert (`bg-green-100`, `text-green-800`)
  - Partiel : Orange (`bg-orange-100`, `text-orange-800`)
  - En attente : Rouge (`bg-red-100`, `text-red-800`)

## Scripts disponibles

```bash
npm run dev      # Démarrer le serveur de développement
npm run build    # Construire pour la production
npm run preview  # Prévisualiser le build de production
npm run lint     # Linter le code
```

## Déploiement

Pour déployer en production :

1. Construire l'application :
   ```bash
   npm run build
   ```

2. Configurer les variables d'environnement sur votre plateforme d'hébergement

3. Déployer le dossier `dist` généré

## Support

Pour toute question ou problème, veuillez contacter l'équipe de développement de l'Université de Kindu.
