<script setup lang="ts">
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
</script>

<template>
  <div v-if="store.weatherData" 
     class="backdrop-blur-md bg-white/30 rounded-xl p-6 mb-8 
            transition-all duration-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
            border border-white/20">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <!-- City and Temperature -->
      <div class="text-center md:text-left">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          {{ store.weatherData.city }}
        </h2>
        <div class="flex items-center justify-center md:justify-start gap-4">
          <img 
            :src="`http://openweathermap.org/img/wn/${store.weatherData.current.icon}@2x.png`"
            :alt="store.weatherData.current.description"
            class="w-20 h-20"
          />
          <div class="text-6xl font-bold text-blue-600">
            {{ store.weatherData.current.temp }}°C
          </div>
        </div>
        <p class="text-lg text-gray-600 capitalize mt-2">
          {{ store.weatherData.current.description }}
        </p>
      </div>

      <!-- Weather Details -->
      <div class="flex flex-col gap-4 bg-blue-50 p-4 rounded-lg">
        <div class="flex items-center gap-2">
          <span class="text-blue-600 font-medium">Humidity:</span>
          <span class="text-gray-700">
            {{ store.weatherData.current.humidity }}%
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-blue-600 font-medium">Wind Speed:</span>
          <span class="text-gray-700">
            {{ store.weatherData.current.windSpeed }} m/s
          </span>
        </div>
      </div>
    </div>
  </div>
</template>