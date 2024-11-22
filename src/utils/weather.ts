export const formatters = {
    temperature: (value: number, unit: 'metric' | 'imperial'): string => {
      return `${Math.round(value)}${unit === 'metric' ? '°C' : '°F'}`;
    },
    
    windSpeed: (value: number, unit: 'metric' | 'imperial'): string => {
      return `${value.toFixed(1)} ${unit === 'metric' ? 'm/s' : 'mph'}`;
    },
    
    time: (timestamp: number): string => {
      return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
  
    visibility: (meters: number): string => {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };