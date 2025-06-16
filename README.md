# Vue.js Weather Application

This is a real-time weather application built with Vue.js 3, TypeScript, and Tailwind CSS. It fetches weather data from the Open-Meteo API, providing current conditions, forecasts, and user-friendly features with no API key required.

## Features

- **Real-Time Weather Data:**
  - Current weather conditions: temperature, humidity, wind speed, air quality.
  - 5-day forecast with daily summaries.
  - Hourly forecast for the next 24 hours with proper day/night icons.
- **Search Functionality:**
  - Search weather by city name with autocomplete suggestions.
  - Fetch weather data for the user's current location using geolocation.
  - Real-time location suggestions powered by Open-Meteo geocoding.
- **Favorites Management:**
  - Save, view, and remove favorite locations.
  - Persist favorite locations using localStorage.
- **Units Preference:**
  - Switch between metric (Celsius, km/h) and imperial (Fahrenheit, mph) units.
  - Changes persist across sessions.
- **Smart Icon System:**
  - Dynamic day/night icons based on actual sunrise/sunset times.
  - Accurate weather condition representations.
- **Caching:**
  - Cache weather data for improved performance.
  - Automatic cleanup of expired cache entries.
  - Cache size limit of 50 entries.
- **Developer Tools:**
  - Accessible in development mode for debugging.
  - Displays cache size, current state, and actions to clear data or cache.

## Technical Stack

- **Frontend:**
  - Framework: Vue.js 3
  - State Management: Pinia
  - Styling: Tailwind CSS
  - API Integration: Axios
  - Utility library: @vueuse/core
- **Backend Services:**
  - Weather API: Open-Meteo (free, no API key required)
  - Air Quality API: Open-Meteo
  - Geocoding API: Open-Meteo
  - Reverse Geocoding: BigDataCloud (for coordinate-based searches)
- **Development Tools:**
  - Build Tool: Vite
  - Programming Language: TypeScript

## Setup and Usage

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/nazimbo/vue-weather
    cd vue-weather
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **No API Keys Required:**

    - This application uses Open-Meteo APIs which are completely free and require no API keys.
    - No environment variables need to be configured.
    - Simply install dependencies and run the application!

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Build for production:**

    ```bash
    npm run build
    ```

6.  **Preview the production build:**

    ```bash
    npm run preview
    ```

## API Integration

### Weather Data - Open-Meteo
- **Base URL:** `https://api.open-meteo.com/v1/forecast`
- **Features:**
  - Current weather conditions
  - 7-day forecast with hourly data
  - Multiple weather models for accuracy
  - Temperature, humidity, wind, precipitation
- **Parameters:**
  - `latitude, longitude`: Coordinates
  - `current`: Current weather variables
  - `hourly`: Hourly forecast variables
  - `daily`: Daily forecast variables
  - `temperature_unit`: celsius or fahrenheit
  - `wind_speed_unit`: kmh or mph

### Air Quality Data - Open-Meteo
- **Base URL:** `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Features:**
  - PM2.5, PM10 particulate matter
  - CO, NO2, O3 gas concentrations
  - European AQI index
- **Parameters:**
  - `latitude, longitude`: Coordinates
  - `current`: Current air quality variables
  - `hourly`: Hourly air quality data

### Geocoding - Open-Meteo
- **Base URL:** `https://geocoding-api.open-meteo.com/v1/search`
- **Features:**
  - City name to coordinates conversion
  - Location search suggestions
  - Multiple language support
- **Parameters:**
  - `name`: Location search query
  - `count`: Number of results
  - `language`: Response language
  - `format`: Response format (json)

## Performance Considerations

- **Caching:** Weather data is cached for 10 minutes, with a limit of 50 entries.
- **Debouncing:** User input in the search bar is debounced (500ms) to minimize API calls.
- **Request Cancellation:** Search suggestions automatically cancel previous requests when typing rapidly.
- **Throttling:** Weather API calls are throttled (1 second) to prevent excessive requests.
- **Retry Logic:** Failed requests are automatically retried up to 3 times for server errors.
- **Compressed Storage:** Cache entries are compressed using LZ-string for memory efficiency.

## Validation and Error Handling

- Input validation to ensure city name input is not empty and coordinates are valid.
- Meaningful error messages displayed for various scenarios (network errors, location not found, etc.).
- API calls have retry mechanisms for server-related errors (500+ status codes).
- Graceful degradation when air quality data is unavailable.
- Fallback to coordinates display when location name cannot be determined.

## Why Open-Meteo?

- **Completely Free:** No API key registration or credit card required
- **High Quality Data:** Uses multiple national weather services (ECMWF, NOAA, Météo-France)
- **Open Source:** Transparent and community-driven weather API
- **Reliable:** No rate limits or usage restrictions for non-commercial use
- **Comprehensive:** Weather, air quality, and geocoding all in one ecosystem
- **Privacy Friendly:** No tracking or data collection

## Future Enhancements

- Weather alerts and severe condition notifications
- Offline support with cached data persistence
- Interactive map integration for visual location selection
- Historical weather data analysis
- Weather data export functionality

## Contributing

Feel free to fork the repository and submit pull requests with your contributions.
