# Episodes — Noa

## Dernière mise à jour
2026-04-14

## Format
```
### EP-XXX : Titre court
- **Date** : YYYY-MM-DD
- **Type** : feature | fix | refactor | config | spike
- **Risque** : LOW | MEDIUM | HIGH
- **Décision liée** : DEC-XXX
- **Résumé** : Ce qui a été fait en 1-2 phrases
- **Leçons** : Ce qu'on a appris
```

## Historique

### EP-001 : Setup initial du projet
- **Date** : 2026-04
- **Type** : config
- **Risque** : LOW
- **Décision liée** : DEC-001
- **Résumé** : Initialisation du projet Nuxt 3 avec TypeScript, Tailwind CSS 4, Appwrite et Sentry
- **Leçons** : L'intégration Appwrite nécessite un plugin côté client ; Sentry nécessite une config Nuxt spécifique

### EP-002 : Déploiement du Vibe Coding Starter Pack
- **Date** : 2026-04-14
- **Type** : config
- **Risque** : LOW
- **Décision liée** : DEC-002
- **Résumé** : Installation et adaptation du starter pack depuis GitHub, création du memory-bank et des configs
- **Leçons** : Le starter pack est conçu pour React/Next.js — nécessite adaptation pour Nuxt/Vue (composables vs hooks, pages routing)