import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Guide from '@/views/Guide.vue'
import Planner from '@/views/Planner.vue'
import Recipes from '@/views/Recipes.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

// 新增的两个页面
import FirebaseSigninView from '@/views/FirebaseSigninView.vue'
import FirebaseRegisterView from '@/views/FirebaseRegisterView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/guide', component: Guide },
    { path: '/planner', component: Planner },
    { path: '/recipes', component: Recipes },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/firelogin', name: 'FireLogin', component: FirebaseSigninView },
    { path: '/fire-register', name: 'FireRegister', component: FirebaseRegisterView },
  ],
})

export default router
