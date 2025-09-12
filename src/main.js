// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAuth } from '@/stores/auth'

export function secureLoadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    const nonceMeta = document.querySelector('meta[name="csp-nonce"]')
    const nonce = nonceMeta?.getAttribute('content')
    if (nonce) el.setAttribute('nonce', nonce)
    el.async = true
    el.src = src
    el.onload = resolve
    el.onerror = reject
    document.head.appendChild(el)
  })
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

useAuth().bootstrap()

app.mount('#app')
