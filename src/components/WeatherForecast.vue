<script setup lang="ts">
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
</script>

<template>
  <div v-if="store.weatherData" class="weather-forecast">
    <h3>5-Day Forecast</h3>
    <div class="forecast-container">
      <div 
        v-for="day in store.weatherData.forecast" 
        :key="day.date"
        class="forecast-day"
      >
        <div class="date">{{ day.date }}</div>
        <img 
          :src="`http://openweathermap.org/img/wn/${day.icon}.png`"
          :alt="day.description"
        />
        <div class="temp">{{ day.temp }}°C</div>
        <div class="description">{{ day.description }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.weather-forecast {
  margin-top: 2rem;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333;
  }

  .forecast-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;

    .forecast-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 4px;

      .date {
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .temp {
        font-size: 1.25rem;
        font-weight: bold;
        margin: 0.5rem 0;
      }

      .description {
        text-align: center;
        font-size: 0.875rem;
        color: #666;
        text-transform: capitalize;
      }
    }
  }
}
</style>
