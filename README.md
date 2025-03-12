# ShortZ - Transformez vos vidéos en shorts viraux

ShortZ est une application SaaS qui permet de transformer facilement vos vidéos en shorts viraux optimisés pour les réseaux sociaux.

## Fonctionnalités

- Téléchargement de vidéos sources
- Génération de shorts optimisés pour différentes plateformes (TikTok, Instagram, YouTube)
- Analyse du potentiel viral de chaque short
- Interface utilisateur moderne et intuitive

## Structure du projet

Le projet est divisé en deux parties principales :

- `client` : Application frontend Angular avec Tailwind CSS
- `server` : API backend (à implémenter)

## Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Angular CLI (v19 ou supérieur)

## Installation

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/shortz.git
   cd shortz
   ```

2. Installez les dépendances du client :
   ```bash
   cd client
   npm install
   ```

3. Installez les dépendances du serveur (à venir) :
   ```bash
   cd ../server
   npm install
   ```

## Développement

### Client

Pour lancer le serveur de développement du client :

```bash
cd client
ng serve
```

L'application sera accessible à l'adresse `http://localhost:4200/`.

### Serveur (à venir)

Pour lancer le serveur de développement backend :

```bash
cd server
npm run dev
```

## Déploiement

### Client

Pour construire l'application client pour la production :

```bash
cd client
ng build --configuration production
```

Les fichiers générés seront disponibles dans le répertoire `client/dist/`.

### Serveur (à venir)

Pour construire le serveur pour la production :

```bash
cd server
npm run build
```

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 