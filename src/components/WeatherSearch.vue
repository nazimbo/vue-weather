<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';
import { useDebounceFn } from '@vueuse/core';
import { WeatherErrorType } from '../types/weather';

const store = useWeatherStore();
const searchQuery = ref('');
const geoLocationError = ref<string | null>(null);

const debouncedSearch = useDebounceFn(async (query: string) => {
  if (query.trim()) {
    await store.fetchWeather(query.trim());
  }
}, 500);

const isLoading = computed(() => store.loading);
const errorMessage = computed(() => {
  if (store.error) {
    return store.error.message;
  }
  return geoLocationError.value;
});

const handleSearch = () => {
  debouncedSearch(searchQuery.value);
};

const handleGetLocation = async () => {
  geoLocationError.value = null;
  
  if (!navigator.geolocation) {
    geoLocationError.value = 'Geolocation is not supported by your browser';
    return;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });

    await store.fetchWeatherByCoords(
      position.coords.latitude,
      position.coords.longitude
    );
  } catch (error: any) {
    geoLocationError.value = 
      error.code === 1 ? 'Please allow location access to use this feature' :
      error.code === 2 ? 'Location information unavailable' :
      error.code === 3 ? 'Location request timed out' :
      'Failed to get location';
    
    console.error('Geolocation error:', error);
  }
};
</script>

<template>
  <div class="mb-8">
    <div class="max-w-xl mx-auto relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Enter city name..."
        @input="handleSearch"
        :disabled="isLoading"
        class="w-full px-4 py-3 rounded-lg 
               bg-white border border-blue-200/50
               focus:outline-none focus:ring-2 focus:ring-blue-400 
               placeholder-gray-500 text-gray-800 shadow-lg
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-all duration-200"
        aria-label="Search for a city"
      />
      
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
        <button 
          v-if="!isLoading"
          @click="handleSearch"
          class="px-6 py-2 rounded-lg bg-blue-600 
                 text-white font-medium shadow-md
                 hover:bg-blue-700 transition-all
                 focus:outline-none focus:ring-2 focus:ring-blue-400
                 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          Search
        </button>

        <button 
          v-if="!isLoading"
          @click="handleGetLocation"
          class="p-2 rounded-lg bg-blue-600 text-white shadow-md 
                 hover:bg-blue-700 transition-all
                 focus:outline-none focus:ring-2 focus:ring-blue-400"
          :disabled="isLoading"
          title="Use my location"
          aria-label="Use my location"
        >
          📍
        </button>

        <!-- Loading Spinner -->
        <div v-else 
             class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"
             role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>

    <!-- Error messages -->
    <div v-if="errorMessage" 
         class="mt-3 text-center"
         role="alert"
         aria-live="polite">
      <p class="text-red-500/90 bg-red-50 px-4 py-2 rounded-lg">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>