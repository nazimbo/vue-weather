<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';

  const store = useWeatherStore();

  const temperatureUnit = computed(() => {
    return store.selectedUnit === 'metric' ? '°' : '°';
  });

  const windSpeedUnit = computed(() => {
    return store.selectedUnit === 'metric' ? 'km/h' : 'mph';
  });

  const formatDay = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getWindDescription = (speed: number): string => {
    if (store.selectedUnit === 'metric') {
      if (speed < 2) return 'Calm';
      if (speed < 12) return 'Light';
      if (speed < 29) return 'Moderate';
      if (speed < 39) return 'Fresh';
      return 'Strong';
    } else {
      if (speed < 1) return 'Calm';
      if (speed < 7) return 'Light';
      if (speed < 18) return 'Moderate';
      if (speed < 24) return 'Fresh';
      return 'Strong';
    }
  };
</script>

<template>
  <div v-if="store.weatherData" class="glass rounded-2xl p-5 sm:p-6 animate-fade-up delay-200">
    <h3 class="text-white/50 text-xs font-medium uppercase tracking-wider mb-4">5-Day Forecast</h3>

    <div class="divide-y divide-white/5 stagger">
      <div
        v-for="(day, index) in store.weatherData.forecast"
        :key="day.date"
        class="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors duration-150"
      >
        <!-- Day name -->
        <div class="w-24 sm:w-32 shrink-0">
          <span class="text-white/80 text-sm font-medium">{{ formatDay(day.date) }}</span>
        </div>

        <!-- Icon -->
        <div class="text-2xl shrink-0 w-10 text-center">{{ day.icon }}</div>

        <!-- Description -->
        <div class="hidden sm:block flex-1 min-w-0">
          <span class="text-white/40 text-xs truncate block">{{ day.description }}</span>
        </div>

        <!-- Rain probability -->
        <div class="shrink-0 w-14 text-right" v-if="day.precipitation > 0">
          <span class="text-sky-400/70 text-xs font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" class="inline mr-0.5 -mt-0.5"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
            {{ day.precipitation }}%
          </span>
        </div>
        <div class="shrink-0 w-14" v-else></div>

        <!-- Wind -->
        <div class="hidden sm:block shrink-0 w-20 text-right">
          <span class="text-white/30 text-xs">{{ getWindDescription(day.windSpeed) }}</span>
        </div>

        <!-- Temp range bar -->
        <div class="shrink-0 flex items-center gap-2 w-36 sm:w-44 justify-end">
          <span class="text-white/40 text-sm w-10 text-right font-medium">{{ day.tempMin }}{{ temperatureUnit }}</span>
          <div class="w-16 sm:w-20 h-1 rounded-full bg-white/5 relative overflow-hidden">
            <div
              class="absolute inset-y-0 rounded-full bg-gradient-to-r from-indigo-400/60 to-amber-400/60"
              :style="{
                left: '10%',
                right: '10%',
              }"
            ></div>
          </div>
          <span class="text-white/80 text-sm w-10 font-medium">{{ day.tempMax }}{{ temperatureUnit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
