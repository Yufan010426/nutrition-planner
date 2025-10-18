<!-- src/components/NavBar.vue -->
<template>
  <a class="skip" href="#main">Skip to content</a>

  <header class="nav" role="banner">
    <div class="left">
      <button
        id="menu-button"
        class="burger"
        :aria-expanded="open ? 'true' : 'false'"
        aria-controls="main-menu"
        aria-label="Open main menu"
        type="button"
        @click="toggleMenu"
        @keydown.esc.prevent="closeMenuAndFocus()"
      >
        <span class="line" /><span class="line" /><span class="line" />
      </button>

      <RouterLink to="/" class="brand">Nutrition</RouterLink>
    </div>
    <nav class="menu" role="navigation" aria-label="Primary" :class="{ open }">
      <ul id="main-menu" role="menu" @click="closeMenu" @keydown.esc.prevent="closeMenuAndFocus()">
        <li role="none"><RouterLink role="menuitem" tabindex="0" to="/guide"   class="item">Guide</RouterLink></li>
        <li role="none"><RouterLink role="menuitem" tabindex="0" to="/planner" class="item">Planner</RouterLink></li>
        <li role="none"><RouterLink role="menuitem" tabindex="0" to="/recipes" class="item">Recipes</RouterLink></li>
        <li role="none"><RouterLink role="menuitem" tabindex="0" to="/Map"     class="item">Map</RouterLink></li>
      </ul>
    </nav>

    <div class="auth">
      <template v-if="auth.ready && !auth.user">
        <RouterLink to="/fire-signin" class="btn-outline">Login</RouterLink>
        <RouterLink to="/fire-register" class="btn">Register</RouterLink>
      </template>

      <template v-else-if="auth.ready && auth.user">
        <span class="hi">
          Hi, {{ displayName }}
          <span v-if="role" class="role" :data-role="role">{{ role }}</span>
        </span>
        <button class="btn-outline" type="button" @click="auth.logout()">Logout</button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const open = ref(false)
const toggleMenu = () => (open.value = !open.value)
const closeMenu = () => (open.value = false)
const closeMenuAndFocus = () => {
  open.value = false
  document.getElementById('menu-button')?.focus()
}

const displayName = computed(() =>
  auth.user?.name ?? auth.user?.email?.split('@')[0] ?? 'user'
)
const role = computed(() => auth.user?.role ?? 'user')
</script>

<style scoped>
.skip{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden}
.skip:focus{left:12px;top:8px;z-index:999;background:#fff;padding:8px 10px;border:2px solid #111;border-radius:6px}

:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}

.nav{
  height:60px;display:flex;align-items:center;justify-content:space-between;
  gap:16px;padding:0 24px;backdrop-filter:blur(8px)
}
.left{display:flex;align-items:center;gap:12px}
.brand{font-weight:800;font-size:1.2rem;color:#2a2a2a;text-decoration:none}

.burger{
  width:40px;height:34px;border:2px solid #2f7d56;background:#fff;border-radius:8px;
  cursor:pointer;display:grid;place-items:center;gap:4px;padding:4px 0
}
.burger .line{width:18px;height:2px;background:#2f7d56;border-radius:2px}

.menu{
  position:absolute;top:60px;left:16px;opacity:0;pointer-events:none;min-width:200px;
  background:#fff;border:1px solid #e6e6e6;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.12);
  padding:8px;transition:.16s
}
.menu.open{opacity:1;pointer-events:auto}
.menu ul{list-style:none;margin:0;padding:0}
.menu .item{
  display:block;padding:10px 12px;border-radius:8px;color:#2a2a2a;text-decoration:none;font-weight:600
}
.menu .item:hover,.menu .item:focus{background:#ecf8f1;color:#2f845f}

.auth{display:flex;gap:12px;align-items:center}
.btn,.btn-outline{padding:6px 14px;border-radius:8px;font-weight:600;cursor:pointer;text-decoration:none}
.btn{background:#1f6d4d;color:#fff;border:0} 
.btn:hover{background:#16583e}
.btn-outline{background:#fff;color:#1f6d4d;border:2px solid #1f6d4d}
.btn-outline:hover{background:#1f6d4d;color:#fff}

.hi{color:#333;font-weight:600}
.role{
  margin-left:8px;padding:2px 8px;border-radius:999px;font-size:.75rem;text-transform:uppercase;
  background:#eef6f2;color:#2f7d56;border:1px solid #c9e6d6
}
.role[data-role="admin"]{background:#fff3f3;color:#c62828;border-color:#f0b3b3}
</style>
