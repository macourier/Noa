# Architecture Map — NOA OS

> NOA: "Sentry de la vie quotidienne" — OS de luxe pour la gestion administrative.

## Stack

- **Framework**: Nuxt 4 (Nitro)
- **BaaS**: Appwrite
- **UI**: Tailwind CSS (Shadow Velvet theme)
- **State**: Vue 3 Composables
- **PWA**: Vite PWA Plugin

## Boundary Classification

| Module/Path Pattern | Criticality | Change Policy | Required Checks |
|---------------------|-------------|---------------|-----------------|
| `app/plugins/appwrite.ts` | critical | Appwrite client singleton, auth config | Integration test |
| `app/composables/useAuth.ts` | critical | Auth flow, anonymous sign-in | Auth flow test |
| `app/composables/useSentry.ts` | high | Document analysis engine | Unit + integration test |
| `app/composables/useTiles.ts` | medium | Tile state management | State tests |
| `app/composables/useSwipeDown.ts` | low | Mobile gesture | Manual test on device |
| `app/components/Tile.vue` | medium | Tile rendering + glow effects | Visual regression |
| `app/components/TilePanel.vue` | medium | Panel morphing (mobile/desktop) | Responsive test |
| `app/components/FileIngestor.vue` | high | File upload + progress | Upload flow test |
| `app/pages/index.vue` | medium | Dashboard layout | E2E test |
| `app/assets/css/main.css` | medium | Design tokens + animations | Visual regression |
| `nuxt.config.ts` | critical | Nitro config, modules, PWA | Build verification |
| `tailwind.config.ts` | high | Shadow Velvet design system | Visual regression |

## NOA-Specific Module Boundaries

### Dashboard (Bento Grid)
- Tiles are rendered in a responsive grid (1 col mobile → 4 cols desktop)
- First tile spans 2 cols + 2 rows on desktop
- View Transitions API for tile morphing

### Auth Flow
- Anonymous auth on first visit (Appwrite)
- Future: full account creation with email/OAuth

### Document Engine (useSentry)
- Simulated analysis with shimmer effect
- Future: real OCR + AI analysis via Appwrite Functions

### PWA
- Standalone mode for mobile install
- Service worker for offline capability

## Required Agent Behavior

1. Before editing a `critical` area, load review checklists.
2. For boundary-crossing changes, verify no circular dependencies.
3. Every critical-path change must include explicit risk notes.