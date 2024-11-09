// weather.ts
export interface WeatherData {
  city: string;
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    temp: number;
    description: string;
    icon: string;
  }>;
}

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

export interface WeatherState {
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
  cache: Map<string, CacheEntry>;
  lastFetchTimestamp: number;
}