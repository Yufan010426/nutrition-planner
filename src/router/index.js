import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',              component: () => import('@/views/Home.vue') },
  { path: '/guide',         component: () => import('@/views/Guide.vue') },
  { path: '/planner',       component: () => import('@/views/Planner.vue') },
  { path: '/recipes',       component: () => import('@/views/Recipes.vue') },
  { path: '/map', component: () => import('@/views/Map.vue') }, 
  { path: '/fire-signin',   name: 'fire-signin',   component: () => import('@/views/FirebaseSigninView.vue') },
  { path: '/fire-register', name: 'fire-register', component: () => import('@/views/FirebaseRegisterView.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
