// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAuth } from '@/stores/auth'

console.log('ENV =', import.meta.env)
console.log('API_BASE =', import.meta.env.VITE_API_BASE)

const app = createApp(App)
app.use(createPinia())
app.use(router)

const authStore = useAuth()
authStore.bootstrap().finally(() => {
  app.mount('#app')
})
