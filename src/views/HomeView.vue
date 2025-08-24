<script setup lang="ts">
  import { defineAsyncComponent } from 'vue';
  import WeatherSearch from '../components/WeatherSearch.vue';
  import WeatherCurrent from '../components/WeatherCurrent.vue';

  // Lazy load heavier components
  const WeatherHourly = defineAsyncComponent(() => import('../components/WeatherHourly.vue'));
  const WeatherForecast = defineAsyncComponent(() => import('../components/WeatherForecast.vue'));
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="text-center mb-12">
      <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 drop-shadow-lg">
        Weather App
      </h1>
      <p class="text-gray-300 text-lg md:text-xl font-light">Get detailed weather information for any location</p>
    </header>

    <!-- Search Component -->
    <WeatherSearch />

    <!-- Weather Information -->
    <Suspense>
      <template #default>
        <div>
          <WeatherCurrent />
          <WeatherHourly />
          <WeatherForecast />
        </div>
      </template>
      <template #fallback>
        <div class="text-center text-white/80 my-12">
          <div
            class="animate-spin rounded-full h-16 w-16 border-4 border-blue-400/30 border-t-blue-400 mx-auto mb-6 glow-animation"
          ></div>
          <p class="text-lg">Loading weather information...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>
