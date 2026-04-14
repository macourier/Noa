# Dependency Map — NOA OS

> NOA: Nuxt 4 + Appwrite + Tailwind CSS

## Layer Dependency Rules

1. Pages may depend on Components and Composables.
2. Composables may depend on Plugins (Appwrite client).
3. Components may depend on Composables but NOT on Plugins directly.
4. Plugins are initialized once at app startup (Appwrite client).

## Module-Level Constraints

| Source Module | Allowed Dependencies | Forbidden Dependencies |
|---------------|----------------------|------------------------|
| `app/pages/` | `components/`, `composables/`, `layouts/` | Direct `plugins/` usage |
| `app/components/` | `composables/`, `assets/` | Direct Appwrite calls |
| `app/composables/` | `plugins/` (via useNuxtApp), Vue APIs | UI components |
| `app/plugins/` | `node_modules` (appwrite SDK) | Composables, Components |
| `app/layouts/` | `components/` | Composables with side effects |

## Circular Dependency Guardrail

When refactoring:

1. Detect import graph changes before applying bulk edits.
2. Reject any change introducing `A -> B -> A` cycles.
3. Move shared logic to composables when two-way dependencies appear.

## External Dependencies

| Package | Purpose | Justified |
|---------|---------|-----------|
| `appwrite` | BaaS SDK (auth, DB, storage) | Yes — core backend |
| `lucide-vue-next` | Icon library | Yes — lightweight, tree-shakeable |
| `@vueuse/core` | Vue composition utilities | Yes — stdlib for Vue |
| `tailwind-merge` | Utility class merging | Yes — prevents Tailwind conflicts |
| `@vite-pwa/nuxt` | PWA support | Yes — installable app requirement |