<script setup lang="ts">
  import { computed } from 'vue';
  import { useWeatherStore } from '../stores/weatherStore';
  import { formatters } from '../utils/weather';

  const store = useWeatherStore();

  const isFavorite = computed(() => {
    if (!store.weatherData) return false;
    return store.favorites.some((f) => f.name === store.weatherData?.city);
  });

  const getAqiLabel = (aqi: number): { text: string; color: string } => {
    if (aqi <= 20) return { text: 'Good', color: 'text-emerald-400' };
    if (aqi <= 40) return { text: 'Fair', color: 'text-lime-400' };
    if (aqi <= 60) return { text: 'Moderate', color: 'text-amber-400' };
    if (aqi <= 80) return { text: 'Poor', color: 'text-orange-400' };
    if (aqi <= 100) return { text: 'Very Poor', color: 'text-red-400' };
    return { text: 'Hazardous', color: 'text-rose-500' };
  };
</script>

<template>
  <div v-if="store.weatherData" class="animate-fade-up">
    <!-- Hero card -->
    <div class="glass-strong rounded-2xl p-6 sm:p-8 relative overflow-hidden">
      <!-- Subtle glow accent behind icon -->
      <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/8 blur-[60px] pointer-events-none"></div>

      <!-- Top row: city + actions -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            {{ store.weatherData.city }}
          </h2>
          <p class="text-white/40 text-sm mt-0.5 capitalize">{{ store.weatherData.current.description }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="store.toggleUnit()"
            :disabled="store.loading"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 hover:bg-white/10 border border-white/8 transition-all duration-200 disabled:opacity-40"
          >
            {{ store.selectedUnit === 'metric' ? '°C' : '°F' }}
          </button>
          <button
            @click="isFavorite ? store.removeFromFavorites(store.weatherData!.city) : store.addToFavorites()"
            class="p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200"
            :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          >
            <svg v-if="isFavorite" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-amber-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-white/30 hover:text-amber-400 transition-colors"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </div>
      </div>

      <!-- Main temp display -->
      <div class="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-8 mb-8">
        <div class="text-7xl sm:text-8xl animate-float select-none">{{ store.weatherData.current.icon }}</div>
        <div class="text-center sm:text-left">
          <div class="text-6xl sm:text-7xl font-extralight text-white tracking-tighter leading-none">
            {{ formatters.temperature(store.weatherData.current.temp, store.selectedUnit) }}
          </div>
          <div class="text-white/35 text-sm mt-2">
            Feels like {{ formatters.temperature(store.weatherData.current.feelsLike, store.selectedUnit) }}
          </div>
        </div>
        <!-- Temp range pill -->
        <div class="sm:ml-auto flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
          <div class="text-center">
            <span class="text-[10px] uppercase tracking-wider text-white/30 block">High</span>
            <span class="text-white/90 font-medium text-sm">{{ formatters.temperature(store.weatherData.current.tempMax, store.selectedUnit) }}</span>
          </div>
          <div class="w-px h-8 bg-white/10"></div>
          <div class="text-center">
            <span class="text-[10px] uppercase tracking-wider text-white/30 block">Low</span>
            <span class="text-white/90 font-medium text-sm">{{ formatters.temperature(store.weatherData.current.tempMin, store.selectedUnit) }}</span>
          </div>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <!-- Wind -->
        <div class="bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div class="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sky-400/60"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
            <span class="text-[11px] text-white/35 uppercase tracking-wider">Wind</span>
          </div>
          <p class="text-white/90 font-medium text-sm">{{ formatters.windSpeed(store.weatherData.current.windSpeed, store.selectedUnit) }}</p>
        </div>

        <!-- Humidity -->
        <div class="bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div class="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400/60"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
            <span class="text-[11px] text-white/35 uppercase tracking-wider">Humidity</span>
          </div>
          <p class="text-white/90 font-medium text-sm">{{ store.weatherData.current.humidity }}%</p>
        </div>

        <!-- Pressure -->
        <div class="bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div class="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-violet-400/60"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span class="text-[11px] text-white/35 uppercase tracking-wider">Pressure</span>
          </div>
          <p class="text-white/90 font-medium text-sm">{{ store.weatherData.current.pressure }} hPa</p>
        </div>

        <!-- Sunrise / Sunset -->
        <div class="bg-white/[0.03] rounded-xl p-4 border border-white/5">
          <div class="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-400/60"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <span class="text-[11px] text-white/35 uppercase tracking-wider">Sun</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-amber-300/80">↑</span>
            <span class="text-white/70">{{ formatters.time(store.weatherData.current.sunrise) }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm mt-0.5">
            <span class="text-orange-400/80">↓</span>
            <span class="text-white/70">{{ formatters.time(store.weatherData.current.sunset) }}</span>
          </div>
        </div>
      </div>

      <!-- Air Quality (if available) -->
      <div
        v-if="store.weatherData.current.airQuality"
        class="mt-3 bg-white/[0.03] rounded-xl p-4 border border-white/5"
      >
        <div class="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400/60"><path d="M8 2c3 0 5 2 8 2s4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1V2s1-1 4-1"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
          <span class="text-[11px] text-white/35 uppercase tracking-wider">Air Quality</span>
        </div>
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-2xl font-light text-white/90">{{ store.weatherData.current.airQuality.aqi }}</span>
            <span :class="getAqiLabel(store.weatherData.current.airQuality.aqi).color" class="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5">
              {{ getAqiLabel(store.weatherData.current.airQuality.aqi).text }}
            </span>
          </div>
          <div class="flex items-center gap-3 text-xs text-white/35">
            <span>PM2.5 <span class="text-white/60">{{ store.weatherData.current.airQuality.pm2_5 }}</span></span>
            <span>PM10 <span class="text-white/60">{{ store.weatherData.current.airQuality.pm10 }}</span></span>
            <span>O3 <span class="text-white/60">{{ store.weatherData.current.airQuality.o3 }}</span></span>
            <span>NO2 <span class="text-white/60">{{ store.weatherData.current.airQuality.no2 }}</span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
