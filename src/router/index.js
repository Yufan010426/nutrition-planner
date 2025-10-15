// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Guide from '@/views/Guide.vue'
import Planner from '@/views/Planner.vue'
import Recipes from '@/views/Recipes.vue'
import FirebaseSigninView from '@/views/FirebaseSigninView.vue'
import FirebaseRegisterView from '@/views/FirebaseRegisterView.vue'
import WeatherView from '@/views/WeatherView.vue'
import GetMealCountView from '@/views/GetMealCountView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/guide', component: Guide },
  { path: '/planner', component: Planner },
  { path: '/recipes', component: Recipes },
  { path: '/fire-login', name: 'FireLogin', component: FirebaseSigninView },
  { path: '/fire-register', name: 'FireRegister', component: FirebaseRegisterView },
  { path: '/firelogin', redirect: '/fire-login' },
  { path: '/fireregister', redirect: '/fire-register' },
  { path: '/login', redirect: '/fire-login' },
  { path: '/register', redirect: '/fire-register' },
  { path: '/weather', name: 'Weather', component: WeatherView },
  { path: '/getMealCount', name: 'GetMealCount', component: GetMealCountView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
