<script setup lang="ts">
import type { Component } from 'vue'
import { Loader2, Sparkles } from 'lucide-vue-next'

export type TileStatus = 'action' | 'ok' | 'alerte'

interface Props {
  title: string
  subtitle: string
  icon: Component
  status?: TileStatus
  uploading?: boolean
  analyzing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: 'ok',
  uploading: false,
  analyzing: false,
})

const emit = defineEmits<{
  open: []
}>()

const statusConfig = computed(() => {
  if (props.uploading) {
    return {
      dot: 'bg-primary animate-pulse',
      glow: 'glow-action',
      label: 'Upload',
      labelClass: 'text-primary',
    }
  }
  if (props.analyzing) {
    return {
      dot: 'bg-accent animate-pulse',
      glow: 'glow-action',
      label: 'Analyse',
      labelClass: 'text-accent',
    }
  }
  switch (props.status) {
    case 'action':
      return {
        dot: 'bg-primary',
        glow: 'glow-action',
        label: 'Action',
        labelClass: 'text-primary',
      }
    case 'alerte':
      return {
        dot: 'bg-warning',
        glow: 'glow-warning',
        label: 'Alerte',
        labelClass: 'text-warning',
      }
    default:
      return {
        dot: 'bg-ok',
        glow: 'glow-ok',
        label: 'OK',
        labelClass: 'text-ok',
      }
  }
})
</script>

<template>
  <article
    class="relative p-5 sm:p-6 bg-surface/60 rounded-3xl border border-white/[0.06] tile-hover cursor-pointer group overflow-hidden"
    :class="[statusConfig.glow, { 'ring-1 ring-primary/30': uploading, 'ring-1 ring-accent/30': analyzing }]"
    @click="!uploading && !analyzing && emit('open')"
  >
    <!-- Shimmer overlay for uploading -->
    <div
      v-if="uploading || analyzing"
      class="absolute inset-0 pointer-events-none"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
    </div>

    <!-- Header row -->
    <div class="relative flex justify-between items-start mb-5">
      <div class="p-2.5 bg-base/80 rounded-2xl border border-white/[0.06] group-hover:border-primary/30 transition-colors duration-500">
        <Loader2 v-if="uploading" class="size-5 text-primary animate-spin" :stroke-width="1.5" />
        <Sparkles v-else-if="analyzing" class="size-5 text-accent animate-pulse" :stroke-width="1.5" />
        <component v-else :is="props.icon" class="size-5 text-white/40 group-hover:text-primary transition-colors duration-500" :stroke-width="1.5" />
      </div>
      <span class="text-[10px] font-semibold uppercase tracking-[0.18em] mt-1" :class="statusConfig.labelClass">
        {{ statusConfig.label }}
      </span>
    </div>

    <!-- Content -->
    <div class="relative space-y-1">
      <h3 class="text-[11px] font-medium text-white/30 uppercase tracking-[0.2em]">
        {{ title }}
      </h3>
      <p class="text-xl sm:text-2xl font-light text-white tracking-tight leading-none">
        {{ subtitle }}
      </p>
    </div>

    <!-- Bottom glow line -->
    <div class="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
  </article>
</template>
