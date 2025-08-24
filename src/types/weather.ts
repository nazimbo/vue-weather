export interface WeatherData {
  city: string;
  coord: {
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
    sunrise: number;
    sunset: number;
    pressure: number;
    visibility: number;
    uvIndex?: number;
    airQuality?: {
      aqi: number;
      co: number;
      no2: number;
      o3: number;
      pm2_5: number;
      pm10: number;
    };
  };
  forecast: ProcessedForecast[];
  hourlyForecast: Array<{
    time: string;
    temp: number;
    icon: string;
    description: string;
  }>;
}

export enum WeatherErrorType {
  NETWORK = 'NETWORK',
  API_LIMIT = 'API_LIMIT',
  LOCATION = 'LOCATION',
  UNKNOWN = 'UNKNOWN',
}

export interface WeatherError {
  type: WeatherErrorType;
  message: string;
}

export interface CacheEntry {
  data: WeatherData;
  timestamp: number;
  lastAccessed: number;
  compressed: string;
}

export interface WeatherState {
  weatherData: WeatherData | null;
  loading: boolean;
  error: WeatherError | null;
  cache: Map<string, CacheEntry>;
  cacheCleanupInterval: number | null;
  lastFetchTimestamp: number;
  favorites: Array<{
    name: string;
    lat: number;
    lon: number;
  }>;
  selectedUnit: 'metric' | 'imperial';
}

interface ProcessedForecast {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}
