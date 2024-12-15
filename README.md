# Vue.js Weather Application

This is a real-time weather application built with Vue.js 3, TypeScript, and Tailwind CSS. It fetches weather data from the OpenWeatherMap API, providing current conditions, forecasts, and user-friendly features.

## Features

- **Real-Time Weather Data:**
    - Current weather conditions: temperature, humidity, wind speed, UV index, air quality.
    - 5-day forecast with daily summaries.
    - Hourly forecast for the next 24 hours.
- **Search Functionality:**
    - Search weather by city name.
    - Fetch weather data for the user's current location using geolocation.
- **Favorites Management:**
    - Save, view, and remove favorite locations.
    - Persist favorite locations using localStorage.
- **Units Preference:**
    - Switch between metric (Celsius, m/s) and imperial (Fahrenheit, mph) units.
    - Changes persist across sessions.
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
- **Backend Services:**
    - Weather API: OpenWeatherMap
- **Development Tools:**
    - Build Tool: Vite
    - Programming Language: TypeScript

## Setup and Usage

1.  **Clone the repository:**

    ```bash
    git clone [YOUR_REPOSITORY_URL]
    cd [YOUR_PROJECT_DIRECTORY]
    ```
2.  **Install dependencies:**

    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    - Create a `.env` file in the root of your project.
    - Add your OpenWeatherMap API key, OpenCage API key and base URL.
     - Example:
        ```
          VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key
          VITE_OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
          VITE_OPENCAGE_API_KEY=your_opencage_api_key
        ```
    - Get your API key here: [OpenWeatherMap](https://openweathermap.org/api) and  [OpenCage](https://opencagedata.com/).
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

- **Base URL:** `https://api.openweathermap.org/data/2.5`
- **Endpoints:**
    - Current weather: `/weather`
    - 5-day forecast: `/forecast`
    - Air pollution: `/air_pollution`
    - UV index: `/uvi`
- **Parameters:**
    - `q`: City name
    - `lat, lon`: Coordinates
    - `units`: Metric or imperial
    - `appid`: API key

## Performance Considerations

- **Caching:** Weather data is cached for 10 minutes, with a limit of 50 entries.
- **Debouncing:** User input in the search bar is debounced to minimize API calls.
- **Lazy Loading:** Non-critical components are lazy-loaded for faster initial load times.

## Validation and Error Handling

- Input validation to ensure city name input is not empty and coordinates are valid.
- Meaningful error messages displayed for various scenarios.
- API calls have retry mechanisms for server-related errors.

## Future Enhancements

- Weather alerts for severe conditions.
- Offline support for cached data.
- Interactive map integration for visual location selection.

## Contributing

Feel free to fork the repository and submit pull requests with your contributions.
