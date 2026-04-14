<script setup lang="ts">
import { Shield } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-base">
    <!-- Header -->
    <header class="sticky top-0 z-40 px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/[0.04] bg-base/80 backdrop-blur-xl">
      <div class="flex items-center gap-3">
        <div class="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Shield class="size-4 text-primary" :stroke-width="1.5" />
        </div>
        <div>
          <h1 class="text-sm font-medium text-white tracking-tight leading-none">NOA</h1>
          <p class="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-0.5">OS</p>
        </div>
      </div>

      <!-- Status dot -->
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-1.5 rounded-full bg-ok glow-ok" />
        <span class="text-[10px] text-white/20 uppercase tracking-widest hidden sm:block">En ligne</span>
      </div>
    </header>

    <!-- Page content -->
    <main class="p-5 sm:p-8">
      <slot />
    </main>
  </div>
</template>