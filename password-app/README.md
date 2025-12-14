# Password Lab (Monorepo)

Application pédagogique d'analyse et de génération de mots de passe. L'objectif est de montrer comment estimer la
robustesse (entropie brute/effective), proposer des suggestions concrètes et illustrer des temps de cassage sous
plusieurs scénarios. Toutes les estimations sont approximatives : il ne s'agit pas de durées exactes.

## Structure
```
/password-app
  /apps
    /web   (Frontend React + Vite + Tailwind)
    /api   (Backend Express + TypeScript)
  /packages
    /core  (logique partagée d'analyse et génération)
```

## Prérequis
- Node.js 18+
- pnpm (recommandé) : `corepack enable` puis `corepack prepare pnpm@8.15.4 --activate`

## Installation
```bash
pnpm install
```

## Démarrer en développement
```bash
pnpm dev
```
- Frontend : http://localhost:5173
- API : http://localhost:3001

## Build
```bash
pnpm build
```

## Tests
```bash
pnpm test
```
(Lance les tests Vitest sur `packages/core`).

## Configuration
Créer un fichier `.env` (ou copier `.env.example`) pour définir l'URL de l'API utilisée par le frontend :
```
VITE_API_URL=http://localhost:3001
```

## Méthode de calcul (résumé)
- Entropie brute : longueur x log2(taille du jeu de caractères détecté).
- Détection de motifs (répétitions, suites, dates, mots courants / leet) avec pénalités en bits.
- Entropie effective = entropie brute - pénalités (plafonnée si mot courant).
- Score 0-100 dérivé de l'entropie effective et label (Très faible -> Très fort).
- Temps de cassage (estimation) basés sur un nombre moyen d'essais :
  - Offline rapide : 1e10 essais/s
  - Offline moyen : 1e8 essais/s
  - Online limité : 10 essais/s
- Suggestions personnalisées ordonnées par impact estimé.

## Limites et avertissements
- Outil **éducatif** uniquement. Ne pas utiliser pour des mots de passe réels ou sensibles.
- Les vitesses d'attaque et les entropies sont des **estimations** et non des durées exactes.
- Aucun mot de passe n'est stocké : l'historique local garde uniquement des métriques anonymes.
- Le backend applique Helmet, CORS, rate limiting, validation Zod et ne journalise pas les mots de passe.
