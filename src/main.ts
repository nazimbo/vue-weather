import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useWeatherStore } from './stores/weatherStore';
import App from './App.vue';
import './style.css';
import { onBeforeUnmount } from 'vue';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Initialize the weather store
const weatherStore = useWeatherStore();
weatherStore.initialize();

onBeforeUnmount(() => {
  weatherStore.cleanup();
});

app.mount('#app');
