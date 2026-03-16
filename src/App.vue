<script setup lang="ts">
  import { onMounted, onBeforeUnmount } from 'vue';
  import { useWeatherStore } from './stores/weatherStore';
  import HomeView from './views/HomeView.vue';
  import DevTools from './components/DevTools.vue';

  const weatherStore = useWeatherStore();

  onMounted(() => {
    weatherStore.initialize();
  });

  onBeforeUnmount(() => {
    weatherStore.cleanup();
  });
</script>

<template>
  <div class="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
    <!-- Ambient background -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <!-- Gradient base -->
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#0a0e1a] to-slate-950/80"></div>

      <!-- Floating orbs -->
      <div class="absolute w-[500px] h-[500px] -top-32 -left-32 rounded-full bg-indigo-600/20 blur-[120px] animate-drift"></div>
      <div class="absolute w-[400px] h-[400px] top-1/3 -right-20 rounded-full bg-violet-600/15 blur-[100px] animate-drift delay-2000"></div>
      <div class="absolute w-[350px] h-[350px] bottom-0 left-1/3 rounded-full bg-sky-600/10 blur-[100px] animate-drift delay-3000"></div>

      <!-- Subtle grid overlay -->
      <div class="absolute inset-0 opacity-[0.03]"
        style="background-image: radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px); background-size: 40px 40px;">
      </div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <HomeView />
      <DevTools />
    </div>
  </div>
</template>
