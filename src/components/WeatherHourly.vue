<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';

  const store = useWeatherStore();

  const temperatureUnit = computed(() => {
    return store.selectedUnit === 'metric' ? '°' : '°';
  });
</script>

<template>
  <div v-if="store.weatherData?.hourlyForecast" class="glass rounded-2xl p-5 sm:p-6 animate-fade-up delay-100">
    <h3 class="text-white/50 text-xs font-medium uppercase tracking-wider mb-4">Next 24 Hours</h3>

    <div class="overflow-x-auto custom-scrollbar -mx-1 px-1 pb-2">
      <div class="flex gap-2 min-w-max stagger">
        <div
          v-for="(hour, index) in store.weatherData.hourlyForecast"
          :key="`${hour.time}-${index}`"
          class="flex flex-col items-center rounded-xl px-4 py-3 min-w-[72px] hover:bg-white/5 transition-all duration-200 group"
        >
          <span class="text-white/35 text-[11px] font-medium mb-2">{{ hour.time }}</span>
          <span class="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{{ hour.icon }}</span>
          <span class="text-white/90 text-sm font-medium">{{ hour.temp }}{{ temperatureUnit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
