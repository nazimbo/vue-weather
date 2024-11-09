<script setup lang="ts">
import { ref } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
const searchQuery = ref('');

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await store.fetchWeather(searchQuery.value.trim());
    searchQuery.value = '';
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
      <button @click="handleSearch" :disabled="store.loading">
        {{ store.loading ? 'Searching...' : 'Search' }}
      </button>
    </div>
    <p v-if="store.error" class="error">{{ store.error }}</p>
  </div>
</template>

<style scoped lang="scss">
.weather-search {
  margin: 2rem 0;

  .search-container {
    display: flex;
    gap: 1rem;
    max-width: 500px;
    margin: 0 auto;

    input {
      flex: 1;
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    button {
      padding: 0.5rem 1rem;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      
      &:disabled {
        background-color: #ccc;
      }
    }
  }

  .error {
    color: #ff4444;
    margin-top: 1rem;
    text-align: center;
  }
}
</style>
