<script setup lang="ts">
  import { ref, computed, onUnmounted } from 'vue';
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
  const geoLoading = ref(false);

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
  }, 400);

  const isLoading = computed(() => store.loading);
  const errorMessage = computed(() => {
    if (store.error) return store.error.message;
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

    geoLoading.value = true;
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
        error.code === 1 ? 'Please allow location access to use this feature'
        : error.code === 2 ? 'Location information unavailable'
        : error.code === 3 ? 'Location request timed out'
        : 'Failed to get location';
    } finally {
      geoLoading.value = false;
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

      if (response.data && Array.isArray(response.data.results)) {
        locationSuggestions.value = response.data.results.map((result: any) => ({
          formatted: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}${result.country ? `, ${result.country}` : ''}`,
          geometry: { lat: result.latitude, lng: result.longitude },
          components: { city: result.name, state: result.admin1, country: result.country },
        }));
      } else {
        locationSuggestions.value = [];
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
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

  const handleBlur = () => {
    setTimeout(() => {
      showSuggestions.value = false;
    }, 150);
  };

  onUnmounted(() => {
    if (abortController.value) {
      abortController.value.abort();
    }
  });
</script>

<template>
  <div class="relative z-40 animate-fade-up delay-100">
    <div class="max-w-lg mx-auto relative">
      <!-- Search input -->
      <div class="relative">
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>

        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Search city..."
          @input="handleSearch"
          @keyup.enter="handleManualSearch"
          @blur="handleBlur"
          :disabled="isLoading"
          class="w-full pl-11 pr-28 py-3.5 rounded-xl glass-strong text-white text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-400/40 focus:border-indigo-400/30 disabled:opacity-40 transition-all duration-300"
        />

        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
          <button
            v-if="!isLoading && store.favorites.length > 0"
            @click="toggleFavorites"
            class="p-2 rounded-lg text-white/50 hover:text-amber-300 hover:bg-white/5 transition-all duration-200"
            :class="{ 'text-amber-300 bg-white/5': showFavorites }"
            title="Favorites"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>

          <button
            v-if="!isLoading"
            @click="handleGetLocation"
            :disabled="geoLoading"
            class="p-2 rounded-lg text-white/50 hover:text-sky-300 hover:bg-white/5 transition-all duration-200 disabled:opacity-40"
            :class="{ 'animate-pulse text-sky-300': geoLoading }"
            title="Use my location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
        </div>

        <!-- Suggestions dropdown -->
        <Transition name="dropdown">
          <div
            v-if="showSuggestions && locationSuggestions.length > 0"
            class="absolute z-50 mt-2 inset-x-0 glass-strong rounded-xl overflow-hidden shadow-2xl shadow-black/30"
          >
            <div
              v-for="(suggestion, i) in locationSuggestions"
              :key="`${suggestion.geometry.lat}-${suggestion.geometry.lng}`"
              @mousedown.prevent="handleSuggestionClick(suggestion.geometry.lat, suggestion.geometry.lng)"
              class="cursor-pointer px-4 py-3 hover:bg-white/8 transition-colors duration-150 border-b border-white/5 last:border-b-0 animate-slide-in"
              :style="{ animationDelay: `${i * 40}ms` }"
            >
              <p class="text-white/90 text-sm">{{ suggestion.formatted }}</p>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Favorites dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showFavorites && store.favorites.length > 0"
          class="absolute z-50 mt-2 inset-x-0 glass-strong rounded-xl overflow-hidden shadow-2xl shadow-black/30"
        >
          <div class="px-4 py-2.5 border-b border-white/8">
            <span class="text-xs font-medium text-white/40 uppercase tracking-wider">Favorites</span>
          </div>
          <div class="max-h-56 overflow-y-auto">
            <div
              v-for="favorite in store.favorites"
              :key="favorite.name"
              @click="handleFavoriteClick(favorite.lat, favorite.lon)"
              class="group cursor-pointer px-4 py-3 hover:bg-white/8 transition-colors duration-150 border-b border-white/5 last:border-b-0 flex items-center gap-3"
            >
              <span class="text-indigo-400/60 text-xs">&#9679;</span>
              <div class="flex-1 min-w-0">
                <p class="text-white/90 text-sm truncate">{{ favorite.name }}</p>
                <p class="text-white/30 text-xs">{{ favorite.lat.toFixed(2) }}, {{ favorite.lon.toFixed(2) }}</p>
              </div>
              <button
                @click="(e) => handleRemoveFavorite(e, favorite.name)"
                class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Error -->
    <Transition name="dropdown">
      <div v-if="errorMessage" class="mt-4 text-center" role="alert">
        <p class="text-red-300/90 bg-red-500/10 border border-red-500/15 px-5 py-2.5 rounded-xl inline-block text-sm">
          {{ errorMessage }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active { transition: all 0.2s ease-out; }
.dropdown-leave-active { transition: all 0.15s ease-in; }
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
