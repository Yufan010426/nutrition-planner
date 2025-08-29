<template>
  <header class="nav">
    <!-- 左侧：汉堡按钮 -->
    <div class="left">
      <button
        class="burger"
        :aria-expanded="open ? 'true' : 'false'"
        aria-label="Open main menu"
        @click="toggle"
        ref="btnRef"
      >
        <span class="line" />
        <span class="line" />
        <span class="line" />
      </button>

      <RouterLink to="/" class="brand">Nutrition</RouterLink>
    </div>

    <!-- 下拉菜单 -->
    <div
      class="menu"
      :class="{ open }"
      ref="menuRef"
      @keydown.esc.prevent="close"
    >
      <RouterLink to="/guide" class="item" @click="close">Guide</RouterLink>
      <RouterLink to="/planner" class="item" @click="close">Planner</RouterLink>
      <RouterLink to="/recipes" class="item" @click="close">Recipes</RouterLink>
    </div>

    <!-- 右侧用户区 -->
    <div class="auth">
      <template v-if="!auth.user">
        <RouterLink to="/login" class="btn-outline">Login</RouterLink>
        <RouterLink to="/register" class="btn">Register</RouterLink>
      </template>

      <template v-else>
        <span class="hi">Hi, {{ auth.user.displayName }}</span>
        <button class="btn-outline" @click="logout">Logout</button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const router = useRouter()

const open = ref(false)
const menuRef = ref(null)
const btnRef = ref(null)

function toggle () {
  open.value = !open.value
}
function close () {
  open.value = false
}
function onClickOutside (e) {
  const m = menuRef.value
  const b = btnRef.value
  if (!m || !b) return
  if (!m.contains(e.target) && !b.contains(e.target)) close()
}
onMounted(() => {
  window.addEventListener('click', onClickOutside)
  router.afterEach(() => close())
})
onBeforeUnmount(() => {
  window.removeEventListener('click', onClickOutside)
})

function logout () {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  backdrop-filter: blur(8px);
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  font-weight: 800;
  font-size: 1.2rem;
  color: #2a2a2a;
  text-decoration: none;
}

/* 汉堡按钮 */
.burger {
  width: 40px;
  height: 34px;
  border: 2px solid #4caf7a;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  gap: 4px;
  padding: 4px 0;
  transition: .2s;
}
.burger:hover { background: #ecf8f1; }
.burger .line {
  width: 18px;
  height: 2px;
  background: #4caf7a;
  border-radius: 2px;
}

/* 下拉菜单 */
.menu {
  position: absolute;
  top: 60px;
  left: 16px;
  transform: scale(.98);
  transform-origin: top left;
  opacity: 0;
  pointer-events: none;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0,0,0,.12);
  padding: 8px;
  transition: .16s ease;
  z-index: 20;
}
.menu.open {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}
.menu .item {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: #2a2a2a;
  text-decoration: none;
  font-weight: 600;
}
.menu .item:hover {
  background: #ecf8f1;
  color: #2f845f;
}

/* 右侧按钮 */
.auth { display: flex; gap: 12px; align-items: center; }
.btn, .btn-outline {
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}
.btn { background: #4caf7a; color: #fff; border: 0; }
.btn:hover { background: #388e5a; }
.btn-outline { background: #fff; color: #4caf7a; border: 2px solid #4caf7a; }
.btn-outline:hover { background: #4caf7a; color: #fff; }

.hi { color: #333; font-weight: 600; }
</style>
