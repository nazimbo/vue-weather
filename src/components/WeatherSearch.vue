<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
const searchQuery = ref('');
const geoLocationError = ref<string | null>(null);

onMounted(() => {
  store.clearExpiredCache();
});

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await store.fetchWeather(searchQuery.value.trim());
    searchQuery.value = '';
  }
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
        @keyup.enter="handleSearch"
        class="w-full px-4 py-3 pl-5 pr-32 rounded-lg bg-white shadow-md border border-gray-200 
               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
               placeholder-gray-400 text-gray-600"
      />
      <div class="absolute right-2 top-2 flex gap-2">
        <button 
          @click="handleSearch"
          :disabled="store.loading"
          class="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors
                 flex items-center justify-center min-w-[100px]"
        >
          {{ store.loading ? 'Searching...' : 'Search' }}
        </button>
        <button 
          @click="handleGetLocation"
          :disabled="store.loading"
          class="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          title="Use my location"
        >
          📍
        </button>
      </div>
    </div>
    <div class="mt-3 text-center">
      <p v-if="store.error" class="text-red-500 text-sm">{{ store.error }}</p>
      <p v-if="geoLocationError" class="text-red-500 text-sm">{{ geoLocationError }}</p>
    </div>
  </div>
</template>