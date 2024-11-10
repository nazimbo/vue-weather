<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';
import { useDebounceFn } from '@vueuse/core';

const store = useWeatherStore();
const searchQuery = ref('');
const showFavorites = ref(false);
const geoLocationError = ref<string | null>(null);

const debouncedSearch = useDebounceFn(async (query: string) => {
  if (query.trim()) {
    await store.fetchWeather(query.trim());
    showFavorites.value = false;
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
  showFavorites.value = false;
  
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

const toggleFavorites = () => {
  showFavorites.value = !showFavorites.value;
};

const handleFavoriteClick = async (lat: number, lon: number) => {
  await store.fetchWeatherByCoords(lat, lon);
  showFavorites.value = false;
};

const handleRemoveFavorite = (event: Event, cityName: string) => {
  event.stopPropagation(); // Prevent triggering the parent click handler
  store.removeFromFavorites(cityName);
};
</script>

<template>
  <div class="mb-8 relative">
    <div class="max-w-xl mx-auto">
      <!-- Search Bar -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Enter city name..."
          @input="handleSearch"
          :disabled="isLoading"
          class="w-full px-4 py-3 pr-32 rounded-lg 
                 bg-white border border-blue-200/50
                 focus:outline-none focus:ring-2 focus:ring-blue-400 
                 placeholder-gray-500 text-gray-800 shadow-lg
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200"
          @keyup.enter="handleSearch"
        />
        
        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <!-- Favorites Button -->
          <button 
            v-if="!isLoading && store.favorites.length > 0"
            @click="toggleFavorites"
            class="p-2 rounded-lg bg-blue-600 text-white shadow-md 
                   hover:bg-blue-700 transition-all
                   focus:outline-none focus:ring-2 focus:ring-blue-400"
            :class="{ 'bg-blue-700': showFavorites }"
            title="Show favorites"
          >
            ⭐
          </button>

          <!-- Location Button -->
          <button 
            v-if="!isLoading"
            @click="handleGetLocation"
            class="p-2 rounded-lg bg-blue-600 text-white shadow-md 
                   hover:bg-blue-700 transition-all
                   focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Use my location"
          >
            📍
          </button>

          <!-- Search Button -->
          <button 
            v-if="!isLoading"
            @click="handleSearch"
            class="px-4 py-2 rounded-lg bg-blue-600 
                   text-white font-medium shadow-md
                   hover:bg-blue-700 transition-all
                   focus:outline-none focus:ring-2 focus:ring-blue-400
                   disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!searchQuery.trim()"
          >
            Search
          </button>

          <!-- Loading Spinner -->
          <div v-else 
               class="animate-spin rounded-full h-8 w-8 
                      border-2 border-blue-600 border-t-transparent"
               role="status">
            <span class="sr-only">Loading...</span>
          </div>
        </div>
      </div>

      <!-- Favorites Dropdown -->
      <div v-if="showFavorites && store.favorites.length > 0"
           class="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-xl 
                  border border-blue-100 py-2 max-h-60 overflow-y-auto">
        <div 
          v-for="favorite in store.favorites"
          :key="favorite.name"
          @click="handleFavoriteClick(favorite.lat, favorite.lon)"
          class="px-4 py-2 hover:bg-blue-50 transition-colors duration-200 
                 flex justify-between items-center group cursor-pointer"
        >
          <span>{{ favorite.name }}</span>
          <span
            @click="(e) => handleRemoveFavorite(e, favorite.name)"
            class="text-gray-400 hover:text-red-500 opacity-0 
                   group-hover:opacity-100 transition-opacity duration-200
                   cursor-pointer"
            title="Remove from favorites"
          >
            ✕
          </span>
        </div>
      </div>
    </div>

    <!-- Error messages -->
    <div v-if="errorMessage" 
         class="mt-3 text-center"
         role="alert">
      <p class="text-red-500 bg-red-50 px-4 py-2 rounded-lg 
                inline-block shadow-sm">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>