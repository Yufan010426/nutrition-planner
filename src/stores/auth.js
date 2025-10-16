// src/stores/auth.js
import { defineStore } from 'pinia'
import { auth } from '@/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth'

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
    // 只订阅一次
    bootstrap() {
      if (this._unsub) return
      this._unsub = onAuthStateChanged(auth, (u) => {
        this.user = toUser(u)
        this.ready = true
      })
    },

    async login(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged 会同步 this.user
    },

    async logout() {
      await signOut(auth)
      // onAuthStateChanged 会同步 this.user = null
    },

    /**
     * 注册后不自动保持登录状态：
     * 1) 创建账户
     * 2) 可选：设置昵称 + 发送验证邮件
     * 3) 立刻 signOut
     * 4) 由调用方去跳转到登录页
     */
    async register({ email, password, displayName }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const u = cred.user
      if (displayName) {
        try { await updateProfile(u, { displayName }) } catch {}
      }
      try { await sendEmailVerification(u) } catch {}
      // 关键：注册后立刻登出，避免“未登录也显示 Hi”
      await signOut(auth)
    },
  },
})
