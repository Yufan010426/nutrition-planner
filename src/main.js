// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)

import { useAuth } from '@/stores/auth'
const auth = useAuth()
auth.bootstrap()  

router.beforeEach((to, from, next) => {
  if (!to.meta?.requiresAuth) return next()

  if (!auth.ready) {
    const stop = auth.$subscribe(() => {
      if (auth.ready) {
        stop()
        auth.user ? next() : next('/fire-login')
      }
    })
  } else {
    auth.user ? next() : next('/fire-login')
  }
})

router.isReady().then(() => app.mount('#app'))
