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
  <div v-if="store.weatherData" class="mt-12">
    <h3 class="text-3xl font-semibold text-white mb-8 text-center drop-shadow-lg">5-Day Forecast</h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      <div
        v-for="day in store.weatherData.forecast"
        :key="day.date"
        class="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/15 border border-white/20 hover:border-white/40"
      >
        <!-- Date Header -->
        <div class="text-center border-b border-white/30 pb-3 mb-4">
          <p class="font-semibold text-white text-lg">
            {{ formatDate(day.date) }}
          </p>
        </div>

        <!-- Weather Icon and Description -->
        <div class="text-center mb-4">
          <div class="flex justify-center items-center">
            <span class="text-4xl">{{ day.icon }}</span>
          </div>
          <p class="text-sm text-white/80 capitalize font-medium">
            {{ day.description }}
          </p>
        </div>

        <!-- Temperature Range -->
        <div class="flex justify-center gap-4 mb-6 font-bold">
          <div class="text-center">
            <span class="text-red-300 text-sm block font-medium">High</span>
            <span class="text-xl text-white">{{ day.tempMax }}{{ temperatureUnit }}</span>
          </div>
          <div class="text-white/50">|</div>
          <div class="text-center">
            <span class="text-blue-300 text-sm block font-medium">Low</span>
            <span class="text-xl text-white">{{ day.tempMin }}{{ temperatureUnit }}</span>
          </div>
        </div>

        <!-- Weather Details -->
        <div class="grid grid-cols-2 gap-3 text-sm border-t border-white/30 pt-4">
          <!-- Humidity -->
          <div class="text-center">
            <span class="text-white/70 block font-medium">Humidity</span>
            <div class="font-semibold flex items-center justify-center gap-1 text-white">
              <span>💧</span>
              <span>{{ day.humidity }}%</span>
            </div>
          </div>

          <!-- Wind -->
          <div class="text-center">
            <span class="text-white/70 block font-medium">Wind</span>
            <div class="font-semibold flex items-center justify-center gap-1 text-white">
              <span>💨</span>
              <span>{{ day.windSpeed }} {{ windSpeedUnit }}</span>
            </div>
          </div>

          <!-- Precipitation -->
          <div class="col-span-2 text-center mt-3">
            <span class="text-white/70 block font-medium">Rain Chance</span>
            <div class="font-semibold flex items-center justify-center gap-1 text-white">
              <span>🌧️</span>
              <span>{{ day.precipitation }}%</span>
            </div>
            <p class="text-xs text-white/60 mt-1">
              {{ getPrecipitationAdvice(day.precipitation) }}
            </p>
          </div>

          <!-- Wind Description -->
          <div class="col-span-2 text-center mt-2">
            <p class="text-xs text-white/60 italic">
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
