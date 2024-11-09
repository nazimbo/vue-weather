<script setup lang="ts">
import WeatherSearch from '../components/WeatherSearch.vue';
import WeatherCurrent from '../components/WeatherCurrent.vue';
import WeatherForecast from '../components/WeatherForecast.vue';
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-center text-blue-900 mb-8">
      Weather App
    </h1>
    <WeatherSearch />
    <WeatherCurrent />
    <WeatherForecast />
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.home h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}
</style>