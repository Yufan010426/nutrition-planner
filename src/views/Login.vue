<template>
  <div class="auth-card">
    <h2>Sign in</h2>

    <form @submit.prevent="onSubmit" novalidate>
      <input v-model.trim="email" type="email" placeholder="Email" autocomplete="email" required />
      <input v-model="password" type="password" placeholder="Password" autocomplete="current-password" required />

      <!-- 统一按钮样式：主按钮 -->
      <button :disabled="loading" class="btn btn--primary">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <div class="actions">
      <!-- 统一按钮样式：描边按钮 -->
      <RouterLink to="/register" class="btn btn--outline">Create Account</RouterLink>
    </div>

    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()
const auth = useAuth()

async function onSubmit () {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password.'
    return
  }
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    router.push('/')
  } catch (e) {
    error.value = e?.message || 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-card{
  max-width:420px;margin:40px auto;padding:24px;border-radius:12px;
  background:#ffffffd9;backdrop-filter:blur(6px);
  box-shadow:0 8px 30px rgba(0,0,0,.08);text-align:center
}
h2{margin:0 0 16px;font-size:2rem}
form{display:flex;flex-direction:column;gap:12px}
input{
  padding:12px;border:1px solid #dcdcdc;border-radius:10px;font-size:16px;background:#fff
}
input:focus{outline:none;border-color:#4caf7a;box-shadow:0 0 0 3px #4caf7a2e}
.actions{margin-top:12px}

/* 统一按钮体系 */
.btn{
  width:100%; padding:12px 14px; border-radius:10px;
  font-weight:700; font-size:16px; text-align:center; text-decoration:none;
  transition:transform .15s ease, background-color .15s ease, color .15s ease, border-color .15s ease;
  display:inline-block; cursor:pointer; box-sizing:border-box
}
.btn:disabled{opacity:.65;cursor:not-allowed}
.btn:hover{transform:scale(1.02)}

.btn--primary{background:#4caf7a;color:#fff;border:2px solid #4caf7a}
.btn--primary:hover{background:#3e9a69;border-color:#3e9a69}

.btn--outline{background:#fff;color:#4caf7a;border:2px solid #4caf7a;max-width:220px;margin:0 auto}
.btn--outline:hover{background:#4caf7a;color:#fff;border-color:#4caf7a}

.err{margin-top:10px;color:#c0392b}
</style>
