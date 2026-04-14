<script setup lang="ts">
import { Plus, Search, Bell, Shield } from 'lucide-vue-next'
import type { TileData } from '~/composables/useTiles'

const { sortedTiles, statusCounts } = useTiles()
const { user, signInAnonymously, isAnonymous } = useAuth()

const activeTile = ref<TileData | null>(null)
const isPanelOpen = ref(false)
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth < 640
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 640
  })
})

function openTile(tile: TileData) {
  activeTile.value = tile
  isPanelOpen.value = true
}

function closePanel() {
  isPanelOpen.value = false
  setTimeout(() => { activeTile.value = null }, 300)
}

function triggerFileUpload() {
  const input = document.getElementById('file-input') as HTMLInputElement
  input?.click()
}

onMounted(() => {
  if (!user.value) {
    signInAnonymously()
  }
})
</script>

<template>
  <div class="min-h-screen bg-base">
    <header class="sticky top-0 z-40 backdrop-blur-2xl bg-base/70 border-b border-white/[0.04]">
      <div class="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="size-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield class="size-4 text-white" :stroke-width="2" />
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 size-2.5 bg-ok rounded-full border-2 border-base" />
          </div>
          <div>
            <h1 class="text-sm font-semibold text-white tracking-wide">NOA</h1>
            <p class="text-[9px] text-white/20 tracking-[0.3em] uppercase">Life OS</p>
          </div>
        </div>

        <div class="hidden sm:flex items-center gap-2">
          <span v-if="statusCounts.action > 0" class="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium">
            {{ statusCounts.action }} action{{ statusCounts.action > 1 ? 's' : '' }}
          </span>
          <span v-if="statusCounts.alerte > 0" class="px-2.5 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-[10px] font-medium">
            {{ statusCounts.alerte }} alerte{{ statusCounts.alerte > 1 ? 's' : '' }}
          </span>
          <span class="px-2.5 py-1 rounded-full bg-ok/10 border border-ok/20 text-ok text-[10px] font-medium">
            {{ statusCounts.ok }} OK
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button class="p-2 rounded-xl hover:bg-white/[0.04] transition-colors text-white/30 hover:text-white/60" @click="triggerFileUpload">
            <Plus class="size-5" :stroke-width="1.5" />
          </button>
          <button class="p-2 rounded-xl hover:bg-white/[0.04] transition-colors text-white/30 hover:text-white/60">
            <Search class="size-4" :stroke-width="1.5" />
          </button>
          <button class="p-2 rounded-xl hover:bg-white/[0.04] transition-colors text-white/30 hover:text-white/60 relative">
            <Bell class="size-4" :stroke-width="1.5" />
            <span v-if="statusCounts.alerte > 0" class="absolute top-1.5 right-1.5 size-1.5 bg-warning rounded-full" />
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-5 sm:px-8 py-8">
      <div class="mb-8">
        <h2 class="text-2xl sm:text-3xl font-light text-white tracking-tight">
          Bonsoir<span class="text-primary">.</span>
        </h2>
        <p class="text-white/20 text-sm mt-1">{{ sortedTiles.length }} espaces surveillés</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div
          v-for="(tile, index) in sortedTiles"
          :key="tile.id"
          class="transition-all duration-500"
          :class="{ 'sm:col-span-2 sm:row-span-2': index === 0 && !isMobile }"
        >
          <Tile
            :title="tile.title"
            :subtitle="tile.subtitle"
            :icon="tile.icon"
            :status="tile.status"
            :uploading="tile.uploading"
            :analyzing="tile.analyzing"
            @open="openTile(tile)"
          />
        </div>
      </div>

      <!-- Anonymous vault warning — Security: remind users their vault is temporary -->
      <VaultBanner />

      <p class="text-center text-white/10 text-xs mt-12">
        Glissez-déposez un document n'importe où pour lancer l'analyse
      </p>
    </main>

    <TilePanel v-if="activeTile" :is-open="isPanelOpen" :tile="activeTile" @close="closePanel" />
    <FileIngestor :active-tile-id="activeTile?.id" />
  </div>
</template>