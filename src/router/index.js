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
 { path: '/',              component: () => import('@/views/Home.vue') },

    // 你的其它页面
    { path: '/guide',         component: () => import('@/views/Guide.vue') },
    { path: '/planner',       component: () => import('@/views/Planner.vue') },
    { path: '/recipes',       component: () => import('@/views/Recipes.vue') },
    { path: '/getMealCount',  component: () => import('@/views/GetMealCountView.vue') },
    { path: '/weather',       component: () => import('@/views/WeatherView.vue') },

    // ✅ 登录/注册
    { path: '/fire-signin',   name: 'fire-signin',   component: () => import('@/views/FirebaseSigninView.vue') },
    { path: '/fire-register', name: 'fire-register', component: () => import('@/views/FirebaseRegisterView.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
