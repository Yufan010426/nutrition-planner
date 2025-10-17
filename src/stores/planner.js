// src/stores/planner.js
import { defineStore } from 'pinia'


function storageKey(uid) {
  return `planner:${uid || 'guest'}`
}

function readStore(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid))
    return raw ? JSON.parse(raw) : { days: [] }
  } catch {
    return { days: [] }
  }
}

function writeStore(uid, data) {
  localStorage.setItem(storageKey(uid), JSON.stringify(data))
}

function ensureId() {
  return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2)
}

/** 简单去重：防止同一个保存动作被重复点击
 * 规则：同一天(date) + 同样 totals.kcal + 同样三大营养合计 即视为重复
 */
function isSameDay(a, b) {
  if (!a || !b) return false
  if (a.date !== b.date) return false
  return (
    (a.totals?.kcal ?? 0) === (b.totals?.kcal ?? 0) &&
    (a.totals?.protein ?? 0) === (b.totals?.protein ?? 0) &&
    (a.totals?.fat ?? 0) === (b.totals?.fat ?? 0) &&
    (a.totals?.carbs ?? 0) === (b.totals?.carbs ?? 0)
  )
}

export const usePlanner = defineStore('planner', {
  state: () => ({
    days: [],          // <== 供 Planner.vue 使用的扁平数组
    _uid: 'guest',
  }),

  actions: {
    /** 读取本地（或将来可换成 Firestore） */
    load(uid) {
      this._uid = uid || 'guest'
      const data = readStore(this._uid)
      // 累计模式：直接拿历史 days
      this.days = Array.isArray(data.days) ? data.days : []
      // 排序：按日期 + 保存时间
      this.days.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.savedAt || '').localeCompare(b.savedAt || ''))
    },

    /** 覆盖写入当前内存 days 到存储 */
    _persist() {
      writeStore(this._uid, { days: this.days })
    },

    /** 追加【一天】到列表（累计，不覆盖） */
    addDay(uid, dayItem, meta = {}) {
      if (uid && uid !== this._uid) this.load(uid)

      const rec = {
        id: ensureId(),
        date: dayItem.date || new Date().toISOString().slice(0, 10),
        meals: dayItem.meals || [],
        totals: dayItem.totals || { kcal: 0, protein: 0, fat: 0, carbs: 0 },
        savedAt: dayItem.savedAt || new Date().toISOString(),
        meta: meta || {},
      }

      // 去重保护：最近一次相同记录不再重复插入
      const last = this.days[this.days.length - 1]
      if (!isSameDay(last, rec)) {
        this.days.push(rec)
        this._persist()
      }
    },

    /** 追加【一周】到列表（把 weekItem.days 扁平追加） */
    addWeek(uid, weekItem, meta = {}) {
      if (uid && uid !== this._uid) this.load(uid)

      const list = (weekItem.days || []).map(d => ({
        id: ensureId(),
        date: d.date || new Date().toISOString().slice(0, 10),
        meals: d.meals || [],
        totals: d.totals || { kcal: 0, protein: 0, fat: 0, carbs: 0 },
        savedAt: new Date().toISOString(),
        meta: meta || {},
      }))

      // 逐条加入（带去重）
      for (const rec of list) {
        const last = this.days[this.days.length - 1]
        if (!isSameDay(last, rec)) this.days.push(rec)
      }
      this._persist()
    },

    /** 清空当前 uid 的全部计划 */
    clear(uid) {
      if (uid && uid !== this._uid) this.load(uid)
      this.days = []
      this._persist()
    },
  },
})
