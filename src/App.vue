<template>
  <NavBar />
  <main class="container">
    <router-view />
  </main>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>

<style>
html, body, #app {
  height: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto;
  background-image: url('/background.png');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  background: transparent;
}

a { color: #111; text-decoration: none; }
.router-link-active { font-weight: 600; }
</style>
