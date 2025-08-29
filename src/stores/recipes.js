import { defineStore } from 'pinia'

const LS_KEY = 'np_receipts_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}
function save(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function summarizeDays(daysObj) {
  let kcal=0, protein=0, fat=0, carbs=0
  const days = {}
  for (const day of Object.keys(daysObj)) {
    const meals = daysObj[day] || []
    const total = meals.reduce((acc, m) => {
      acc.kcal += m.kcal || 0
      acc.protein += m.protein || 0
      acc.fat += m.fat || 0
      acc.carbs += m.carbs || 0
      return acc
    }, {kcal:0, protein:0, fat:0, carbs:0})
    days[day] = { meals, total }
    kcal+=total.kcal; protein+=total.protein; fat+=total.fat; carbs+=total.carbs
  }
  return { days, total:{kcal,protein,fat,carbs} }
}

export const useReceiptsStore = defineStore('receipts', {
  state: () => ({
    list: load(), // [{id, createdAt, name, snapshot:{days,total}}...]
  }),
  actions: {
    saveFromPlanner(plannerDays, name = '') {
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      const snapshot = summarizeDays(plannerDays)
      const item = { id, name: name || `Week plan ${createdAt.slice(0,10)}`, createdAt, snapshot }
      this.list.unshift(item)
      save(this.list)
      return id
    },
    remove(id) {
      this.list = this.list.filter(x => x.id !== id)
      save(this.list)
    },
    clear() {
      this.list = []
      save(this.list)
    }
  }
})
