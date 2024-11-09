import { defineStore } from 'pinia';
import axios from 'axios';
import { useThrottleFn } from '@vueuse/core';
import type { 
  WeatherState, 
  WeatherData, 
  WeatherError,
  CacheEntry  // Add this import
} from '../types/weather';
import { WeatherErrorType } from '../types/weather';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_OPENWEATHER_BASE_URL;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface WeatherParams {
  q?: string;
  lat?: number;
  lon?: number;
}

export const useWeatherStore = defineStore('weather', {
  state: (): WeatherState => ({
    weatherData: null,
    loading: false,
    error: null,
    cache: new Map<string, CacheEntry>(),
    lastFetchTimestamp: 0,
  }),

  actions: {
    handleError(error: unknown): WeatherError {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          return {
            type: WeatherErrorType.NETWORK,
            message: 'Network error. Please check your connection.'
          };
        }
        
        switch (error.response.status) {
          case 429:
            return {
              type: WeatherErrorType.API_LIMIT,
              message: 'Too many requests. Please try again later.'
            };
          case 404:
            return {
              type: WeatherErrorType.LOCATION,
              message: 'Location not found. Please check the city name.'
            };
          default:
            return {
              type: WeatherErrorType.UNKNOWN,
              message: error.response.data?.message || 'An unexpected error occurred.'
            };
        }
      }
      
      return {
        type: WeatherErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      };
    },

    getCacheKey(params: WeatherParams): string {
      return params.q || `${params.lat},${params.lon}`;
    },

    isCacheValid(cacheEntry: CacheEntry): boolean {
      return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
    },

    async delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    async fetchWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
      try {
        return await fn();
      } catch (error) {
        if (retries > 0 && 
            axios.isAxiosError(error) && 
            error.response && 
            error.response.status >= 500) {
          await this.delay(RETRY_DELAY);
          return this.fetchWithRetry(fn, retries - 1);
        }
        throw error;
      }
    },

    async makeWeatherRequests(params: WeatherParams) {
      const requestParams = {
        ...params,
        units: 'metric',
        appid: API_KEY,
      };

      return Promise.all([
        this.fetchWithRetry(() => 
          axios.get(`${BASE_URL}/weather`, { params: requestParams })
        ),
        this.fetchWithRetry(() => 
          axios.get(`${BASE_URL}/forecast`, { params: requestParams })
        ),
      ]);
    },

    processWeatherData(currentWeather: any, forecast: any): WeatherData {
      return {
        city: currentWeather.data.name,
        current: {
          temp: Math.round(currentWeather.data.main.temp),
          humidity: currentWeather.data.main.humidity,
          windSpeed: currentWeather.data.wind.speed,
          description: currentWeather.data.weather[0].description,
          icon: currentWeather.data.weather[0].icon,
        },
        forecast: forecast.data.list
          .filter((_: any, index: number) => index % 8 === 0)
          .map((item: any) => ({
            date: new Date(item.dt * 1000).toLocaleDateString(),
            temp: Math.round(item.main.temp),
            description: item.weather[0].description,
            icon: item.weather[0].icon,
          })),
      };
    },

    throttledFetchWeatherData: useThrottleFn(
      async function(this: any, params: WeatherParams) {
        return this.fetchWeatherData(params);
      },
      1000
    ),

    async fetchWeatherData(params: WeatherParams) {
      if (!API_KEY) {
        this.error = {
          type: WeatherErrorType.UNKNOWN,
          message: 'API key not configured'
        };
        console.error('OpenWeatherMap API key is not configured');
        return;
      }

      const cacheKey = this.getCacheKey(params);
      const cached = this.cache.get(cacheKey);

      if (cached && this.isCacheValid(cached)) {
        this.weatherData = cached.data;
        this.error = null;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const [currentWeather, forecast] = await this.makeWeatherRequests(params);
        const processedData = this.processWeatherData(currentWeather, forecast);
        
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now(),
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

    clearCache() {
      this.cache.clear();
    },

    clearExpiredCache() {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp >= CACHE_DURATION) {
          this.cache.delete(key);
        }
      }
    },
  },
});