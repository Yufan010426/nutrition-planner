// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuth } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia).use(router)

// ✅ 调用 init，而不是 bootstrap
useAuth().init()

app.mount('#app')
