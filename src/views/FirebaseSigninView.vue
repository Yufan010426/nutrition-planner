<template>
  <div class="auth-card">
    <h2>Sign in (Firebase)</h2>

    <form @submit.prevent="signin">
      <input v-model.trim="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>
    </form>

    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase' // ← 用我们初始化好的 auth

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()

async function signin () {
  error.value = ''
  loading.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    // 登录成功：跳回首页（你也可以跳 Planner）
    router.push('/')
  } catch (e) {
    error.value = e.message || 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-card{max-width:360px;margin:40px auto;padding:24px;border-radius:12px;background:#ffffffd9;backdrop-filter: blur(6px);box-shadow:0 8px 30px rgba(0,0,0,.08)}
h2{margin:0 0 16px}
form{display:flex;flex-direction:column;gap:10px}
input{padding:10px;border:1px solid #dcdcdc;border-radius:8px}
button{padding:12px;border:none;border-radius:8px;background:#4caf7a;color:#fff;font-weight:600;cursor:pointer}
button:disabled{opacity:.6;cursor:not-allowed}
.err{margin-top:8px;color:#c0392b}
</style>
