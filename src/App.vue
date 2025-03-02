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
  <div class="min-h-screen bg-gradient-to-br from-blue-200 to-blue-500">
    <HomeView />
    <DevTools />
  </div>
</template>
