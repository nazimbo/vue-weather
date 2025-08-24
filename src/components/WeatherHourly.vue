<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';

  const store = useWeatherStore();

  const temperatureUnit = computed(() => {
    return store.selectedUnit === 'metric' ? '°C' : '°F';
  });
</script>

<template>
  <div v-if="store.weatherData?.hourlyForecast" class="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-12 shadow-2xl border border-white/20">
    <h3 class="text-2xl font-semibold text-white mb-6 drop-shadow-lg">Next 24 Hours</h3>

    <div class="overflow-x-auto">
      <div class="flex gap-6 min-w-max pb-2">
        <div
          v-for="hour in store.weatherData.hourlyForecast"
          :key="hour.time"
          class="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-w-[140px] transition-all duration-300 hover:scale-110 hover:bg-white/30 border border-white/20 shadow-lg"
        >
          <span class="text-white/80 font-semibold mb-3 text-sm">{{ hour.time }}</span>
          <div class="text-4xl mb-3 transform transition-transform hover:scale-110">
            {{ hour.icon }}
          </div>
          <span class="text-xl font-bold text-white mb-2">
            {{ hour.temp }}{{ temperatureUnit }}
          </span>
          <span class="text-xs text-white/70 capitalize text-center leading-tight">
            {{ hour.description }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
