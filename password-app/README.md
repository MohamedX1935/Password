# Password Lab (monorepo)

Monorepo pédagogique React + Express + TypeScript pour analyser la robustesse de mots de passe, estimer des temps de cassage et générer des mots de passe sécurisés. Aucune persistance ni journalisation des secrets : l'historique ne conserve qu'un résumé anonymisé.

## Architecture
```
/password-app
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── apps
│   ├── api (Express, Zod, sécurité)
│   └── web (React + Vite + Tailwind)
└── packages
    └── core (logique d'analyse & génération partagée)
```

## Installation & commandes
```bash
pnpm i          # installe les dépendances de tous les workspaces
pnpm dev        # lance api (3001) + web (5173) en parallèle
pnpm build      # build core + api + web
pnpm test       # tests Vitest du package core
pnpm lint       # lint TypeScript/React
```

Variables d'environnement (cf. `.env.example`) :
- `VITE_API_URL` : URL du backend (dev: http://localhost:3001)
- `FRONTEND_ORIGIN` : origine autorisée CORS pour l'API (dev: http://localhost:5173)

## Méthodologie d'analyse (packages/core)
- **Entropie brute** : `longueur × log2(taille du jeu de caractères réellement utilisé)`.
- **Détection & pénalités** : répétitions, motifs répétés, suites simples, mots courants (avec normalisation leet), dates probables, faible diversité. L'entropie effective est plafonnée si un mot courant est détecté.
- **Score / label** : mappage de l'entropie effective → score 0-100 et labels `Très faible` à `Très fort`.
- **Temps de cassage (estimation)** : guesses ≈ `2^(entropie effective - 1)` puis scénarios :
  - offline rapide : 10^10 guesses/s
  - offline moyen : 10^8 guesses/s
  - online limité : 10 guesses/s
  Formatage humain : « < 1 seconde », « x minutes », « x heures », « x jours », « x ans », « milliers d'années » (toujours indiqué comme estimation).
- **Suggestions personnalisées** : 3-8 actions concrètes liées aux faiblesses détectées avec impact estimé en bits quand pertinent.

## API (apps/api)
- `GET /api/health` → statut + disclaimer
- `POST /api/analyze` `{ password }` → analyse complète + disclaimer
- `POST /api/generate` `{ options }` → mot de passe généré + analyse + disclaimer
- Validation Zod, CORS configurable, Helmet, rate limit (30 requêtes/min), pas de logs du body. Mot de passe jamais persisté.

## Frontend (apps/web)
- Onglets : Analyse (locale ou serveur), Générateur (analyse immédiate), Historique (10 derniers résumés anonymisés), Méthode (explications & limites).
- Tailwind + mode sombre. Pas de console.log de secrets, pas de stockage du mot de passe (seulement des résumés : date, longueur, score, entropie effective, temps offline rapide).

## Sécurité & éthique
- Outil strictement éducatif : aucune indication d'attaque ou de cassage réel.
- Les résultats sont **des estimations**, jamais des durées exactes.
- Pas de persistance ni journalisation des mots de passe côté API ou Web. Historique local = résumé uniquement.
- Génération sécurisée via RNG cryptographique (Web Crypto / Node crypto), jamais `Math.random`.

## Tests
- Vitest couvre :
  - Séquence numérique faible `123456` → label très faible + pattern suite détecté.
  - Mot courant leet `P@ssw0rd` → pénalité et détection.
  - Passphrase longue diverse → score élevé.
  - Générateur respecte `requireEachSelectedType`.
