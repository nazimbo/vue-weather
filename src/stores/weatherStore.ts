import { defineStore } from 'pinia';
import axios from 'axios';
import { useThrottleFn } from '@vueuse/core';
import type { 
  WeatherState, 
  WeatherData, 
  WeatherError,
  CacheEntry,
} from '../types/weather';
import { WeatherErrorType } from '../types/weather';

const FAVORITES_STORAGE_KEY = 'weather-favorites';
const UNITS_STORAGE_KEY = 'weather-units';

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

// Helper function to safely parse stored favorites
const loadStoredFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => 
        typeof item === 'object' && 
        typeof item.name === 'string' && 
        typeof item.lat === 'number' && 
        typeof item.lon === 'number'
      )) {
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
    lastFetchTimestamp: 0,
    favorites: loadStoredFavorites(), // Load favorites from localStorage
    selectedUnit: loadStoredUnits()   // Load units preference from localStorage
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
        units: this.selectedUnit,
        appid: API_KEY,
      };

      const currentWeather = await this.fetchWithRetry(() => 
        axios.get(`${BASE_URL}/weather`, { params: requestParams })
      );

      const { lat, lon } = currentWeather.data.coord;

      const [forecast, airPollution, uvData] = await Promise.all([
        this.fetchWithRetry(() => 
          axios.get(`${BASE_URL}/forecast`, { params: requestParams })
        ),
        this.fetchWithRetry(() => 
          axios.get(`${BASE_URL}/air_pollution`, { 
            params: { lat, lon, appid: API_KEY }
          })
        ).catch(() => null),
        this.fetchWithRetry(() => 
          axios.get(`${BASE_URL}/uvi`, { 
            params: { lat, lon, appid: API_KEY }
          })
        ).catch(() => null)
      ]);

      return { currentWeather, forecast, airPollution, uvData };
    },

    processWeatherData(
      currentWeather: any, 
      forecast: any, 
      airPollution?: any, 
      uvData?: any
    ): WeatherData {
      // Process hourly data first (next 24 hours)
      const hourlyData = forecast.data.list.slice(0, 8).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temp: Math.round(item.main.temp),
        icon: item.weather[0].icon,
        description: item.weather[0].description
      }));
    
      // Process daily forecast data
      const dailyForecasts = new Map<string, any[]>();
      
      // Debug logging
      console.log('Total forecast items:', forecast.data.list.length);
      
      forecast.data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        if (!dailyForecasts.has(dateStr)) {
          dailyForecasts.set(dateStr, []);
        }
        dailyForecasts.get(dateStr)!.push(item);
      });
    
      // Debug logging
      console.log('Unique dates:', Array.from(dailyForecasts.keys()));
    
      // Get today's date at start of day for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      // Process all dates except today
      const processedForecast = Array.from(dailyForecasts.entries())
        .filter(([dateStr]) => {
          const forecastDate = new Date(dateStr);
          return forecastDate > today;
        })
        .map(([date, items]) => {
          const temps = items.map(item => item.main.temp);
          const maxTemp = Math.max(...temps);
          const minTemp = Math.min(...temps);
          
          // Get the most common weather condition for the day
          const weatherCounts = new Map<string, number>();
          items.forEach(item => {
            const desc = item.weather[0].description;
            weatherCounts.set(desc, (weatherCounts.get(desc) || 0) + 1);
          });
          const mostCommonWeather = Array.from(weatherCounts.entries())
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
          
          // Get the corresponding icon for the most common weather
          const weatherIcon = items.find(item => 
            item.weather[0].description === mostCommonWeather
          )?.weather[0].icon || items[0].weather[0].icon;
    
          // Calculate average humidity and wind speed
          const avgHumidity = Math.round(
            items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length
          );
          const avgWindSpeed = Number(
            (items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length).toFixed(1)
          );
    
          // Get highest precipitation probability for the day
          const maxPrecipitation = Math.round(
            Math.max(...items.map(item => (item.pop || 0) * 100))
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
            precipitation: maxPrecipitation
          };
        })
        .slice(0, 5); // Ensure we get exactly 5 days
    
      // Debug logging
      console.log('Processed forecast days:', processedForecast.length);
      console.log('Forecast dates:', processedForecast.map(f => f.date));
    
      return {
        city: currentWeather.data.name,
        coord: {
          lat: currentWeather.data.coord.lat,
          lon: currentWeather.data.coord.lon
        },
        current: {
          temp: Math.round(currentWeather.data.main.temp),
          feelsLike: Math.round(currentWeather.data.main.feels_like),
          tempMin: Math.round(currentWeather.data.main.temp_min),
          tempMax: Math.round(currentWeather.data.main.temp_max),
          humidity: currentWeather.data.main.humidity,
          windSpeed: currentWeather.data.wind.speed,
          description: currentWeather.data.weather[0].description,
          icon: currentWeather.data.weather[0].icon,
          sunrise: currentWeather.data.sys.sunrise,
          sunset: currentWeather.data.sys.sunset,
          pressure: currentWeather.data.main.pressure,
          visibility: currentWeather.data.visibility,
          uvIndex: uvData?.data.value,
          airQuality: airPollution ? {
            aqi: airPollution.data.list[0].main.aqi,
            co: airPollution.data.list[0].components.co,
            no2: airPollution.data.list[0].components.no2,
            o3: airPollution.data.list[0].components.o3,
            pm2_5: airPollution.data.list[0].components.pm2_5,
            pm10: airPollution.data.list[0].components.pm10,
          } : undefined,
        },
        forecast: processedForecast,
        hourlyForecast: hourlyData
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
        const { currentWeather, forecast, airPollution, uvData } = 
          await this.makeWeatherRequests(params);
        
        const processedData = this.processWeatherData(
          currentWeather, 
          forecast, 
          airPollution, 
          uvData
        );
        
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

    async toggleUnit() {
      // Update the unit
      this.selectedUnit = this.selectedUnit === 'metric' ? 'imperial' : 'metric';
      // Persist unit preference
      localStorage.setItem(UNITS_STORAGE_KEY, this.selectedUnit);
      
      // Clear cache when changing units to force fresh data
      this.clearCache();
      
      // Refresh weather data if available
      if (this.weatherData) {
        const { lat, lon } = this.weatherData.coord;
        // Use the non-throttled version to ensure immediate update
        await this.fetchWeatherData({ lat, lon });
      }
    },

    addToFavorites() {
      if (this.weatherData) {
        const { city, coord } = this.weatherData;
        if (!this.favorites.some(f => f.name === city)) {
          this.favorites.push({
            name: city,
            lat: coord.lat,
            lon: coord.lon
          });
          // Persist updated favorites
          this.saveFavorites();
        }
      }
    },

    removeFromFavorites(cityName: string) {
      this.favorites = this.favorites.filter(f => f.name !== cityName);
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
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp >= CACHE_DURATION) {
          this.cache.delete(key);
        }
      }
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
    }
  },
});