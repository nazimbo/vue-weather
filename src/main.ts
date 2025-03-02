import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useWeatherStore } from './stores/weatherStore';
import App from './App.vue';
import './style.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Initialize the weather store
const weatherStore = useWeatherStore();
weatherStore.initialize();

app.mount('#app');
