<script setup lang="ts">
/**
 * VaultBanner — Temporary vault warning for anonymous sessions.
 *
 * Displayed when the user is authenticated but hasn't linked an email.
 * Uses the Indigo/Mauve color palette for a luxurious feel.
 *
 * Security rationale:
 *   Anonymous sessions are device-bound. If the user clears their
 *   cache or changes phone, their vault is lost forever.
 *   This banner encourages them to convert to a permanent account.
 */
import { ShieldAlert, Mail } from 'lucide-vue-next'

const { isAnonymous } = useAuth()

const isDismissed = ref(false)

const isVisible = computed(() => isAnonymous.value && !isDismissed.value)

function dismiss() {
  isDismissed.value = true
  // Re-show after 24 hours (stored in localStorage)
  if (import.meta.client) {
    localStorage.setItem('noa:vault-banner-dismissed', Date.now().toString())
  }
}

function linkEmail() {
  // TODO: Trigger email linking flow (Phase 2)
  // This will open a modal with email/password form
}

// Check if banner was recently dismissed
onMounted(() => {
  if (import.meta.client) {
    const dismissedAt = localStorage.getItem('noa:vault-banner-dismissed')
    if (dismissedAt) {
      const elapsed = Date.now() - Number.parseInt(dismissedAt, 10)
      const twentyFourHours = 24 * 60 * 60 * 1000
      if (elapsed < twentyFourHours) {
        isDismissed.value = true
      }
    }
  }
})
</script>

<template>
  <Transition name="banner">
    <div
      v-if="isVisible"
      class="mx-5 sm:mx-8 mt-4 px-5 py-3.5 rounded-2xl border flex items-center gap-4"
      style="
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.06));
        border-color: rgba(99, 102, 241, 0.2);
      "
    >
      <div class="p-2 rounded-xl shrink-0" style="background: rgba(99, 102, 241, 0.12);">
        <ShieldAlert class="size-4" style="color: #818cf8;" :stroke-width="1.5" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-xs font-light" style="color: #a5b4fc;">
          Votre coffre est temporaire.
        </p>
        <p class="text-[10px] mt-0.5" style="color: rgba(165, 180, 252, 0.5);">
          Liez un email pour sécuriser vos données à vie.
        </p>
      </div>

      <button
        class="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-all duration-300 hover:opacity-80"
        style="background: rgba(99, 102, 241, 0.2); color: #c7d2fe;"
        @click="linkEmail"
      >
        <Mail class="size-3" />
        Lier un email
      </button>

      <button
        class="shrink-0 p-1 rounded-lg transition-colors hover:bg-white/[0.04]"
        @click="dismiss"
      >
        <span class="text-[10px]" style="color: rgba(165, 180, 252, 0.3);">✕</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.banner-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.banner-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.banner-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>