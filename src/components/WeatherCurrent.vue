<script setup lang="ts">
import { useWeatherStore } from '../stores/weatherStore';

const store = useWeatherStore();
</script>

<template>
  <div v-if="store.weatherData" class="current-weather">
    <h2>{{ store.weatherData.city }}</h2>
    <div class="weather-info">
      <img 
        :src="`http://openweathermap.org/img/wn/${store.weatherData.current.icon}@2x.png`"
        :alt="store.weatherData.current.description"
      />
      <div class="temperature">
        {{ store.weatherData.current.temp }}°C
      </div>
      <div class="description">
        {{ store.weatherData.current.description }}
      </div>
      <div class="details">
        <div class="detail">
          <span>Humidity:</span>
          {{ store.weatherData.current.humidity }}%
        </div>
        <div class="detail">
          <span>Wind Speed:</span>
          {{ store.weatherData.current.windSpeed }} m/s
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.current-weather {
  padding: 2rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  text-align: center;

  h2 {
    margin-bottom: 1rem;
    color: #333;
  }

  .weather-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    img {
      width: 100px;
      height: 100px;
    }

    .temperature {
      font-size: 3rem;
      font-weight: bold;
      color: #333;
    }

    .description {
      text-transform: capitalize;
      color: #666;
    }

    .details {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;

      .detail {
        span {
          font-weight: bold;
          margin-right: 0.5rem;
        }
      }
    }
  }
}
</style>
