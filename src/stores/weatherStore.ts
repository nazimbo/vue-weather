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
import { compress } from 'lz-string';

const FAVORITES_STORAGE_KEY = 'weather-favorites';
const UNITS_STORAGE_KEY = 'weather-units';
const MAX_CACHE_SIZE = 50; // Maximum number of cached locations
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
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
      let lat: number, lon: number, cityName: string | undefined;
      
      // If we have a city name, we need to geocode it first
      if (params.q) {
        const geocodeResponse = await this.fetchWithRetry(() =>
          axios.get('https://geocoding-api.open-meteo.com/v1/search', {
            params: {
              name: params.q,
              count: 1,
              language: 'en',
              format: 'json'
            }
          })
        );
        
        if (!geocodeResponse.data.results || geocodeResponse.data.results.length === 0) {
          throw new Error('Location not found');
        }
        
        const location = geocodeResponse.data.results[0];
        lat = location.latitude;
        lon = location.longitude;
        // Build city name from geocoding response
        cityName = location.name;
        if (location.admin1) {
          cityName += `, ${location.admin1}`;
        }
        if (location.country) {
          cityName += `, ${location.country}`;
        }
      } else {
        lat = params.lat!;
        lon = params.lon!;
        // For coordinate-based requests, we'll try to get a city name using a free reverse geocoding service
        try {
          const reverseGeocodeResponse = await this.fetchWithRetry(() =>
            axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client`, {
              params: {
                latitude: lat,
                longitude: lon,
                localityLanguage: 'en'
              }
            })
          );
          
          if (reverseGeocodeResponse.data) {
            const data = reverseGeocodeResponse.data;
            if (data.city || data.locality) {
              cityName = data.city || data.locality;
              if (data.principalSubdivision) {
                cityName += `, ${data.principalSubdivision}`;
              }
              if (data.countryName) {
                cityName += `, ${data.countryName}`;
              }
            }
          }
        } catch (error) {
          // If reverse geocoding fails, we'll fall back to coordinates
          console.warn('Reverse geocoding failed:', error);
        }
      }

      const temperatureUnit = this.selectedUnit === 'imperial' ? 'fahrenheit' : 'celsius';
      const windSpeedUnit = this.selectedUnit === 'imperial' ? 'mph' : 'kmh';
      const precipitationUnit = this.selectedUnit === 'imperial' ? 'inch' : 'mm';

      const weatherParams = {
        latitude: lat,
        longitude: lon,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'weather_code',
          'surface_pressure',
          'wind_speed_10m',
          'wind_direction_10m'
        ].join(','),
        hourly: [
          'temperature_2m',
          'weather_code',
          'precipitation_probability'
        ].join(','),
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'weather_code',
          'precipitation_probability_max',
          'wind_speed_10m_max',
          'sunrise',
          'sunset'
        ].join(','),
        temperature_unit: temperatureUnit,
        wind_speed_unit: windSpeedUnit,
        precipitation_unit: precipitationUnit,
        timezone: 'auto',
        forecast_days: 7
      };

      const airQualityParams = {
        latitude: lat,
        longitude: lon,
        current: ['pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'ozone', 'european_aqi'].join(','),
        hourly: ['pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'ozone'].join(',')
      };

      const [weatherResponse, airQualityResponse] = await Promise.all([
        this.fetchWithRetry(() => axios.get(WEATHER_BASE_URL, { params: weatherParams })),
        this.fetchWithRetry(() => axios.get(AIR_QUALITY_BASE_URL, { params: airQualityParams })).catch(() => null),
      ]);

      return { 
        weatherResponse, 
        airQualityResponse, 
        lat, 
        lon,
        cityName
      };
    },

    // Helper function to map Open-Meteo weather codes to descriptions and icons
    getWeatherInfo(weatherCode: number, isNight: boolean = false) {
      const weatherMap: Record<number, { description: string; dayIcon: string; nightIcon: string }> = {
        0: { description: 'Clear sky', dayIcon: '01d', nightIcon: '01n' },
        1: { description: 'Mainly clear', dayIcon: '01d', nightIcon: '01n' },
        2: { description: 'Partly cloudy', dayIcon: '02d', nightIcon: '02n' },
        3: { description: 'Overcast', dayIcon: '03d', nightIcon: '03n' },
        45: { description: 'Fog', dayIcon: '50d', nightIcon: '50n' },
        48: { description: 'Depositing rime fog', dayIcon: '50d', nightIcon: '50n' },
        51: { description: 'Light drizzle', dayIcon: '09d', nightIcon: '09n' },
        53: { description: 'Moderate drizzle', dayIcon: '09d', nightIcon: '09n' },
        55: { description: 'Dense drizzle', dayIcon: '09d', nightIcon: '09n' },
        56: { description: 'Light freezing drizzle', dayIcon: '09d', nightIcon: '09n' },
        57: { description: 'Dense freezing drizzle', dayIcon: '09d', nightIcon: '09n' },
        61: { description: 'Slight rain', dayIcon: '10d', nightIcon: '10n' },
        63: { description: 'Moderate rain', dayIcon: '10d', nightIcon: '10n' },
        65: { description: 'Heavy rain', dayIcon: '10d', nightIcon: '10n' },
        66: { description: 'Light freezing rain', dayIcon: '13d', nightIcon: '13n' },
        67: { description: 'Heavy freezing rain', dayIcon: '13d', nightIcon: '13n' },
        71: { description: 'Slight snow fall', dayIcon: '13d', nightIcon: '13n' },
        73: { description: 'Moderate snow fall', dayIcon: '13d', nightIcon: '13n' },
        75: { description: 'Heavy snow fall', dayIcon: '13d', nightIcon: '13n' },
        77: { description: 'Snow grains', dayIcon: '13d', nightIcon: '13n' },
        80: { description: 'Slight rain showers', dayIcon: '09d', nightIcon: '09n' },
        81: { description: 'Moderate rain showers', dayIcon: '09d', nightIcon: '09n' },
        82: { description: 'Violent rain showers', dayIcon: '09d', nightIcon: '09n' },
        85: { description: 'Slight snow showers', dayIcon: '13d', nightIcon: '13n' },
        86: { description: 'Heavy snow showers', dayIcon: '13d', nightIcon: '13n' },
        95: { description: 'Thunderstorm', dayIcon: '11d', nightIcon: '11n' },
        96: { description: 'Thunderstorm with slight hail', dayIcon: '11d', nightIcon: '11n' },
        99: { description: 'Thunderstorm with heavy hail', dayIcon: '11d', nightIcon: '11n' },
      };
      
      const weather = weatherMap[weatherCode] || { description: 'Unknown', dayIcon: '01d', nightIcon: '01n' };
      return {
        description: weather.description,
        icon: isNight ? weather.nightIcon : weather.dayIcon
      };
    },

    processWeatherData(weatherResponse: any, airQualityResponse?: any, lat?: number, lon?: number, cityName?: string): WeatherData {
      const data = weatherResponse.data;
      
      // Get city name from geocoding result or use coordinates
      let cityDisplayName = cityName || `${lat?.toFixed(2)}, ${lon?.toFixed(2)}`;
      
      
      // Process hourly data (next 24 hours)
      const hourlyData = data.hourly.time.slice(0, 24).map((time: string, index: number) => {
        const hourDateTime = new Date(time);
        
        // Determine if this hour is during night time
        // We need to find the correct day's sunrise/sunset times
        const hourDate = hourDateTime.toISOString().split('T')[0];
        const dayIndex = data.daily.time.findIndex((dailyTime: string) => dailyTime === hourDate);
        
        let isNight = false;
        if (dayIndex >= 0 && data.daily.sunrise && data.daily.sunset) {
          const sunrise = new Date(data.daily.sunrise[dayIndex]);
          const sunset = new Date(data.daily.sunset[dayIndex]);
          isNight = hourDateTime < sunrise || hourDateTime > sunset;
        }
        
        const weatherInfo = this.getWeatherInfo(data.hourly.weather_code[index], isNight);
        return {
          time: hourDateTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          temp: Math.round(data.hourly.temperature_2m[index]),
          icon: weatherInfo.icon,
          description: weatherInfo.description,
        };
      });

      // Process daily forecast data (next 5 days)
      const processedForecast = data.daily.time.slice(0, 5).map((date: string, index: number) => {
        const weatherInfo = this.getWeatherInfo(data.daily.weather_code[index]);
        const tempMin = Math.round(data.daily.temperature_2m_min[index]);
        const tempMax = Math.round(data.daily.temperature_2m_max[index]);
        
        return {
          date,
          temp: Math.round((tempMax + tempMin) / 2),
          tempMin,
          tempMax,
          description: weatherInfo.description,
          icon: weatherInfo.icon,
          humidity: data.current.relative_humidity_2m || 0, // Use current humidity as daily average
          windSpeed: data.daily.wind_speed_10m_max[index] || 0,
          precipitation: Math.round(data.daily.precipitation_probability_max[index] || 0),
        };
      });

      // Get current weather info
      // Determine if it's currently night time
      const now = new Date();
      const todaySunrise = new Date(data.daily.sunrise[0]);
      const todaySunset = new Date(data.daily.sunset[0]);
      const isCurrentlyNight = now < todaySunrise || now > todaySunset;
      
      const currentWeatherInfo = this.getWeatherInfo(data.current.weather_code, isCurrentlyNight);
      
      // Calculate today's min/max from daily data (first day)
      const todayTempMin = Math.round(data.daily.temperature_2m_min[0]);
      const todayTempMax = Math.round(data.daily.temperature_2m_max[0]);
      
      return {
        city: cityDisplayName,
        coord: {
          lat: data.latitude,
          lon: data.longitude,
        },
        current: {
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          tempMin: todayTempMin,
          tempMax: todayTempMax,
          humidity: Math.round(data.current.relative_humidity_2m),
          windSpeed: data.current.wind_speed_10m,
          description: currentWeatherInfo.description,
          icon: currentWeatherInfo.icon,
          sunrise: new Date(data.daily.sunrise[0]).getTime() / 1000,
          sunset: new Date(data.daily.sunset[0]).getTime() / 1000,
          pressure: Math.round(data.current.surface_pressure),
          visibility: 10000, // Open-Meteo doesn't provide visibility, use default 10km
          uvIndex: undefined,
          airQuality: airQualityResponse
            ? {
                aqi: Math.round(airQualityResponse.data.current.european_aqi || 0),
                co: Math.round(airQualityResponse.data.current.carbon_monoxide || 0),
                no2: Math.round(airQualityResponse.data.current.nitrogen_dioxide || 0),
                o3: Math.round(airQualityResponse.data.current.ozone || 0),
                pm2_5: Math.round(airQualityResponse.data.current.pm2_5 || 0),
                pm10: Math.round(airQualityResponse.data.current.pm10 || 0),
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
        const { weatherResponse, airQualityResponse, lat, lon, cityName } = await this.makeWeatherRequests(params);

        const processedData = this.processWeatherData(weatherResponse, airQualityResponse, lat, lon, cityName);

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
