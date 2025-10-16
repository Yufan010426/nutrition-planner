import { defineStore } from 'pinia'
import { auth } from '@/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail, // 如果你有“忘记密码”
} from 'firebase/auth'

// 生产域（或环境变量里覆写）
const ORIGIN =
  import.meta.env.VITE_PUBLIC_ORIGIN || 'https://nutrition-planner.pages.dev'

// 用于邮件动作的 continue URL
const actionCodeSettings = {
  url: `${ORIGIN}/fire-login`,   // 验证/重置后回到登录页
  handleCodeInApp: true,
}

function toUser(u) {
  if (!u) return null
  return {
    id: u.uid,
    email: u.email,
    name: u.displayName || (u.email ? u.email.split('@')[0] : 'user'),
    emailVerified: !!u.emailVerified,
    photoURL: u.photoURL || '',
  }
}

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false,
    _unsub: null,
  }),
  actions: {
    bootstrap() {
      if (this._unsub) return
      this._unsub = onAuthStateChanged(auth, (u) => {
        this.user = toUser(u)
        this.ready = true
      })
    },

    async login(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
    },

    async logout() {
      await signOut(auth)
    },

    // 注册后不保持登录；发验证邮件；立即登出；让调用方跳到 /fire-login
    async register({ email, password, displayName }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const u = cred.user

      if (displayName) {
        try { await updateProfile(u, { displayName }) } catch {}
      }

      try {
        await sendEmailVerification(u, actionCodeSettings) // ★ 指定生产域
      } catch {}

      await signOut(auth) // 立刻登出
    },

    // 可选：忘记密码入口也要指定生产域
    async forgotPassword(email) {
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
    },
  },
})
