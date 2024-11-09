import { defineStore } from 'pinia';
import axios from 'axios';
import type { WeatherState, WeatherData } from '../types/weather';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_OPENWEATHER_BASE_URL;

export const useWeatherStore = defineStore('weather', {
  state: (): WeatherState => ({
    weatherData: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchWeatherByCoords(lat: number, lon: number) {
      if (!API_KEY) {
        this.error = 'API key not configured';
        console.error('OpenWeatherMap API key is not configured');
        return;
      }

      this.loading = true;
      this.error = null;
      
      try {
        // Fetch current weather using coordinates
        const currentWeather = await axios.get(
          `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        // Fetch 5-day forecast using coordinates
        const forecast = await axios.get(
          `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        // Process and format the data
        this.weatherData = {
          city: currentWeather.data.name,
          current: {
            temp: Math.round(currentWeather.data.main.temp),
            humidity: currentWeather.data.main.humidity,
            windSpeed: currentWeather.data.wind.speed,
            description: currentWeather.data.weather[0].description,
            icon: currentWeather.data.weather[0].icon,
          },
          forecast: forecast.data.list
            .filter((item: any, index: number) => index % 8 === 0)
            .map((item: any) => ({
              date: new Date(item.dt * 1000).toLocaleDateString(),
              temp: Math.round(item.main.temp),
              description: item.weather[0].description,
              icon: item.weather[0].icon,
            })),
        };
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch weather data. Please try again.';
        console.error('Weather fetch error:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchWeather(city: string) {
      if (!API_KEY) {
        this.error = 'API key not configured';
        console.error('OpenWeatherMap API key is not configured');
        return;
      }

      this.loading = true;
      this.error = null;
      
      try {
        // Fetch current weather
        const currentWeather = await axios.get(
          `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        );

        // Fetch 5-day forecast
        const forecast = await axios.get(
          `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );

        // Process and format the data
        this.weatherData = {
          city,
          current: {
            temp: Math.round(currentWeather.data.main.temp),
            humidity: currentWeather.data.main.humidity,
            windSpeed: currentWeather.data.wind.speed,
            description: currentWeather.data.weather[0].description,
            icon: currentWeather.data.weather[0].icon,
          },
          forecast: forecast.data.list
            .filter((item: any, index: number) => index % 8 === 0)
            .map((item: any) => ({
              date: new Date(item.dt * 1000).toLocaleDateString(),
              temp: Math.round(item.main.temp),
              description: item.weather[0].description,
              icon: item.weather[0].icon,
            })),
        };
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch weather data. Please try again.';
        console.error('Weather fetch error:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});