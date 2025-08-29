
import { defineStore } from 'pinia'

const LS_USERS   = 'np_users' 
const LS_SESSION = 'np_session'

function loadLocalUsers () {
  try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]') } catch { return [] }
}
function saveLocalUsers (list) {
  localStorage.setItem(LS_USERS, JSON.stringify(list))
}

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
  }),

  actions: {
    bootstrap () {
      try {
        const raw = localStorage.getItem(LS_SESSION)
        if (raw) this.user = JSON.parse(raw)
      } catch { /* ignore */ }
    },

    async login ({ email, password }) {
      const mail = String(email).trim().toLowerCase()
      const pass = String(password)

      let users = loadLocalUsers()
      let u = users.find(x => x.email?.toLowerCase() === mail)

      if (!u) {
        const res = await fetch('/users.json', { cache: 'no-store' })
        if (res.ok) {
          const arr = await res.json()
          users = [...arr, ...users]
          u = users.find(x => x.email?.toLowerCase() === mail)
        }
      }

      if (!u || u.password !== pass) {
        throw new Error('Invalid email or password.')
      }

      this.user = {
        id: u.id,
        email: u.email,
        role: u.role || 'user',
        displayName: u.displayName || u.email.split('@')[0],
      }
      localStorage.setItem(LS_SESSION, JSON.stringify(this.user))
      return this.user
    },

    async register ({ email, password }) {
      const mail = String(email).trim().toLowerCase()
      const pass = String(password)

      const users = loadLocalUsers()
      if (users.some(x => x.email?.toLowerCase() === mail)) {
        throw new Error('This email has been registered.')
      }

      const newUser = {
        id: 'u_' + Date.now(),
        email: mail,
        password: pass,          
        role: 'user',
        displayName: mail.split('@')[0],
      }
      users.push(newUser)
      saveLocalUsers(users)

      await this.login({ email: mail, password: pass })
    },

    logout () {
      this.user = null
      localStorage.removeItem(LS_SESSION)
    },

    _wipeLocalUsers () {
      localStorage.removeItem(LS_USERS)
    },
    _wipeSession () {
      localStorage.removeItem(LS_SESSION)
      this.user = null
    },
  },
})
