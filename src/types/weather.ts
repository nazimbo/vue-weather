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

// New error handling types
export enum WeatherErrorType {
  NETWORK = 'NETWORK',
  API_LIMIT = 'API_LIMIT',
  LOCATION = 'LOCATION',
  UNKNOWN = 'UNKNOWN'
}

export interface WeatherError {
  type: WeatherErrorType;
  message: string;
}

// Export CacheEntry interface
export interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

export interface WeatherState {
  weatherData: WeatherData | null;
  loading: boolean;
  error: WeatherError | null;
  cache: Map<string, CacheEntry>;
  lastFetchTimestamp: number;
}