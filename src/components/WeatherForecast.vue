<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';

  const store = useWeatherStore();

  const temperatureUnit = computed(() => {
    return store.selectedUnit === 'metric' ? '°' : '°';
  });

  const formatDay = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };
</script>

<template>
  <div v-if="store.weatherData" class="glass rounded-2xl p-4 sm:p-6 animate-fade-up delay-200">
    <h3 class="text-white/50 text-xs font-medium uppercase tracking-wider mb-4">5-Day Forecast</h3>

    <div class="divide-y divide-white/5 stagger">
      <div
        v-for="day in store.weatherData.forecast"
        :key="day.date"
        class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
      >
        <!-- Left: icon + day info -->
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="text-2xl w-10 text-center shrink-0">{{ day.icon }}</div>
          <div class="min-w-0">
            <div class="text-white/80 text-sm font-medium">{{ formatDay(day.date) }}</div>
            <div class="text-white/40 text-xs truncate">
              {{ day.description }}
              <span v-if="day.precipitation > 0" class="text-sky-400/70 ml-1">
                {{ day.precipitation }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Right: temps -->
        <div class="flex items-center gap-2 shrink-0 pl-3">
          <span class="text-white/40 text-sm tabular-nums">{{ day.tempMin }}{{ temperatureUnit }}</span>
          <div class="w-12 sm:w-20 h-1 rounded-full bg-white/5 relative overflow-hidden">
            <div
              class="absolute inset-y-0 rounded-full bg-gradient-to-r from-indigo-400/60 to-amber-400/60"
              :style="{ left: '10%', right: '10%' }"
            ></div>
          </div>
          <span class="text-white text-sm font-medium tabular-nums">{{ day.tempMax }}{{ temperatureUnit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
