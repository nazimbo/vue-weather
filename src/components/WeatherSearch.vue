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
      <!-- Search Input -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Enter city name..."
        @keyup.enter="handleSearch"
        class="w-full px-4 py-3 rounded-lg 
               bg-white border border-blue-200/50
               focus:outline-none focus:ring-2 focus:ring-blue-400 
               placeholder-gray-500 text-gray-800 shadow-lg"
      />
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
        <!-- Search Button -->
        <button 
          @click="handleSearch"
          :disabled="store.loading"
          class="px-6 py-2 rounded-lg bg-blue-600 
                 text-white font-medium shadow-md
                 hover:bg-blue-700 transition-all"
        >
          {{ store.loading ? 'Searching...' : 'Search' }}
        </button>

        <!-- Location Button -->
        <button 
          @click="handleGetLocation"
          :disabled="store.loading"
          class="p-2 rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700"
          title="Use my location"
        >
          📍
        </button>
      </div>
    </div>

    <!-- Error messages -->
    <div class="mt-3 text-center">
      <p v-if="store.error" class="text-red-500/90 bg-red-50 px-4 py-2 rounded-lg">
        {{ store.error }}
      </p>
      <p v-if="geoLocationError" class="text-red-500/90 bg-red-50 px-4 py-2 rounded-lg">
        {{ geoLocationError }}
      </p>
    </div>
  </div>
</template>