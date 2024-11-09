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
        class="w-full px-4 py-3 pl-5 pr-32 rounded-lg 
               backdrop-blur-md bg-white/20 
               border border-white/20
               focus:outline-none focus:ring-2 focus:ring-blue-400/50 
               placeholder-gray-500 text-gray-800
               shadow-[0_8px_32px_0_rgba(31,38,135,0.17)]"
      />
      <!-- Button container - now properly centered -->
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
        <!-- Search Button -->
        <button 
          @click="handleSearch"
          :disabled="store.loading"
          class="px-6 py-1.5 rounded-lg min-w-[100px]
                 backdrop-blur-sm bg-blue-500/80 
                 border border-blue-400/50
                 text-white font-medium
                 shadow-lg shadow-blue-500/30
                 hover:bg-blue-600/80 hover:shadow-blue-600/30
                 active:transform active:scale-95
                 disabled:bg-blue-400/50 disabled:cursor-not-allowed disabled:shadow-none
                 transition-all duration-200"
        >
          <span class="relative z-10">
            {{ store.loading ? 'Searching...' : 'Search' }}
          </span>
        </button>

        <!-- Location Button -->
        <button 
          @click="handleGetLocation"
          :disabled="store.loading"
          class="p-2 rounded-lg
                 backdrop-blur-sm bg-blue-500/80
                 border border-blue-400/50
                 text-white font-medium
                 shadow-lg shadow-blue-500/30
                 hover:bg-blue-600/80 hover:shadow-blue-600/30
                 active:transform active:scale-95
                 disabled:bg-blue-400/50 disabled:cursor-not-allowed disabled:shadow-none
                 transition-all duration-200"
          title="Use my location"
        >
          <span class="relative z-10">📍</span>
        </button>
      </div>
    </div>

    <!-- Error messages -->
    <div class="mt-3 text-center">
      <p v-if="store.error" 
         class="text-red-500/90 text-sm backdrop-blur-sm bg-red-50/30 
                px-4 py-2 rounded-lg inline-block">
        {{ store.error }}
      </p>
      <p v-if="geoLocationError" 
         class="text-red-500/90 text-sm backdrop-blur-sm bg-red-50/30 
                px-4 py-2 rounded-lg inline-block">
        {{ geoLocationError }}
      </p>
    </div>
  </div>
</template>