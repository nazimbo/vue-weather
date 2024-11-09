<script setup lang="ts">
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
</script>

<template>
  <div v-if="store.weatherData" class="mt-8">
    <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      5-Day Forecast
    </h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div 
        v-for="day in store.weatherData.forecast" 
        :key="day.date"
        class="backdrop-blur-md bg-white/20 rounded-lg p-4 
              border border-white/20
              transition-all duration-300 
              hover:transform hover:scale-105
              hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
              shadow-[0_8px_32px_0_rgba(31,38,135,0.17)]"
      >
        <div class="text-center">
          <p class="font-medium text-gray-600 mb-2">{{ day.date }}</p>
          <img 
            :src="`http://openweathermap.org/img/wn/${day.icon}.png`"
            :alt="day.description"
            class="mx-auto w-12 h-12"
          />
          <p class="text-2xl font-bold text-blue-600 my-2">
            {{ day.temp }}°C
          </p>
          <p class="text-sm text-gray-500 capitalize">
            {{ day.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>