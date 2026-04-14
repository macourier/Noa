# Product Context — Noa

## Problème
La gestion des dossiers CIR (Crédit Impôt Recherche) est complexe, avec de nombreuses sections, sous-traitances et dépenses à tracker. Les outils actuels sont soit trop génériques, soit trop complexes.

## Solution
Noa propose une interface mobile-first basée sur un système de tuiles (tiles) qui permet de naviguer rapidement entre les différentes sections d'un dossier CIR.

## Public cible
- Consultants CIR
- Responsables R&D en entreprise
- Cabinets de conseil en innovation

## Stack Technique
- **Framework** : Nuxt 3 (Vue 3)
- **UI** : Tailwind CSS + shadcn-vue
- **Auth** : Appwrite / Supabase
- **DB** : Supabase (PostgreSQL)
- **Monitoring** : Sentry
- **Testing** : Vitest

## Contraintes
- Mobile-first obligatoire
- Support offline (PWA prévue)
- Données sensibles (RGPD)