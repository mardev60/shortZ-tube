# ShortZ - Transformez vos vidéos en shorts viraux

ShortZ est une application SaaS qui permet de transformer facilement vos vidéos en shorts viraux optimisés pour les réseaux sociaux.

## Fonctionnalités

- Téléchargement de vidéos sources
- Génération de shorts optimisés pour différentes plateformes (TikTok, Instagram, YouTube)
- Analyse du potentiel viral de chaque short
- Interface utilisateur moderne et intuitive

## Architecture technique

Le projet utilise une architecture moderne avec les technologies suivantes :

### Frontend
- Angular 19 avec composants standalone
- Tailwind CSS pour le styling
- Signals pour la gestion d'état

### Backend
- NestJS pour l'API REST
- AWS S3 pour le stockage des vidéos
- Deepgram pour la transcription audio avec timeframes
- OpenAI GPT pour l'analyse du contenu et l'identification des moments viraux
- FFMPEG pour le traitement vidéo

## Structure du projet

Le projet est divisé en deux parties principales :

- `client` : Application frontend Angular avec Tailwind CSS
- `server` : API backend NestJS avec intégration AWS, Deepgram, OpenAI et FFMPEG

## Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Angular CLI (v19 ou supérieur)
- FFMPEG installé sur le système (ou chemin configuré dans .env)
- Comptes et clés API pour :
  - AWS S3
  - Deepgram
  - OpenAI

## Installation

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/mardev60/shortZ-tube
   cd shortz
   ```

2. Installez les dépendances du client :
   ```bash
   cd client
   npm install
   ```

3. Installez les dépendances du serveur :
   ```bash
   cd ../server
   npm install
   ```

4. Configurez les variables d'environnement :
   ```bash
   cp .env.example .env
   # Éditez le fichier .env avec vos clés API
   ```

## Développement

### Client

Pour lancer le serveur de développement du client :

```bash
cd client
ng serve
```

L'application sera accessible à l'adresse `http://localhost:4200/`.

### Serveur

Pour lancer le serveur de développement backend :

```bash
cd server
npm run start:dev
```

Le serveur sera accessible à l'adresse `http://localhost:3000/`.

## Workflow de génération de shorts

1. L'utilisateur télécharge une vidéo source
2. La vidéo est envoyée à AWS S3 pour stockage
3. L'URL de la vidéo est envoyée à Deepgram pour obtenir une transcription avec timeframes
4. La transcription est analysée par GPT pour identifier les moments les plus viraux
5. FFMPEG découpe la vidéo en shorts selon les timeframes identifiés
6. Les shorts générés sont renvoyés à l'utilisateur avec leur score de viralité

## Déploiement

### Client

Pour construire l'application client pour la production :

```bash
cd client
ng build --configuration production
```

Les fichiers générés seront disponibles dans le répertoire `client/dist/`.

### Serveur

Pour construire le serveur pour la production :

```bash
cd server
npm run build
```

Les fichiers générés seront disponibles dans le répertoire `server/dist/`.

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 