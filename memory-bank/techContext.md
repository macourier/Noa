# Tech Context — Noa

## Stack Technique (Luxe Stack — Last updated 2026-04-14)
- **Runtime** : Node.js 20+
- **Framework** : Nuxt 4 (Vue 3, Nitro, SSR/SPA)
- **Langage** : TypeScript (strict)
- **Styling** : Tailwind CSS v4 + Shadow Velvet Theme (indigo/violet)
- **Auth** : Appwrite SDK (anonymous + email conversion)
- **Backend** : Appwrite (Auth, Database, Storage)
- **Base de données** : Appwrite Database (permissions Owner Only)
- **Monitoring** : Sentry
- **Testing** : Vitest + @vue/test-utils
- **Linting** : ESLint + Prettier
- **Git hooks** : Husky + lint-staged
- **Sécurité** : Zod validation, MIME sanitization, slugified filenames

## Commandes
- `npm run dev` — Serveur de développement Nuxt
- `npm run build` — Build production
- `npm run preview` — Prévisualisation build
- `npm run test` — Lancer les tests Vitest
- `npm run lint` — Linter le code
- `npm run type-check` — Vérification TypeScript

## Environnement
- Variables d'environnement dans `.env` (jamais commité)
- Template dans `.env.example`

## Dépendances clés
- `nuxt` : Framework principal (v4, Nitro)
- `appwrite` : SDK client Auth/DB/Storage
- `node-appwrite` : SDK serveur Appwrite (admin)
- `@sentry/vue` : Monitoring erreurs
- `tailwindcss` v4 : Utility-first CSS
- `zod` : Validation schemas

## Zones protégées
- `app/plugins/appwrite.ts` — Init Appwrite, impact projet complet
- `app/composables/useAuth.ts` — Logique d'authentification
- `app/utils/security.ts` — Utilitaires sécurité (sanitization, Vault)
- `.env` — Secrets et configuration (jamais commité)

## Conventions critiques
- Permissions Appwrite : Toujours "Owner Only" sur les collections
- Upload : MIME check (PDF + images uniquement), noms slugifiés
- Chiffrement : Champ `metadata` prêt pour chiffrement client-side (Phase 3)
- Session anonyme : Banner d'avertissement pour conversion email
