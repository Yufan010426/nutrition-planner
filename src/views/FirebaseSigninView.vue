<!-- src/views/FirebaseSigninView.vue -->
<template>
  <div class="auth-card">
    <h2>Sign in</h2>

    <form @submit.prevent="signin" novalidate>
      <input v-model.trim="email" type="email" placeholder="Email" autocomplete="email" required />
      <input v-model="password" type="password" placeholder="Password" autocomplete="current-password" required />
      <button :disabled="loading" class="btn btn--primary">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <div class="or">or</div>

    <button class="google-btn" @click="onGoogle" :disabled="loading" aria-label="Sign in with Google">
      <svg class="g-logo" viewBox="0 0 533.5 544.3" aria-hidden="true">
        <path fill="#4285F4" d="M533.5 278.4c0-18.8-1.5-37-4.5-54.6H272.1v103.3h146.9c-6.3 34.1-25.1 62.9-53.5 82.3v68.3h86.4c50.5-46.5 81.6-115 81.6-199.3z"/>
        <path fill="#34A853" d="M272.1 544.3c73.9 0 135.9-24.5 181.2-66.5l-86.4-68.3c-24 16.1-54.8 25.7-94.8 25.7-72.8 0-134.5-49.2-156.6-115.3H26.5v72.5c45 89.3 137.2 151.9 245.6 151.9z"/>
        <path fill="#FBBC05" d="M115.5 319.9c-10.7-31.8-10.7-66.2 0-98l.1-.3V149.1H26.5c-43.1 85.8-43.1 188.3 0 274.1l89-68.6z"/>
        <path fill="#EA4335" d="M272.1 107.5c39.9-.6 78.1 14.4 107.3 41.9l80.1-80.1C407.8 25 344.7 0 272.1 0 163.7 0 71.5 62.6 26.5 151.9l89 72.5c22.1-66.1 83.8-116.3 156.6-116.9z"/>
      </svg>
      <span>Sign in with Google</span>
    </button>

    <p v-if="error" class="err">{{ error }}</p>
    <p class="alt">
      Do not have account?
      <RouterLink to="/fire-register" class="alt-link"> Let's go resgesiter!</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()

async function signin () {
  error.value = ''
  loading.value = true
  try {
    const { user } = await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e?.message || 'Sign in failed'
  } finally {
    loading.value = false
  }
}

async function onGoogle () {
  error.value = ''
  loading.value = true
  try {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    router.push('/')
  } catch (e) {
    error.value = e?.message || 'Google sign-in failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-card{max-width:420px;margin:40px auto;padding:24px;border-radius:12px;background:#ffffffd9;backdrop-filter: blur(6px);box-shadow:0 8px 30px rgba(0,0,0,.08);text-align:center}
h2{margin:0 0 16px}
form{display:flex;flex-direction:column;gap:12px}
input{padding:12px;border:1px solid #dcdcdc;border-radius:10px;font-size:16px;background:#fff}
input:focus{outline:none;border-color:#4caf7a;box-shadow:0 0 0 3px #4caf7a2e}
.btn{width:100%;padding:12px 14px;border-radius:10px;font-weight:700;font-size:16px;transition:.15s;cursor:pointer;border:2px solid transparent}
.btn--primary{background:#4caf7a;color:#fff;border-color:#4caf7a}
.btn--primary:hover{transform:scale(1.02);background:#3e9a69;border-color:#3e9a69}
.or{margin:10px 0;color:#888;position:relative}
.or::before,.or::after{content:"";height:1px;background:#e6e6e6;position:absolute;top:50%;width:40%}
.or::before{left:0}.or::after{right:0}

.google-btn{
  margin-top:4px;width:100%;padding:11px 14px;border-radius:10px;background:#fff;border:1px solid #e6e6e6;
  display:flex;gap:10px;align-items:center;justify-content:center;font-weight:700;cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,.06);
}
.google-btn:hover{transform:scale(1.02)}
.g-logo{width:18px;height:18px;display:block}

.err{margin-top:10px;color:#c0392b}

.alt{margin-top:12px;color:#666}
.alt-link{color:#2f7d56;font-weight:700;text-decoration:underline}
.alt-link:hover{opacity:.85}
</style>
