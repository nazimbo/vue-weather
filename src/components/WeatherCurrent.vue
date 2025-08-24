<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';
  import { formatters } from '../utils/weather';

  const store = useWeatherStore();

  const getUVInfo = (uvIndex: number) => {
    if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600' };
    if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600' };
    if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Very High', color: 'text-red-600' };
  };

  const isFavorite = computed(() => {
    if (!store.weatherData) return false;
    return store.favorites.some((f) => f.name === store.weatherData?.city);
  });
</script>

<template>
  <div
    v-if="store.weatherData"
    class="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-12 transition-all duration-300 shadow-2xl border border-white/20 hover:bg-white/15"
  >
    <!-- Header with City and Favorites -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-4xl font-bold text-white drop-shadow-lg">
        {{ store.weatherData.city }}
      </h2>
      <div class="flex gap-4">
        <button
          @click="
            async () => {
              try {
                await store.toggleUnit();
              } catch (error) {
                console.error('Error switching units:', error);
              }
            }
          "
          :disabled="store.loading"
          class="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 border border-white/30"
        >
          {{ store.selectedUnit.toUpperCase() }}
        </button>
        <button
          @click="
            isFavorite ? store.removeFromFavorites(store.weatherData.city) : store.addToFavorites()
          "
          class="p-2 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
          :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        >
          <span class="text-2xl">{{ isFavorite ? '⭐' : '☆' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Weather Display -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Temperature and Icon -->
      <div class="flex items-center justify-center md:justify-start gap-4">
        <div class="text-6xl">
          {{ store.weatherData.current.icon }}
        </div>
        <div>
          <div class="text-6xl font-extrabold text-white drop-shadow-lg">
            {{ formatters.temperature(store.weatherData.current.temp, store.selectedUnit) }}
          </div>
          <div class="text-xl text-white/80">
            Feels like
            {{ formatters.temperature(store.weatherData.current.feelsLike, store.selectedUnit) }}
          </div>
          <p class="text-lg text-white/90 capitalize italic">
            {{ store.weatherData.current.description }}
          </p>
        </div>
      </div>

      <!-- Temperature Range and Basic Info -->
      <div class="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-red-500">↑</span>
            <span class="font-semibold text-white">
              {{ formatters.temperature(store.weatherData.current.tempMax, store.selectedUnit) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-blue-500">↓</span>
            <span class="font-semibold text-white">
              {{ formatters.temperature(store.weatherData.current.tempMin, store.selectedUnit) }}
            </span>
          </div>
        </div>
        <div>
          <div class="mb-2">
            <span class="text-blue-300">💨 Wind</span>
            <p class="text-white">
              {{ formatters.windSpeed(store.weatherData.current.windSpeed, store.selectedUnit) }}
            </p>
          </div>
          <div>
            <span class="text-blue-300">💧 Humidity</span>
            <p class="text-white">{{ store.weatherData.current.humidity }}%</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Weather Information -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Sun Times -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 class="font-semibold text-white mb-3">Sun Schedule</h3>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-amber-300">🌅 Sunrise</span>
            <span class="text-white">{{ formatters.time(store.weatherData.current.sunrise) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-amber-400">🌇 Sunset</span>
            <span class="text-white">{{ formatters.time(store.weatherData.current.sunset) }}</span>
          </div>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 class="font-semibold text-white mb-3">Additional Info</h3>
        <div class="grid grid-cols-2 gap-y-2">
          <div>
            <span class="text-blue-300">👁️ Visibility</span>
            <p class="text-white">{{ formatters.visibility(store.weatherData.current.visibility) }}</p>
          </div>
          <div>
            <span class="text-blue-300">⏲️ Pressure</span>
            <p class="text-white">{{ store.weatherData.current.pressure }} hPa</p>
          </div>
        </div>
      </div>

      <!-- Air Quality and UV -->
      <div
        v-if="store.weatherData.current.airQuality || store.weatherData.current.uvIndex"
        class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
      >
        <h3 class="font-semibold text-white mb-3">Air & UV</h3>
        <div class="flex flex-col gap-2">
          <div v-if="store.weatherData.current.airQuality">
            <span class="text-blue-300">AQI</span>
            <p class="text-white">{{ store.weatherData.current.airQuality.aqi }}/5</p>
          </div>
          <div v-if="store.weatherData.current.uvIndex">
            <span class="text-blue-300">UV Index</span>
            <p :class="getUVInfo(store.weatherData.current.uvIndex).color">
              {{ store.weatherData.current.uvIndex }}
              ({{ getUVInfo(store.weatherData.current.uvIndex).level }})
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
