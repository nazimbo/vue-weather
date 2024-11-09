<script setup lang="ts">
import WeatherSearch from '../components/WeatherSearch.vue';
import WeatherCurrent from '../components/WeatherCurrent.vue';
import WeatherForecast from '../components/WeatherForecast.vue';
</script>

<template>
  <div class="home">
    <h1>Weather App</h1>
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