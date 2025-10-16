// src/stores/planner.js
import { defineStore } from 'pinia'

function storageKey(uid) {
  return `planner:${uid || 'guest'}`
}

function emptyTotals() {
  return { kcal: 0, protein: 0, fat: 0, carbs: 0 }
}

export const usePlanner = defineStore('planner', {
  state: () => ({
    // 原始存档（数组，包含单日与整周的多条记录）
    entries: [],
    // 展开的天列表：[{ day, meals, totals }]
    days: [],
    // 汇总一周合计（把 days 全部相加）
    grandTotals: emptyTotals(),
  }),

  actions: {
    /** 读取本地存档并展开为 days */
    load(uid) {
      // 兼容旧 key（如果之前用过 'planner'）
      const raw =
        localStorage.getItem(storageKey(uid)) ||
        localStorage.getItem('planner') ||
        '[]'

      try {
        this.entries = JSON.parse(raw)
      } catch {
        this.entries = []
      }
      this.rebuild()
    },

    /** 清空本地存档 */
    clear(uid) {
      localStorage.removeItem(storageKey(uid))
      this.entries = []
      this.days = []
      this.grandTotals = emptyTotals()
    },

    /** 存入“单日”并刷新（给 Guide.saveDay 用） */
    addDay(uid, dayItem) {
      const key = storageKey(uid)
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      list.unshift(dayItem)
      localStorage.setItem(key, JSON.stringify(list))
      this.load(uid)
    },

    /** 存入“一周”并刷新（给 Guide.saveWeek 用） */
    addWeek(uid, weekItem) {
      const key = storageKey(uid)
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      list.unshift(weekItem)
      localStorage.setItem(key, JSON.stringify(list))
      this.load(uid)
    },

    /** 把 entries 统一展开为 days，并计算 grandTotals */
    rebuild() {
      const d = []

      for (const e of this.entries) {
        if (e.type === 'day') {
          // 展开为一天
          d.push({
            day: e.savedAt?.slice(0, 10) || e.title || 'One Day',
            meals: (e.meals || []).map(m => ({
              type: m.type || 'meal',
              title: m.name || m.title || 'Meal',
              kcal: Number(m.kcal) || 0,
              protein: Number(m.protein) || 0,
              fat: Number(m.fat) || 0,
              carbs: Number(m.carbs) || 0,
            })),
            totals: {
              kcal: Number(e.totals?.kcal) || 0,
              protein: Number(e.totals?.protein) || 0,
              fat: Number(e.totals?.fat) || 0,
              carbs: Number(e.totals?.carbs) || 0,
            },
          })
        } else if (e.type === 'week') {
          // 一周：把每一天都推入 days
          for (const day of e.days || []) {
            d.push({
              day: day.date || 'Day',
              meals: (day.meals || []).map(m => ({
                type: m.type || 'meal',
                title: m.name || m.title || 'Meal',
                kcal: Number(m.kcal) || 0,
                protein: Number(m.protein) || 0,
                fat: Number(m.fat) || 0,
                carbs: Number(m.carbs) || 0,
              })),
              totals: {
                kcal: Number(day.totals?.kcal) || 0,
                protein: Number(day.totals?.protein) || 0,
                fat: Number(day.totals?.fat) || 0,
                carbs: Number(day.totals?.carbs) || 0,
              },
            })
          }
        }
      }

      // 写回 days
      this.days = d

      // 计算 grandTotals
      const g = emptyTotals()
      for (const day of d) {
        g.kcal += day.totals.kcal
        g.protein += day.totals.protein
        g.fat += day.totals.fat
        g.carbs += day.totals.carbs
      }
      // 四舍五入更好看
      this.grandTotals = {
        kcal: Math.round(g.kcal),
        protein: Math.round(g.protein),
        fat: Math.round(g.fat),
        carbs: Math.round(g.carbs),
      }
    },
  },
})
