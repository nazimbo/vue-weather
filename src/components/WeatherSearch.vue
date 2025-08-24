<script setup lang="ts">
  import { ref, computed, onUnmounted, onMounted } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';
  import { useDebounceFn } from '@vueuse/core';
  import axios from 'axios';

  const store = useWeatherStore();
  const searchQuery = ref('');
  const showFavorites = ref(false);
  const geoLocationError = ref<string | null>(null);
  const locationSuggestions = ref<any[]>([]);
  const showSuggestions = ref(false);
  const abortController = ref<AbortController | null>(null);
  const inputRef = ref<HTMLInputElement | null>(null);

  const MIN_SEARCH_LENGTH = 3;

  const debouncedSearch = useDebounceFn(async (query: string) => {
    if (query.trim().length >= MIN_SEARCH_LENGTH) {
      fetchLocationSuggestions(query.trim());
      showSuggestions.value = true;
    } else {
      locationSuggestions.value = [];
      showSuggestions.value = false;
      if (query.trim() === '') {
        store.weatherData = null;
      }
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

  const handleManualSearch = async () => {
    if (searchQuery.value.trim()) {
      await store.fetchWeather(searchQuery.value.trim());
      locationSuggestions.value = [];
      showSuggestions.value = false;
      inputRef.value?.blur();
    }
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
          maximumAge: 0,
        });
      });

      await store.fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
    } catch (error: any) {
      geoLocationError.value =
        error.code === 1
          ? 'Please allow location access to use this feature'
          : error.code === 2
            ? 'Location information unavailable'
            : error.code === 3
              ? 'Location request timed out'
              : 'Failed to get location';

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
    event.stopPropagation();
    store.removeFromFavorites(cityName);
  };

  const fetchLocationSuggestions = async (query: string) => {
    if (abortController.value) {
      abortController.value.abort();
    }

    abortController.value = new AbortController();

    try {
      const response = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
        { signal: abortController.value.signal }
      );

      // Validate response structure and transform to match expected format
      if (response.data && Array.isArray(response.data.results)) {
        // Transform Open Meteo results to match the expected OpenCage format
        locationSuggestions.value = response.data.results.map((result: any) => ({
          formatted: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}${result.country ? `, ${result.country}` : ''}`,
          geometry: {
            lat: result.latitude,
            lng: result.longitude
          },
          components: {
            city: result.name,
            state: result.admin1,
            country: result.country
          }
        }));
      } else {
        locationSuggestions.value = [];
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error fetching location suggestions:', error);
        locationSuggestions.value = [];
      }
    } finally {
      abortController.value = null;
    }
  };

  const handleSuggestionClick = async (lat: number, lon: number) => {
    await store.fetchWeatherByCoords(lat, lon);
    showSuggestions.value = false;
    searchQuery.value = '';
    locationSuggestions.value = [];
    inputRef.value?.blur();
  };

  const handleInputBlur = useDebounceFn(() => {
    setTimeout(() => {
      showSuggestions.value = false;
    }, 100);
  }, 100);

  onMounted(() => {
    if (inputRef.value) {
      inputRef.value.addEventListener('blur', handleInputBlur);
    }
  });

  onUnmounted(() => {
    if (abortController.value) {
      abortController.value.abort();
    }
    if (inputRef.value) {
      inputRef.value.removeEventListener('blur', handleInputBlur);
    }
  });
</script>

<template>
  <div class="mb-8 relative">
    <div class="max-w-xl mx-auto">
      <!-- Search Bar -->
      <div class="relative">
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Enter city name..."
          @input="handleSearch"
          @keyup.enter="handleManualSearch"
          :disabled="isLoading"
          class="w-full px-6 py-4 pr-32 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 focus:outline-hidden focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 placeholder-white/70 text-white shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-white/25"
        />

        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <!-- Favorites Button -->
          <button
            v-if="!isLoading && store.favorites.length > 0"
            @click="toggleFavorites"
            class="p-3 rounded-xl bg-white/20 backdrop-blur-md text-white shadow-lg hover:bg-white/30 transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-400/50 transform hover:scale-105"
            :class="{ 'bg-white/30 scale-105': showFavorites }"
            title="Show favorites"
            aria-label="Show favorite locations"
          >
            ⭐
          </button>

          <!-- Location Button -->
          <button
            v-if="!isLoading"
            @click="handleGetLocation"
            class="p-3 rounded-xl bg-white/20 backdrop-blur-md text-white shadow-lg hover:bg-white/30 transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-400/50 transform hover:scale-105"
            title="Use my location"
            aria-label="Use my current location"
          >
            📍
          </button>
        </div>

        <!-- Suggestions Dropdown -->
        <div
          v-if="showSuggestions && locationSuggestions.length > 0"
          class="absolute z-50 mt-2 inset-x-0 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 overflow-hidden max-h-60 overflow-y-auto"
        >
          <div
            v-for="suggestion in locationSuggestions"
            :key="suggestion.formatted"
            @click="handleSuggestionClick(suggestion.geometry.lat, suggestion.geometry.lng)"
            class="cursor-pointer px-4 py-3 hover:bg-white/30 transition-colors duration-200"
          >
            <p class="font-medium text-white">
              {{ suggestion.formatted }}
            </p>
          </div>
        </div>
      </div>
      <!-- Favorites Dropdown -->
      <div
        v-if="showFavorites && store.favorites.length > 0"
        class="absolute z-50 mt-2 inset-x-0 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 overflow-hidden"
      >
        <!-- Dropdown Header -->
        <div class="px-4 py-3 bg-white/10 border-b border-white/20">
          <h3 class="text-sm font-semibold text-white">
            Saved Locations ({{ store.favorites.length }})
          </h3>
        </div>

        <!-- Favorites List -->
        <div class="max-h-60 overflow-y-auto overscroll-contain py-1">
          <div
            v-for="favorite in store.favorites"
            :key="favorite.name"
            @click="handleFavoriteClick(favorite.lat, favorite.lon)"
            class="group relative cursor-pointer hover:bg-white/30 transition-all duration-200"
          >
            <!-- Location Info -->
            <div class="px-4 py-3 flex items-center gap-3">
              <span class="text-blue-400" aria-hidden="true">📍</span>
              <div class="flex-1">
                <span class="font-medium text-white">{{ favorite.name }}</span>
                <p class="text-xs text-white/70">
                  {{ favorite.lat.toFixed(2) }}°, {{ favorite.lon.toFixed(2) }}°
                </p>
              </div>

              <!-- Remove Button -->
              <button
                @click="(e) => handleRemoveFavorite(e, favorite.name)"
                class="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 text-white/60"
                title="Remove from favorites"
                aria-label="Remove from favorites"
              >
                <span class="text-sm" aria-hidden="true">✕</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State (if needed) -->
        <div
          v-if="store.favorites.length === 0"
          class="px-4 py-3 text-center text-white/70 text-sm"
        >
          No saved locations yet
        </div>
      </div>
    </div>

    <!-- Error messages -->
    <div v-if="errorMessage" class="mt-4 text-center" role="alert">
      <p class="text-red-300 bg-red-500/20 backdrop-blur-md px-6 py-3 rounded-2xl inline-block shadow-xl border border-red-500/30">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
