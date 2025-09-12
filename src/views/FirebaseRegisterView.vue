<!-- src/views/FirebaseRegisterView.vue -->
<template>
  <div class="auth-card">
    <h2>Create Account</h2>

    <form class="form" @submit.prevent="onSubmit" novalidate>
      <input
        v-model.trim="email"
        type="email"
        autocomplete="email"
        placeholder="Email"
        required
        @blur="touched.email = true"
      />

      <input
        v-model="password"
        type="password"
        autocomplete="new-password"
        placeholder="Password"
        required
        @blur="touched.password = true"
      />

      <input
        v-model="confirm"
        type="password"
        autocomplete="new-password"
        placeholder="Confirm Password"
        required
        @blur="touched.confirm = true"
      />

      <ul class="hints">
        <li :class="{ ok: rules.len }">At least 8 characters</li>
        <li :class="{ ok: rules.up }">At least 1 uppercase letter (A–Z)</li>
        <li :class="{ ok: rules.num }">At least 1 number (0–9)</li>
        <li :class="{ ok: rules.special }">At least 1 special symbol (!@#$…)</li>
        <li :class="{ ok: rules.match }">Both passwords must match</li>
      </ul>

      <button class="btn" :disabled="submitting || !canSubmit">
        {{ submitting ? 'Creating…' : 'Register' }}
      </button>

      <p v-if="err" class="err">{{ err }}</p>
      <p v-if="ok" class="ok">{{ ok }}</p>
    </form>

    <RouterLink to="/fire-login" class="alt">Already have an account? Sign in</RouterLink>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

// --- form state ---
const email = ref('')
const password = ref('')
const confirm = ref('')
const err = ref('')
const ok = ref('')
const submitting = ref(false)
const touched = ref({ email: false, password: false, confirm: false })

const router = useRouter()

// 简单 email 检查
const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 强密码：≥8 且含 大写/数字/特殊符号
const PWD_RE =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const rules = computed(() => ({
  email: EMAIL_RE.test(email.value),
  len: password.value.length >= 8,
  up: /[A-Z]/.test(password.value),
  num: /\d/.test(password.value),
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password.value),
  match: password.value && confirm.value && password.value === confirm.value
}))

const canSubmit = computed(() =>
  rules.value.email &&
  PWD_RE.test(password.value) &&
  rules.value.match
)

watch([email, password, confirm], () => {
  err.value = ''
  ok.value = ''
})

async function onSubmit () {
  err.value = ''
  ok.value = ''
  if (!canSubmit.value) {
    err.value = 'Please satisfy all password rules and a valid email.'
    return
  }

  submitting.value = true
  try {
    const auth = getAuth()
    await createUserWithEmailAndPassword(auth, email.value, password.value)
    ok.value = '✅ Account created successfully.'
    setTimeout(() => router.push('/fire-login'), 800)
  } catch (e) {
    const map = {
      'auth/email-already-in-use': 'This email has been registered.',
      'auth/invalid-email': 'Invalid email.',
      'auth/weak-password': 'Weak password.',
    }
    err.value = map[e?.code] || (e?.message || 'Register failed.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-card{max-width:380px;margin:40px auto;padding:24px;border-radius:12px;background:#ffffffd9;backdrop-filter: blur(6px);box-shadow:0 8px 30px rgba(0,0,0,.08)}
h2{margin:0 0 14px;text-align:center}
.form{display:flex;flex-direction:column;gap:10px}
input{padding:10px;border:1px solid #dcdcdc;border-radius:8px}
input:focus{outline:none;border-color:#4caf7a;box-shadow:0 0 0 2px #4caf7a33}
.hints{margin:4px 0 0 0;padding-left:18px;color:#666;font-size:.9rem}
.hints li{margin:2px 0;list-style:disc}
.hints li.ok{color:#2f7d56;font-weight:600;list-style:'✓ '}
.btn{padding:12px;border:none;border-radius:8px;background:#4caf7a;color:#fff;font-weight:700;cursor:pointer}
.btn:disabled{opacity:.6;cursor:not-allowed}
.err{margin-top:6px;color:#c0392b}
.ok{margin-top:6px;color:#2f7d56}
.alt{display:block;text-align:center;margin-top:10px;color:#2f7d56}
</style>
