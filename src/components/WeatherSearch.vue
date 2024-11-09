<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
const searchQuery = ref('');
const geoLocationError = ref<string | null>(null);

// Clear expired cache entries on component mount
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
  <div class="weather-search">
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Enter city name..."
        @keyup.enter="handleSearch"
      />
      <button 
        @click="handleSearch" 
        :disabled="store.loading"
        class="search-button"
      >
        {{ store.loading ? 'Searching...' : 'Search' }}
      </button>
      <button 
        @click="handleGetLocation" 
        :disabled="store.loading"
        class="location-button"
        title="Use my location"
      >
        📍
      </button>
    </div>
    <p v-if="store.error" class="error">{{ store.error }}</p>
    <p v-if="geoLocationError" class="error">{{ geoLocationError }}</p>
  </div>
</template>

<style scoped>
.weather-search {
  margin: 2rem 0;
}

.search-container {
  display: flex;
  gap: 0.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.search-container input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-container input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.search-container button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-container button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.search-container .search-button {
  background-color: #4CAF50;
  color: white;
  min-width: 100px;
}

.search-container .search-button:hover:not(:disabled) {
  background-color: #45a049;
}

.search-container .location-button {
  background-color: #2196F3;
  color: white;
  padding: 0.5rem;
  font-size: 1.2rem;
}

.search-container .location-button:hover:not(:disabled) {
  background-color: #1e88e5;
}

.error {
  color: #ff4444;
  margin-top: 1rem;
  text-align: center;
}
</style>