<template>
  <div class="auth-card">
    <h2>Create Account</h2>

    <form @submit.prevent="onSubmit" novalidate>
      <input v-model.trim="email" type="email" placeholder="Email" autocomplete="email" required />
      <input
        v-model="password"
        type="password"
        placeholder="Password (min 6 chars)"
        autocomplete="new-password"
        required
      />
      <input
        v-model="confirm"
        type="password"
        placeholder="Confirm Password"
        autocomplete="new-password"
        required
      />

      <button :disabled="loading" class="btn btn--primary">
        {{ loading ? 'Registering…' : 'Register' }}
      </button>
    </form>

    <div class="actions">
      <RouterLink to="/login" class="btn btn--outline">Back to Login</RouterLink>
    </div>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-if="ok" class="ok">Account created! Redirecting…</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const ok = ref(false)
const loading = ref(false)

const router = useRouter()
const auth = useAuth()
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function onSubmit() {
  error.value = ''
  ok.value = false
  if (!email.value || !password.value || !confirm.value) {
    error.value = 'Please complete all fields.'
    return
  }
  if (!emailRe.test(email.value)) {
    error.value = 'Please enter a valid email.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await auth.register({ email: email.value, password: password.value })
    ok.value = true
    setTimeout(() => router.push('/login'), 800)
  } catch (e) {
    error.value = e?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-card {
  max-width: 420px;
  margin: 40px auto;
  padding: 24px;
  border-radius: 12px;
  background: #ffffffd9;
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  text-align: center;
}
h2 {
  margin: 0 0 16px;
  font-size: 2rem;
}
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
input {
  padding: 12px;
  border: 1px solid #dcdcdc;
  border-radius: 10px;
  font-size: 16px;
  background: #fff;
}
input:focus {
  outline: none;
  border-color: #4caf7a;
  box-shadow: 0 0 0 3px #4caf7a2e;
}
.actions {
  margin-top: 12px;
}

.btn {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
  display: inline-block;
  cursor: pointer;
  box-sizing: border-box;
}
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.btn:hover {
  transform: scale(1.02);
}

.btn--primary {
  background: #4caf7a;
  color: #fff;
  border: 2px solid #4caf7a;
}
.btn--primary:hover {
  background: #3e9a69;
  border-color: #3e9a69;
}

.btn--outline {
  background: #fff;
  color: #4caf7a;
  border: 2px solid #4caf7a;
  max-width: 220px;
  margin: 0 auto;
}
.btn--outline:hover {
  background: #4caf7a;
  color: #fff;
  border-color: #4caf7a;
}

.err {
  margin-top: 10px;
  color: #c0392b;
}
.ok {
  margin-top: 10px;
  color: #2e7d32;
}
</style>
