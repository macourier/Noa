# System Patterns — Noa

## Architecture
- **Pattern** : Nuxt 3 App Router (Pages + Composables)
- **State** : Composables Vue 3 (useAuth, useTiles, etc.)
- **Data** : Supabase (PostgreSQL) via client direct
- **Auth** : Appwrite SDK

## Conventions de code
- Composables : `use*.ts` dans `app/composables/`
- Components : PascalCase dans `app/components/`
- Pages : `app/pages/`
- Layouts : `app/layouts/`

## Patterns en vigueur
- Tile-based UI pour navigation
- Swipe-down pour interactions mobile
- Composables pour logique réutilisable
- Plugins pour initialisation (Appwrite, Sentry)

## Anti-patterns évités
- Pas de logique métier dans les composants UI
- Pas d'appels DB directs dans les pages
- Pas de state global non typé