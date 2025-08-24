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
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -inset-10 opacity-30">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div class="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>
    </div>
    
    <!-- Main content -->
    <div class="relative z-10">
      <HomeView />
      <DevTools />
    </div>
  </div>
</template>
