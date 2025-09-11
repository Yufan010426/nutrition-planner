<!-- src/views/FirebaseRegisterView.vue -->
<template>
  <div style="max-width:420px;margin:40px auto;padding:20px;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.08)">
    <h2>Create Account</h2>
    <form @submit.prevent="register">
      <input v-model="email" type="email" placeholder="Email" required style="display:block;width:100%;margin:8px 0;padding:10px;border:1px solid #ddd;border-radius:8px">
      <input v-model="password" type="password" placeholder="Password" required style="display:block;width:100%;margin:8px 0;padding:10px;border:1px solid #ddd;border-radius:8px">
      <button style="width:100%;padding:12px;border:none;border-radius:8px;background:#4caf7a;color:#fff;font-weight:700;cursor:pointer">Register</button>
    </form>
    <p v-if="error" style="color:#c0392b;margin-top:8px">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

async function register () {
  error.value = ''
  try {
    const auth = getAuth()
    await createUserWithEmailAndPassword(auth, email.value, password.value)
    router.push('/firelogin')
  } catch (e) {
    error.value = e?.message || 'Register failed'
  }
}
</script>
