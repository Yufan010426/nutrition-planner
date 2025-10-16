import { defineStore } from 'pinia'
import { auth } from '@/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'

export const useAuth = defineStore('auth', {
  state: () => ({ user: null, loading: false, error: '' }),
  actions: {
    init() {
      onAuthStateChanged(auth, (u) => {
        this.user = u ? { id: u.uid, email: u.email, displayName: u.displayName || '' } : null
      })
    },
    async login(email, password) {
      this.loading = true
      this.error = ''
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        this.user = { id: user.uid, email: user.email, displayName: user.displayName || '' }
      } finally {
        this.loading = false
      }
    },
    async logout() {
      await signOut(auth)
      this.user = null
    },
  },
})
