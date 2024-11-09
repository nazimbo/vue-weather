<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import WeatherSearch from '../components/WeatherSearch.vue';
import WeatherCurrent from '../components/WeatherCurrent.vue';

// Lazy load the forecast component
const WeatherForecast = defineAsyncComponent(() =>
  import('../components/WeatherForecast.vue')
);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-center text-blue-800 mb-8">
      Weather App
    </h1>
    <WeatherSearch />
    <WeatherCurrent />
    <Suspense>
      <WeatherForecast />
      <template #fallback>
        <div class="text-center text-gray-600">
          Loading forecast...
        </div>
      </template>
    </Suspense>
  </div>
</template>