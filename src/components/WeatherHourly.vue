<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';

  const store = useWeatherStore();

  const temperatureUnit = computed(() => {
    return store.selectedUnit === 'metric' ? '°C' : '°F';
  });
</script>

<template>
  <div v-if="store.weatherData?.hourlyForecast" class="bg-white/20 rounded-xl p-6 mb-8 shadow-lg">
    <h3 class="text-2xl font-semibold text-gray-800 mb-4">Next 24 Hours</h3>

    <div class="overflow-x-auto">
      <div class="flex gap-4 min-w-max pb-2">
        <div
          v-for="hour in store.weatherData.hourlyForecast"
          :key="hour.time"
          class="flex flex-col items-center bg-white/30 rounded-lg p-4 min-w-[120px] transition-transform hover:scale-105"
        >
          <span class="text-gray-600 font-medium mb-2">{{ hour.time }}</span>
          <img
            :src="`https://openweathermap.org/img/wn/${hour.icon}.png`"
            :alt="hour.description"
            class="w-12 h-12"
          />
          <span class="text-xl font-bold text-blue-700">
            {{ hour.temp }}{{ temperatureUnit }}
          </span>
          <span class="text-sm text-gray-600 capitalize mt-1">
            {{ hour.description }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
