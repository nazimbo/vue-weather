<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';

  const store = useWeatherStore();
  const isExpanded = ref(false);
  const isDev = computed(() => import.meta.env.DEV);

  const clearAllData = () => {
    if (
      confirm(
        'Are you sure you want to clear all stored data? This will remove all favorites and reset preferences.'
      )
    ) {
      store.clearStoredData();
    }
  };

  const clearCache = () => {
    if (confirm('Clear weather data cache?')) {
      store.clearCache();
    }
  };

  const getLocalStorageSize = () => {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length * 2) / 1024; // Approximate size in KB
      }
    }
    return total.toFixed(2);
  };

  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
  };
</script>

<template>
  <div v-if="isDev" class="fixed bottom-4 right-4 z-50">
    <!-- Main Dev Tools Panel -->
    <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div
        class="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
        @click="toggleExpand"
      >
        <h3 class="text-lg font-semibold text-gray-800">🛠️ Dev Tools</h3>
        <button class="text-gray-600 hover:text-gray-800 transition-colors">
          {{ isExpanded ? '▼' : '▲' }}
        </button>
      </div>

      <!-- Content -->
      <div v-if="isExpanded" class="p-4 space-y-4">
        <!-- Storage Info -->
        <div class="space-y-2">
          <div class="font-medium text-gray-700">Storage Info:</div>
          <div class="pl-4 space-y-1 text-sm">
            <div>
              <span class="text-gray-600">Favorites Count:</span>
              <span class="ml-2 font-mono">{{ store.favorites.length }}</span>
            </div>
            <div>
              <span class="text-gray-600">Unit Setting:</span>
              <span class="ml-2 font-mono">{{ store.selectedUnit }}</span>
            </div>
            <div>
              <span class="text-gray-600">LocalStorage Size:</span>
              <span class="ml-2 font-mono">~{{ getLocalStorageSize() }} KB</span>
            </div>
          </div>
        </div>

        <!-- State Info -->
        <div class="space-y-2">
          <div class="font-medium text-gray-700">Current State:</div>
          <div class="pl-4 space-y-1 text-sm">
            <div>
              <span class="text-gray-600">Loading:</span>
              <span class="ml-2 font-mono">{{ store.loading }}</span>
            </div>
            <div>
              <span class="text-gray-600">Has Error:</span>
              <span class="ml-2 font-mono">{{ !!store.error }}</span>
            </div>
            <div>
              <span class="text-gray-600">Cache Entries:</span>
              <span class="ml-2 font-mono">{{ store.cache.size }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-2">
          <div class="font-medium text-gray-700">Actions:</div>
          <div class="flex gap-2">
            <button
              @click="clearAllData"
              class="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors duration-200"
            >
              Clear All Data
            </button>
            <button
              @click="clearCache"
              class="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors duration-200"
            >
              Clear Cache
            </button>
            <button
              @click="store.toggleUnit"
              class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Toggle Unit
            </button>
          </div>
        </div>

        <!-- Favorites List -->
        <div v-if="store.favorites.length > 0" class="space-y-2">
          <div class="font-medium text-gray-700">Stored Favorites:</div>
          <div class="pl-4 space-y-1 max-h-40 overflow-y-auto">
            <div
              v-for="favorite in store.favorites"
              :key="favorite.name"
              class="flex justify-between items-center text-sm py-1"
            >
              <span class="text-gray-600">{{ favorite.name }}</span>
              <span class="text-xs text-gray-400">
                {{ favorite.lat.toFixed(2) }}, {{ favorite.lon.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .dev-tools-enter-active,
  .dev-tools-leave-active {
    transition: all 0.3s ease;
  }

  .dev-tools-enter-from,
  .dev-tools-leave-to {
    transform: translateY(20px);
    opacity: 0;
  }
</style>
