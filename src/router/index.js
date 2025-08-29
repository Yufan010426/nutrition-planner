import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Guide from '@/views/Guide.vue'
import Planner from '@/views/Planner.vue'
import Recipes from '@/views/Recipes.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/guide', component: Guide },
    { path: '/planner', component: Planner },
    { path: '/recipes', component: Recipes },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
  ],
})

export default router
