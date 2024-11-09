<script setup lang="ts">
import HomeView from './views/HomeView.vue'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
    <HomeView />
  </div>
</template>

<style>
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
}
</style>