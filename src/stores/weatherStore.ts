import { defineStore } from 'pinia';
import axios from 'axios';
import { useThrottleFn } from '@vueuse/core';
import type {
  WeatherState,
  WeatherData,
  WeatherError,
  CacheEntry,
  ForecastItem,
} from '../types/weather';
import { WeatherErrorType } from '../types/weather';
import { compress } from 'lz-string';

const FAVORITES_STORAGE_KEY = 'weather-favorites';
const UNITS_STORAGE_KEY = 'weather-units';
const MAX_CACHE_SIZE = 50; // Maximum number of cached locations
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_OPENWEATHER_BASE_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface WeatherParams {
  q?: string;
  lat?: number;
  lon?: number;
}

// Helper function to safely parse stored favorites
const loadStoredFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (item) =>
            typeof item === 'object' &&
            typeof item.name === 'string' &&
            typeof item.lat === 'number' &&
            typeof item.lon === 'number'
        )
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
  return [];
};

// Helper function to safely load stored units preference
const loadStoredUnits = (): 'metric' | 'imperial' => {
  try {
    const stored = localStorage.getItem(UNITS_STORAGE_KEY);
    if (stored === 'metric' || stored === 'imperial') {
      return stored;
    }
  } catch (error) {
    console.error('Error loading units preference:', error);
  }
  return 'metric'; // Default to metric if no valid stored preference
};

