<script setup lang="ts">
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
</script>

<template>
  <div v-if="store.weatherData" 
       class="bg-gradient-to-r from-blue-100 to-blue-300 rounded-xl p-6 mb-8 
              transition-transform transform hover:scale-105 shadow-lg border border-blue-200/20">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <!-- City and Temperature -->
      <div class="text-center md:text-left">
        <h2 class="text-4xl font-bold text-gray-800 mb-2">
          {{ store.weatherData.city }}
        </h2>
        <div class="flex items-center justify-center md:justify-start gap-4">
          <img 
            :src="`http://openweathermap.org/img/wn/${store.weatherData.current.icon}@2x.png`"
            :alt="store.weatherData.current.description"
            class="w-24 h-24"
          />
          <div class="text-7xl font-extrabold text-blue-700">
            {{ store.weatherData.current.temp }}°C
          </div>
        </div>
        <p class="text-lg text-gray-600 capitalize mt-2 italic">
          {{ store.weatherData.current.description }}
        </p>
      </div>

      <!-- Weather Details -->
      <div class="flex flex-col gap-4 bg-blue-100 p-4 rounded-lg shadow-md">
        <div class="flex items-center gap-2">
          <span class="text-blue-700 font-semibold">Humidity:</span>
          <span class="text-gray-700">{{ store.weatherData.current.humidity }}%</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-blue-700 font-semibold">Wind Speed:</span>
          <span class="text-gray-700">{{ store.weatherData.current.windSpeed }} m/s</span>
        </div>
      </div>
    </div>
  </div>
</template>