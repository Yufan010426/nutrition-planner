import { defineStore } from 'pinia'
import { auth } from '@/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail, 
} from 'firebase/auth'

const ORIGIN =
  import.meta.env.VITE_PUBLIC_ORIGIN || 'https://nutrition-planner.pages.dev'

const actionCodeSettings = {
  url: `${ORIGIN}/fire-login`,   
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

    async register({ email, password, displayName }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const u = cred.user

      if (displayName) {
        try { await updateProfile(u, { displayName }) } catch {}
      }

      try {
        await sendEmailVerification(u, actionCodeSettings) 
      } catch {}

      await signOut(auth) 
    },

    async forgotPassword(email) {
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
    },
  },
})
