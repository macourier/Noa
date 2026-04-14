<script setup lang="ts">
import { X } from 'lucide-vue-next'
import type { TileData } from '~/composables/useTiles'

const props = defineProps<{
  isOpen: boolean
  tile: TileData
}>()

const emit = defineEmits<{ close: [] }>()

const panelRef = ref<HTMLElement | null>(null)
const isMobile = ref(false)

useSwipeDown(panelRef, {
  threshold: 120,
  onSwipeDown: () => emit('close'),
})

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})
</script>

<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="props.isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 backdrop-dim transition-opacity duration-300"
          @click="emit('close')"
        />

        <!-- Panel -->
        <div
          ref="panelRef"
          class="absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="isMobile
            ? 'inset-0 rounded-none'
            : 'top-[8vh] left-[15vw] right-[15vw] bottom-[8vh] rounded-3xl'"
          style="background: #1c1c24; border: 1px solid rgba(255,255,255,0.06);"
        >
          <!-- Panel Header -->
          <div class="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div class="flex items-center gap-3">
              <component :is="tile.icon" class="size-5 text-white/40" :stroke-width="1.5" />
              <div>
                <h2 class="text-lg font-light text-white tracking-tight">
                  {{ tile.title }}
                </h2>
                <p class="text-xs text-white/20">{{ tile.subtitle }}</p>
              </div>
            </div>
            <button
              class="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
              @click="emit('close')"
            >
              <X class="size-5 text-white/40" />
            </button>
          </div>

          <!-- Panel Content -->
          <div class="p-5 overflow-y-auto h-[calc(100%-80px)]">
            <div class="flex items-center justify-center h-full">
              <div class="text-center space-y-3">
                <div class="p-4 rounded-2xl bg-surface/60 border border-white/[0.06] mx-auto w-fit">
                  <component :is="tile.icon" class="size-8 text-white/20" :stroke-width="1" />
                </div>
                <p class="text-white/20 text-sm">Contenu en cours de construction...</p>
                <p class="text-white/10 text-xs">Ce module sera bientôt disponible</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.3s ease;
}
.panel-enter-active > div:last-child,
.panel-leave-active > div:last-child {
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.3s ease;
}
.panel-enter-from {
  opacity: 0;
}
.panel-enter-from > div:last-child {
  transform: translateY(30px) scale(0.97);
  opacity: 0;
}
.panel-leave-to {
  opacity: 0;
}
.panel-leave-to > div:last-child {
  transform: translateY(20px) scale(0.98);
  opacity: 0;
}
</style>