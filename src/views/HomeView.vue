<script setup lang="ts">
  import { defineAsyncComponent } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';
  import WeatherSearch from '../components/WeatherSearch.vue';
  import WeatherCurrent from '../components/WeatherCurrent.vue';

  const WeatherHourly = defineAsyncComponent(() => import('../components/WeatherHourly.vue'));
  const WeatherForecast = defineAsyncComponent(() => import('../components/WeatherForecast.vue'));

  const store = useWeatherStore();
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
    <!-- Header -->
    <header class="text-center mb-10 animate-fade-up">
      <div class="inline-flex items-center gap-3 mb-3">
        <span class="text-3xl sm:text-4xl animate-float">⛅</span>
        <h1 class="text-3xl sm:text-4xl font-bold text-gradient tracking-tight">Weather</h1>
      </div>
      <p class="text-white/40 text-sm font-light tracking-wide">Real-time forecasts for any location</p>
    </header>

    <!-- Search -->
    <WeatherSearch />

    <!-- Loading skeleton -->
    <div v-if="store.loading && !store.weatherData" class="animate-fade-up delay-200 mt-10 space-y-6">
      <div class="glass rounded-2xl p-8">
        <div class="flex items-center gap-6">
          <div class="w-20 h-20 rounded-2xl bg-white/5 shimmer"></div>
          <div class="flex-1 space-y-3">
            <div class="h-8 w-48 rounded-lg bg-white/5 shimmer"></div>
            <div class="h-5 w-32 rounded-lg bg-white/5 shimmer"></div>
            <div class="h-4 w-24 rounded-lg bg-white/5 shimmer"></div>
          </div>
        </div>
      </div>
      <div class="glass rounded-2xl p-6 h-32 shimmer"></div>
    </div>

    <!-- Weather content -->
    <Suspense>
      <template #default>
        <div v-if="store.weatherData" class="space-y-6 mt-8">
          <WeatherCurrent />
          <WeatherHourly />
          <WeatherForecast />
        </div>
      </template>
      <template #fallback>
        <div class="mt-10 text-center">
          <div class="inline-block w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
        </div>
      </template>
    </Suspense>

    <!-- Empty state -->
    <div v-if="!store.loading && !store.weatherData && !store.error" class="mt-20 text-center animate-fade-up delay-300">
      <div class="text-6xl mb-4 animate-float">🌍</div>
      <p class="text-white/30 text-sm">Search for a city or use your location to get started</p>
    </div>
  </div>
</template>
