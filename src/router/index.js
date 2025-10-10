// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Guide from '@/views/Guide.vue'
import Planner from '@/views/Planner.vue'
import Recipes from '@/views/Recipes.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import FirebaseSigninView from '@/views/FirebaseSigninView.vue'
import FirebaseRegisterView from '@/views/FirebaseRegisterView.vue'
import WeatherView from '@/views/WeatherView.vue'   // 👈 新增

const routes = [
  { path: '/', component: Home },
  { path: '/guide', component: Guide },
  { path: '/planner', component: Planner },
  { path: '/recipes', component: Recipes },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/firelogin', name: 'FireLogin', component: FirebaseSigninView },
  { path: '/fire-register', name: 'FireRegister', component: FirebaseRegisterView },
  { path: '/getMealCount', name: 'GetMealCount', component: () => import('@/views/GetMealCountView.vue') },
  { path: '/weather', name: 'Weather', component: WeatherView },          // 👈 新增路由
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
