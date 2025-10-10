<!-- src/components/NavBar.vue -->
<template>
  <header class="nav">
    <div class="left">
      <button
        class="burger"
        :aria-expanded="open ? 'true' : 'false'"
        aria-label="Open main menu"
        @click="open = !open"
      >
        <span class="line" /><span class="line" /><span class="line" />
      </button>

      <RouterLink to="/" class="brand">Nutrition</RouterLink>
    </div>

    <div class="menu" :class="{ open }" @click="open = false">
      <RouterLink to="/guide" class="item">Guide</RouterLink>
      <RouterLink to="/planner" class="item">Planner</RouterLink>
      <RouterLink to="/recipes" class="item">Recipes</RouterLink>
      <RouterLink to="/getMealCount" class="item">Meal Count</RouterLink>
      <RouterLink to="/weather" class="item">Weather</RouterLink>
      

    </div>

    <div class="auth">
      <template v-if="!auth.user">
        <RouterLink to="/firelogin" class="btn-outline">Login</RouterLink>
        <RouterLink to="/fire-register" class="btn">Register</RouterLink>
      </template>

      <template v-else>
        <span class="hi">
          Hi, {{ auth.user.displayName }}
          <span class="role" :data-role="auth.user.role">{{ auth.user.role }}</span>
        </span>
        <button class="btn-outline" @click="auth.logout()">Logout</button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "@/stores/auth";

const auth = useAuth();
const open = ref(false);
</script>

<style scoped>
.nav{
  height:60px;display:flex;align-items:center;justify-content:space-between;
  gap:16px;padding:0 24px;backdrop-filter:blur(8px)
}
.left{display:flex;align-items:center;gap:12px}
.brand{font-weight:800;font-size:1.2rem;color:#2a2a2a;text-decoration:none}

.burger{
  width:40px;height:34px;border:2px solid #4caf7a;background:#fff;border-radius:8px;
  cursor:pointer;display:grid;place-items:center;gap:4px;padding:4px 0
}
.burger .line{width:18px;height:2px;background:#4caf7a;border-radius:2px}

.menu{
  position:absolute;top:60px;left:16px;opacity:0;pointer-events:none;min-width:180px;
  background:#fff;border:1px solid #e6e6e6;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.12);
  padding:8px;transition:.16s
}
.menu.open{opacity:1;pointer-events:auto}
.menu .item{
  display:block;padding:10px 12px;border-radius:8px;color:#2a2a2a;text-decoration:none;font-weight:600
}
.menu .item:hover{background:#ecf8f1;color:#2f845f}

.auth{display:flex;gap:12px;align-items:center}
.btn,.btn-outline{padding:6px 14px;border-radius:8px;font-weight:600;cursor:pointer;text-decoration:none}
.btn{background:#4caf7a;color:#fff;border:0}
.btn:hover{background:#388e5a}
.btn-outline{background:#fff;color:#4caf7a;border:2px solid #4caf7a}
.btn-outline:hover{background:#4caf7a;color:#fff}

.hi{color:#333;font-weight:600}
.role{
  margin-left:8px;padding:2px 8px;border-radius:999px;font-size:.75rem;text-transform:uppercase;
  background:#eef6f2;color:#2f7d56;border:1px solid #c9e6d6
}
.role[data-role="admin"]{background:#fff3f3;color:#c62828;border-color:#f0b3b3}
</style>
