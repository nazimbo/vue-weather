<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import WeatherSearch from '../components/WeatherSearch.vue';
import WeatherCurrent from '../components/WeatherCurrent.vue';

// Lazy load heavier components
const WeatherHourly = defineAsyncComponent(() =>
  import('../components/WeatherHourly.vue')
);
const WeatherForecast = defineAsyncComponent(() =>
  import('../components/WeatherForecast.vue')
);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="text-center mb-8">
      <h1 class="text-4xl font-bold text-blue-800 mb-2">
        Weather App
      </h1>
      <p class="text-gray-600">
        Get detailed weather information for any location
      </p>
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
        <div class="text-center text-gray-600 my-8">
          <div class="animate-spin rounded-full h-12 w-12 border-4 
                      border-blue-600 border-t-transparent mx-auto mb-4">
          </div>
          <p>Loading weather information...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>