export const useWeatherStore = defineStore('weather', {
  state: (): WeatherState => ({
    weatherData: null,
    loading: false,
    error: null,
    cache: new Map<string, CacheEntry>(),
    cacheCleanupInterval: null,
    lastFetchTimestamp: 0,
    favorites: loadStoredFavorites(), // Load favorites from localStorage
    selectedUnit: loadStoredUnits(), // Load units preference from localStorage
  }),

  actions: {
    handleError(error: unknown): WeatherError {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          return {
            type: WeatherErrorType.NETWORK,
            message: 'Network error. Please check your connection.',
          };
        }

        switch (error.response.status) {
          case 429:
            return {
              type: WeatherErrorType.API_LIMIT,
              message: 'Too many requests. Please try again later.',
            };
          case 404:
            return {
              type: WeatherErrorType.LOCATION,
              message: 'Location not found. Please check the city name.',
            };
          default:
            return {
              type: WeatherErrorType.UNKNOWN,
              message: error.response.data?.message || 'An unexpected error occurred.',
            };
        }
      }

      return {
        type: WeatherErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      };
    },

    initializeCacheCleanup() {
      // Clear any existing interval first to prevent multiple intervals
      if (this.cacheCleanupInterval !== null) {
        window.clearInterval(this.cacheCleanupInterval);
        this.cacheCleanupInterval = null;
      }

      // Set a new interval
      this.cacheCleanupInterval = window.setInterval(
        () => {
          this.cleanCache();
        },
        5 * 60 * 1000
      );
    },

    cleanCache() {
      if (this.cache.size <= MAX_CACHE_SIZE) {
        return;
      }

      const entries = Array.from(this.cache.entries());
      // Sort by last accessed (timestamp)
      entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      const entriesToRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    },

    initialize() {
      // Only initialize if not already initialized
      if (this.cacheCleanupInterval === null) {
        this.initializeCacheCleanup();
      }
    },

    // Cleanup when store is no longer needed
    cleanup() {
      // Changed from $dispose
      if (this.cacheCleanupInterval) {
        window.clearInterval(this.cacheCleanupInterval);
        this.cacheCleanupInterval = null;
      }
    },

    getCacheKey(params: WeatherParams): string {
      return params.q || `${params.lat},${params.lon}`;
    },

    isCacheValid(cacheEntry: CacheEntry): boolean {
      return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
    },

    async delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async fetchWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
      try {
        return await fn();
      } catch (error) {
        if (
          retries > 0 &&
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status >= 500
        ) {
          await this.delay(RETRY_DELAY);
          return this.fetchWithRetry(fn, retries - 1);
        }
        throw error;
      }
    },

    async makeWeatherRequests(params: WeatherParams) {
      const requestParams = {
        ...params,
        units: this.selectedUnit,
        appid: API_KEY,
      };

      const currentWeather = await this.fetchWithRetry(() =>
        axios.get(`${BASE_URL}/weather`, { params: requestParams })
      );

      const { lat, lon } = currentWeather.data.coord;

      const [forecast, airPollution] = await Promise.all([
        this.fetchWithRetry(() => axios.get(`${BASE_URL}/forecast`, { params: requestParams })),
        this.fetchWithRetry(() =>
          axios.get(`${BASE_URL}/air_pollution`, {
            params: { lat, lon, appid: API_KEY },
          })
        ).catch(() => null),
      ]);

      return { currentWeather, forecast, airPollution, uvData: undefined };
    },

    processWeatherData(currentWeather: any, forecast: any, airPollution?: any): WeatherData {
      // Process hourly data first (next 24 hours)
      const hourlyData = forecast.data.list.slice(0, 8).map((item: ForecastItem) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        temp: Math.round(item.main.temp),
        icon: item.weather[0].icon,
        description: item.weather[0].description,
      }));

      // Get current date at midnight for proper day boundary comparison
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowMidnight = new Date(todayMidnight);
      tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

      // Process and group forecast data by day
      const dailyForecasts = new Map<string, ForecastItem[]>();

      forecast.data.list.forEach((item: ForecastItem) => {
        const itemDate = new Date(item.dt * 1000);
        const dateStr = itemDate.toISOString().split('T')[0];

        if (!dailyForecasts.has(dateStr)) {
          dailyForecasts.set(dateStr, []);
        }
        dailyForecasts.get(dateStr)!.push(item);
      });

      // Get today's min/max temperatures
      const todayStr = todayMidnight.toISOString().split('T')[0];
      const todayForecast = dailyForecasts.get(todayStr) || [];

      // Initialize min/max with current weather data
      const currentTemp = currentWeather.data.main.temp;
      let todayTempMin = currentWeather.data.main.temp_min;
      let todayTempMax = currentWeather.data.main.temp_max;

      // If we have forecast data for today, compare and take the most extreme values
      if (todayForecast.length > 0) {
        const todayTemps = todayForecast.map((item) => item.main.temp);
        // Include current temps in the comparison
        todayTemps.push(currentTemp, todayTempMin, todayTempMax);
        todayTempMin = Math.min(...todayTemps);
        todayTempMax = Math.max(...todayTemps);
      }

      // Process forecast for next 5 days
      const processedForecast = Array.from(dailyForecasts.entries())
        .filter(([dateStr]) => {
          const forecastDate = new Date(dateStr);
          return forecastDate >= todayMidnight;
        })
        .map(([date, items]) => {
          // Calculate true min/max temperatures for each day
          const temps = items.map((item) => item.main.temp);
          const maxTemp = Math.max(...temps);
          const minTemp = Math.min(...temps);

          // Get the most common weather condition for the day
          const weatherCounts = new Map<string, number>();
          items.forEach((item) => {
            const desc = item.weather[0].description;
            weatherCounts.set(desc, (weatherCounts.get(desc) || 0) + 1);
          });

          const mostCommonWeather = Array.from(weatherCounts.entries()).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0];

          // Get corresponding icon for most common weather
          const weatherIcon =
            items.find((item) => item.weather[0].description === mostCommonWeather)?.weather[0]
              .icon || items[0].weather[0].icon;

          // Calculate average humidity and wind speed
          const avgHumidity = Math.round(
            items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length
          );
          const avgWindSpeed = Number(
            (items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length).toFixed(1)
          );

          // Get highest precipitation probability for the day
          const maxPrecipitation = Math.round(
            Math.max(...items.map((item) => (item.pop || 0) * 100))
          );

          return {
            date,
            temp: Math.round((maxTemp + minTemp) / 2),
            tempMin: Math.round(minTemp),
            tempMax: Math.round(maxTemp),
            description: mostCommonWeather,
            icon: weatherIcon,
            humidity: avgHumidity,
            windSpeed: avgWindSpeed,
            precipitation: maxPrecipitation,
          };
        })
        .slice(0, 5); // Ensure we get exactly 5 days

      return {
        city: currentWeather.data.name,
        coord: {
          lat: currentWeather.data.coord.lat,
          lon: currentWeather.data.coord.lon,
        },
        current: {
          temp: Math.round(currentTemp),
          feelsLike: Math.round(currentWeather.data.main.feels_like),
          tempMin: Math.round(todayTempMin),
          tempMax: Math.round(todayTempMax),
          humidity: currentWeather.data.main.humidity,
          windSpeed: currentWeather.data.wind.speed,
          description: currentWeather.data.weather[0].description,
          icon: currentWeather.data.weather[0].icon,
          sunrise: currentWeather.data.sys.sunrise,
          sunset: currentWeather.data.sys.sunset,
          pressure: currentWeather.data.main.pressure,
          visibility: currentWeather.data.visibility,
          uvIndex: undefined,
          airQuality: airPollution
            ? {
                aqi: airPollution.data.list[0].main.aqi,
                co: airPollution.data.list[0].components.co,
                no2: airPollution.data.list[0].components.no2,
                o3: airPollution.data.list[0].components.o3,
                pm2_5: airPollution.data.list[0].components.pm2_5,
                pm10: airPollution.data.list[0].components.pm10,
              }
            : undefined,
        },
        forecast: processedForecast,
        hourlyForecast: hourlyData,
      };
    },

    throttledFetchWeatherData: useThrottleFn(async function (this: any, params: WeatherParams) {
      return this.fetchWeatherData(params);
    }, 1000),

    async fetchWeatherData(params: WeatherParams) {
      if (!API_KEY) {
        this.error = {
          type: WeatherErrorType.UNKNOWN,
          message: 'API key not configured',
        };
        console.error('OpenWeatherMap API key is not configured');
        return;
      }

      const cacheKey = this.getCacheKey(params);
      const cached = this.cache.get(cacheKey);

      if (cached && this.isCacheValid(cached)) {
        this.weatherData = cached.data;
        this.updateCacheAccessTime(cacheKey);
        this.error = null;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const { currentWeather, forecast, airPollution } = await this.makeWeatherRequests(params);

        const processedData = this.processWeatherData(currentWeather, forecast, airPollution);

        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          compressed: compress(JSON.stringify(processedData)),
        });

        this.weatherData = processedData;
        this.lastFetchTimestamp = Date.now();
      } catch (error) {
        this.error = this.handleError(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchWeather(city: string) {
      return this.throttledFetchWeatherData({ q: city });
    },

    async fetchWeatherByCoords(lat: number, lon: number) {
      return this.throttledFetchWeatherData({ lat, lon });
    },

    updateCacheAccessTime(key: string) {
      const cacheEntry = this.cache.get(key);
      if (cacheEntry) {
        cacheEntry.lastAccessed = Date.now();
        this.cache.set(key, cacheEntry);
      }
    },

    async toggleUnit() {
      try {
        this.loading = true; // Set loading state

        // Update the unit
        const newUnit = this.selectedUnit === 'metric' ? 'imperial' : 'metric';

        // Store new unit first to ensure consistency
        localStorage.setItem(UNITS_STORAGE_KEY, newUnit);
        this.selectedUnit = newUnit;

        // Clear cache before fetching new data
        this.clearCache();

        // Refresh weather data if available
        if (this.weatherData) {
          const { lat, lon } = this.weatherData.coord;
          await this.fetchWeatherData({ lat, lon });
        }
      } catch (error) {
        // Handle error and restore previous unit if needed
        console.error('Error toggling unit:', error);
        this.error = this.handleError(error);

        // Restore previous unit
        const previousUnit = this.selectedUnit === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem(UNITS_STORAGE_KEY, previousUnit);
        this.selectedUnit = previousUnit;
      } finally {
        this.loading = false;
      }
    },

    addToFavorites() {
      if (this.weatherData) {
        const { city, coord } = this.weatherData;
        if (!this.favorites.some((f) => f.name === city)) {
          this.favorites.push({
            name: city,
            lat: coord.lat,
            lon: coord.lon,
          });
          // Persist updated favorites
          this.saveFavorites();
        }
      }
    },

    removeFromFavorites(cityName: string) {
      this.favorites = this.favorites.filter((f) => f.name !== cityName);
      // Persist updated favorites
      this.saveFavorites();
    },

    // New method to handle favorites persistence
    saveFavorites() {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.favorites));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    },

    clearCache() {
      this.cache.clear();
    },

    clearExpiredCache() {
      const now = Date.now();
      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp >= CACHE_DURATION) {
          this.cache.delete(key);
        }
      });
    },

    // Optional: Method to clear all stored data
    clearStoredData() {
      try {
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        localStorage.removeItem(UNITS_STORAGE_KEY);
        this.favorites = [];
        this.selectedUnit = 'metric';
      } catch (error) {
        console.error('Error clearing stored data:', error);
      }
    },
  },
});
