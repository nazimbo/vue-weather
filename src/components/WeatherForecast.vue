<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';

  const store = useWeatherStore();

  // Compute units based on store selection
  const temperatureUnit = computed(() => {
    return store.selectedUnit === 'metric' ? '°C' : '°F';
  });

  const windSpeedUnit = computed(() => {
    return store.selectedUnit === 'metric' ? 'm/s' : 'mph';
  });

  // Get gradient colors based on weather description
  const getWeatherColor = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('thunderstorm')) return 'from-gray-700 to-gray-900';
    if (lowerDesc.includes('drizzle')) return 'from-blue-200 to-blue-300';
    if (lowerDesc.includes('rain')) return 'from-blue-300 to-blue-400';
    if (lowerDesc.includes('snow')) return 'from-indigo-100 to-indigo-200';
    if (lowerDesc.includes('mist') || lowerDesc.includes('fog')) return 'from-gray-200 to-gray-300';
    if (lowerDesc.includes('smoke') || lowerDesc.includes('haze'))
      return 'from-gray-300 to-gray-400';
    if (lowerDesc.includes('dust') || lowerDesc.includes('sand'))
      return 'from-yellow-200 to-yellow-300';
    if (lowerDesc.includes('clear')) return 'from-sky-200 to-sky-300';
    if (lowerDesc.includes('cloud')) return 'from-gray-100 to-gray-200';

    return 'from-blue-100 to-blue-200';
  };

  // Format date to more readable format
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Get weather icon class based on description and time
  const getWeatherIcon = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('thunderstorm')) return '⛈️';
    if (lowerDesc.includes('drizzle')) return '🌧️';
    if (lowerDesc.includes('rain')) return '🌧️';
    if (lowerDesc.includes('snow')) return '🌨️';
    if (lowerDesc.includes('mist') || lowerDesc.includes('fog')) return '🌫️';
    if (lowerDesc.includes('clear')) return '☀️';
    if (lowerDesc.includes('cloud')) return '☁️';

    return '🌥️';
  };

  // Get precipitation recommendation
  const getPrecipitationAdvice = (probability: number): string => {
    if (probability >= 70) return 'Bring an umbrella!';
    if (probability >= 40) return 'Maybe bring an umbrella';
    return 'Clear skies likely';
  };

  // Get wind condition description
  const getWindDescription = (speed: number): string => {
    if (store.selectedUnit === 'metric') {
      if (speed < 0.5) return 'Calm';
      if (speed < 1.5) return 'Light air';
      if (speed < 3.3) return 'Light breeze';
      if (speed < 5.5) return 'Gentle breeze';
      if (speed < 7.9) return 'Moderate breeze';
      if (speed < 10.7) return 'Fresh breeze';
      return 'Strong breeze';
    } else {
      // Imperial units (mph)
      if (speed < 1) return 'Calm';
      if (speed < 3) return 'Light air';
      if (speed < 7) return 'Light breeze';
      if (speed < 12) return 'Gentle breeze';
      if (speed < 18) return 'Moderate breeze';
      if (speed < 24) return 'Fresh breeze';
      return 'Strong breeze';
    }
  };
</script>

<template>
  <div v-if="store.weatherData" class="mt-8">
    <h3 class="text-3xl font-semibold text-gray-800 mb-6 text-center">5-Day Forecast</h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div
        v-for="day in store.weatherData.forecast"
        :key="day.date"
        :class="[
          `bg-gradient-to-br ${getWeatherColor(day.description)} rounded-lg p-4`,
          'shadow-lg transition-all duration-300 hover:scale-105',
          'hover:shadow-xl border border-white/20',
        ]"
      >
        <!-- Date Header -->
        <div class="text-center border-b border-white/20 pb-2 mb-3">
          <p class="font-medium text-gray-700">
            {{ formatDate(day.date) }}
          </p>
        </div>

        <!-- Weather Icon and Description -->
        <div class="text-center mb-4">
          <div class="flex justify-center items-center gap-2">
            <span class="text-2xl">{{ getWeatherIcon(day.description) }}</span>
            <img
              :src="`https://openweathermap.org/img/wn/${day.icon}@2x.png`"
              :alt="day.description"
              class="w-16 h-16"
            />
          </div>
          <p class="text-sm text-gray-600 capitalize font-medium">
            {{ day.description }}
          </p>
        </div>

        <!-- Temperature Range -->
        <div class="flex justify-center gap-4 mb-4 font-bold">
          <div class="text-center">
            <span class="text-red-600 text-sm block">High</span>
            <span class="text-lg">{{ day.tempMax }}{{ temperatureUnit }}</span>
          </div>
          <div class="text-gray-300">|</div>
          <div class="text-center">
            <span class="text-blue-600 text-sm block">Low</span>
            <span class="text-lg">{{ day.tempMin }}{{ temperatureUnit }}</span>
          </div>
        </div>

        <!-- Weather Details -->
        <div class="grid grid-cols-2 gap-2 text-sm border-t border-white/20 pt-3">
          <!-- Humidity -->
          <div class="text-center">
            <span class="text-gray-600 block">Humidity</span>
            <div class="font-medium flex items-center justify-center gap-1">
              <span>💧</span>
              <span>{{ day.humidity }}%</span>
            </div>
          </div>

          <!-- Wind -->
          <div class="text-center">
            <span class="text-gray-600 block">Wind</span>
            <div class="font-medium flex items-center justify-center gap-1">
              <span>💨</span>
              <span>{{ day.windSpeed }} {{ windSpeedUnit }}</span>
            </div>
          </div>

          <!-- Precipitation -->
          <div class="col-span-2 text-center mt-2">
            <span class="text-gray-600 block">Rain Chance</span>
            <div class="font-medium flex items-center justify-center gap-1">
              <span>🌧️</span>
              <span>{{ day.precipitation }}%</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ getPrecipitationAdvice(day.precipitation) }}
            </p>
          </div>

          <!-- Wind Description -->
          <div class="col-span-2 text-center mt-2">
            <p class="text-xs text-gray-500 italic">
              {{ getWindDescription(day.windSpeed) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Optional: Add smooth transitions for hover effects */
  .hover\:scale-105 {
    transition:
      transform 0.2s ease-in-out,
      box-shadow 0.2s ease-in-out;
  }

  /* Optional: Add subtle animation for weather icons */
  img {
    transition: transform 0.2s ease-in-out;
  }

  img:hover {
    transform: scale(1.1);
  }
</style>
