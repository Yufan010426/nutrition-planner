
import { defineStore } from 'pinia'

const keyFor = (uid) => `np_weekplan_${uid || 'guest'}`

export const usePlanner = defineStore('planner', {
  state: () => ({
    week: [],       
    generatedAt: null,
  }),

  getters: {
    days(state) { return state.week || [] },
    grandTotals(state) {
      return state.days.reduce((acc, d) => {
        acc.kcal    += d.totals.kcal
        acc.protein += d.totals.protein
        acc.fat     += d.totals.fat
        acc.carbs   += d.totals.carbs
        return acc
      }, { kcal:0, protein:0, fat:0, carbs:0 })
    }
  },

  actions: {
    load(userId) {
      try {
        const raw = localStorage.getItem(keyFor(userId))
        if (raw) {
          const { week, generatedAt } = JSON.parse(raw)
          this.week = week || []
          this.generatedAt = generatedAt || null
        }
      } catch {}
    },
    save(userId) {
      localStorage.setItem(
        keyFor(userId),
        JSON.stringify({ week: this.week, generatedAt: this.generatedAt || Date.now() })
      )
    },
    clear(userId) {
      this.week = []
      this.generatedAt = null
      localStorage.removeItem(keyFor(userId))
    },

    addWeekFromRecommendation(reco, userId) {
      if (!reco || !reco.meals?.length) return

      const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

      const pickDay = (i) => {
        const base = [...reco.meals]
        if (i % 2 === 1) base.reverse()
        if (i % 3 === 1) base.push(base.shift())

        const totals = base.reduce((acc, m) => {
          acc.kcal    += Math.round(m.kcal    || 0)
          acc.protein += Math.round(m.protein || 0)
          acc.fat     += Math.round(m.fat     || 0)
          acc.carbs   += Math.round(m.carbs   || 0)
          return acc
        }, { kcal:0, protein:0, fat:0, carbs:0 })

        return { day: DAY_NAMES[i], meals: base, totals }
      }

      this.week = Array.from({ length: 7 }, (_, i) => pickDay(i))
      this.generatedAt = Date.now()
      this.save(userId)
    },
  }
})
