<!-- src/views/Planner.vue -->
<template>
  <section class="planner">
    <div class="head">
      <h2>Your Weekly Planner</h2>
      <div class="ops">
        <button class="btn-outline" @click="refresh">Refresh</button>
        <button class="btn-danger" @click="clearPlan">Clear</button>
      </div>
    </div>

    <p v-if="!days.length" class="empty">
      No plan yet. Go to <RouterLink to="/guide">Guide</RouterLink> to generate one.
    </p>

    <template v-else>
      <!-- ============ 表 1：按天汇总 ============ -->
      <div class="table-card">
        <div class="table-title-row">
          <h3 class="table-title">Daily Totals</h3>
          <div class="hi-controls">
            <span class="hint">Highlight &gt; </span>
            <label>kcal <input type="number" v-model.number="dayTable.highlight.kcal" placeholder="-" /></label>
            <label>P <input type="number" v-model.number="dayTable.highlight.protein" placeholder="-" /></label>
            <label>F <input type="number" v-model.number="dayTable.highlight.fat" placeholder="-" /></label>
            <label>C <input type="number" v-model.number="dayTable.highlight.carbs" placeholder="-" /></label>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th @click="toggleSort(dayTable,'date')">Date <SortIcon :state="dayTable" col="date" /></th>
                <th @click="toggleSort(dayTable,'kcal')">kcal <SortIcon :state="dayTable" col="kcal" /></th>
                <th @click="toggleSort(dayTable,'protein')">Protein (g) <SortIcon :state="dayTable" col="protein" /></th>
                <th @click="toggleSort(dayTable,'fat')">Fat (g) <SortIcon :state="dayTable" col="fat" /></th>
                <th @click="toggleSort(dayTable,'carbs')">Carbs (g) <SortIcon :state="dayTable" col="carbs" /></th>
              </tr>
              <!-- 每列筛选：日期区间 + 数值区间 -->
              <tr class="filters">
                <th class="date-range">
                  <input type="date" v-model="dayTable.filters.dateFrom" />
                  <span>—</span>
                  <input type="date" v-model="dayTable.filters.dateTo" />
                </th>
                <th><RangeFilter v-model:min="dayTable.filters.kcalMin" v-model:max="dayTable.filters.kcalMax" /></th>
                <th><RangeFilter v-model:min="dayTable.filters.proteinMin" v-model:max="dayTable.filters.proteinMax" /></th>
                <th><RangeFilter v-model:min="dayTable.filters.fatMin" v-model:max="dayTable.filters.fatMax" /></th>
                <th><RangeFilter v-model:min="dayTable.filters.carbsMin" v-model:max="dayTable.filters.carbsMax" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in dayTable.pageRows" :key="r.date">
                <td>{{ r.date }}</td>
                <td :class="overCls(r.kcal, dayTable.highlight.kcal)">{{ r.kcal }}</td>
                <td :class="overCls(r.protein, dayTable.highlight.protein)">{{ r.protein }}</td>
                <td :class="overCls(r.fat, dayTable.highlight.fat)">{{ r.fat }}</td>
                <td :class="overCls(r.carbs, dayTable.highlight.carbs)">{{ r.carbs }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pager :state="dayTable" />
      </div>

      <!-- ============ 表 2：逐餐明细 ============ -->
      <div class="table-card">
        <div class="table-title-row">
          <h3 class="table-title">Meals (All Days)</h3>
          <div class="hi-controls">
            <span class="hint">Highlight &gt; </span>
            <label>kcal <input type="number" v-model.number="mealTable.highlight.kcal" placeholder="-" /></label>
            <label>P <input type="number" v-model.number="mealTable.highlight.protein" placeholder="-" /></label>
            <label>F <input type="number" v-model.number="mealTable.highlight.fat" placeholder="-" /></label>
            <label>C <input type="number" v-model.number="mealTable.highlight.carbs" placeholder="-" /></label>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th @click="toggleSort(mealTable,'date')">Date <SortIcon :state="mealTable" col="date" /></th>
                <th @click="toggleSort(mealTable,'type')">Type <SortIcon :state="mealTable" col="type" /></th>
                <th @click="toggleSort(mealTable,'name')">Title <SortIcon :state="mealTable" col="name" /></th>
                <th @click="toggleSort(mealTable,'kcal')">kcal <SortIcon :state="mealTable" col="kcal" /></th>
                <th @click="toggleSort(mealTable,'protein')">P (g) <SortIcon :state="mealTable" col="protein" /></th>
                <th @click="toggleSort(mealTable,'fat')">F (g) <SortIcon :state="mealTable" col="fat" /></th>
                <th @click="toggleSort(mealTable,'carbs')">C (g) <SortIcon :state="mealTable" col="carbs" /></th>
              </tr>
              <tr class="filters">
                <th class="date-range">
                  <input type="date" v-model="mealTable.filters.dateFrom" />
                  <span>—</span>
                  <input type="date" v-model="mealTable.filters.dateTo" />
                </th>
                <th>
                  <select v-model="mealTable.filters.type" class="select">
                    <option value="">All</option>
                    <option v-for="t in mealTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                </th>
                <th><input v-model="mealTable.filters.name" placeholder="Search title" /></th>
                <th><RangeFilter v-model:min="mealTable.filters.kcalMin" v-model:max="mealTable.filters.kcalMax" /></th>
                <th><RangeFilter v-model:min="mealTable.filters.proteinMin" v-model:max="mealTable.filters.proteinMax" /></th>
                <th><RangeFilter v-model:min="mealTable.filters.fatMin" v-model:max="mealTable.filters.fatMax" /></th>
                <th><RangeFilter v-model:min="mealTable.filters.carbsMin" v-model:max="mealTable.filters.carbsMax" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in mealTable.pageRows" :key="r.date + r.type + r.name">
                <td>{{ r.date }}</td>
                <td class="cap">{{ r.type }}</td>
                <td class="ellipsis" :title="r.name">{{ r.name }}</td>
                <td :class="overCls(r.kcal, mealTable.highlight.kcal)">{{ r.kcal }}</td>
                <td :class="overCls(r.protein, mealTable.highlight.protein)">{{ r.protein }}</td>
                <td :class="overCls(r.fat, mealTable.highlight.fat)">{{ r.fat }}</td>
                <td :class="overCls(r.carbs, mealTable.highlight.carbs)">{{ r.carbs }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pager :state="mealTable" />
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { usePlanner } from '@/stores/planner'
import { useAuth } from '@/stores/auth'

/* ------------------ 数据源 ------------------ */
const planner = usePlanner()
const auth = useAuth()

function refresh () {
  const uid = auth.user?.uid || auth.user?.id || 'guest'
  planner.load(uid)
}
function clearPlan () {
  const uid = auth.user?.uid || auth.user?.id || 'guest'
  if (confirm('Clear current week?')) planner.clear(uid)
}

const days = computed(() => planner.days || [])

/* days -> 两个表的数据 */
const dayRows = computed(() =>
  days.value.map(d => ({
    date: d.date || d.day || d.weekDate || d.weekStart || '',
    kcal: d.totals?.kcal ?? 0,
    protein: d.totals?.protein ?? 0,
    fat: d.totals?.fat ?? 0,
    carbs: d.totals?.carbs ?? 0,
  }))
)

const mealRows = computed(() => {
  const out = []
  for (const d of days.value) {
    const date = d.date || d.day || d.weekDate || d.weekStart || ''
    for (const m of (d.meals || [])) {
      out.push({
        date,
        type: (m.type || '').toLowerCase(),
        name: m.name || m.title || '',
        kcal: m.kcal ?? 0,
        protein: m.protein ?? 0,
        fat: m.fat ?? 0,
        carbs: m.carbs ?? 0,
      })
    }
  }
  return out
})

const mealTypes = computed(() => {
  const set = new Set(mealRows.value.map(r => r.type).filter(Boolean))
  return Array.from(set).map(s => s.charAt(0).toUpperCase() + s.slice(1))
})

/* ------------------ 轻量表格状态&逻辑（增强：日期区间 + 数值区间 + 高亮） ------------------ */
function makeTableState(defaultSortKey) {
  return reactive({
    rows: [],

    filters: {
      dateFrom: '', dateTo: '',
      type: '', name: '',
      kcalMin: null,  kcalMax: null,
      proteinMin: null, proteinMax: null,
      fatMin: null,     fatMax: null,
      carbsMin: null,   carbsMax: null,
    },

    highlight: { kcal: null, protein: null, fat: null, carbs: null },

    sortKey: defaultSortKey,
    sortDir: 'asc',
    pageSize: 10,
    page: 1,

    get filtered() {
      const f = this.filters

      const inDateRange = (dateStr) => {
        if (!dateStr) return true
        const d = dateStr
        if (f.dateFrom && d < f.dateFrom) return false
        if (f.dateTo && d > f.dateTo) return false
        return true
      }
      const inNumRange = (val, min, max) => {
        if (min != null && val < Number(min)) return false
        if (max != null && val > Number(max)) return false
        return true
      }

      return this.rows.filter(r => {
        if (!inDateRange(r.date)) return false
        if (f.type && r.type && r.type.toLowerCase() !== f.type.toLowerCase()) return false
        if (f.name && !String(r.name ?? '').toLowerCase().includes(f.name.toLowerCase())) return false

        if (!inNumRange(r.kcal,    f.kcalMin,    f.kcalMax)) return false
        if (!inNumRange(r.protein, f.proteinMin, f.proteinMax)) return false
        if (!inNumRange(r.fat,     f.fatMin,     f.fatMax)) return false
        if (!inNumRange(r.carbs,   f.carbsMin,   f.carbsMax)) return false
        return true
      })
    },

    get sorted() {
      const arr = [...this.filtered]
      const k = this.sortKey
      const dir = this.sortDir === 'asc' ? 1 : -1
      arr.sort((a, b) => {
        const va = a[k]; const vb = b[k]
        const na = typeof va === 'number' ? va : parseFloat(va) || 0
        const nb = typeof vb === 'number' ? vb : parseFloat(vb) || 0
        if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir
        return String(va).localeCompare(String(vb)) * dir
      })
      return arr
    },

    get pageRows() {
      const start = (this.page - 1) * this.pageSize
      return this.sorted.slice(start, start + this.pageSize)
    },
    get totalPages() {
      return Math.max(1, Math.ceil(this.sorted.length / this.pageSize))
    }
  })
}
const dayTable  = makeTableState('date')
const mealTable = makeTableState('date')

watch(dayRows, (rows) => {
  dayTable.rows = rows
  dayTable.page = 1
}, { immediate: true })

watch(mealRows, (rows) => {
  mealTable.rows = rows
  mealTable.page = 1
}, { immediate: true })

function toggleSort(state, key) {
  if (state.sortKey === key) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    state.sortKey = key
    state.sortDir = 'asc'
  }
}

/* 超标高亮用的 class */
function overCls(value, th) {
  return th != null && value > Number(th) ? 'over' : ''
}

/* 初次进入加载一次 */
refresh()
</script>

<script>
/* 小部件：排序图标 / 分页条 / 数值区间输入 */
export default {
  components: {
    SortIcon: {
      props: ['state', 'col'],
      template: `
        <span class="sort-icon" :data-active="state.sortKey===col" :data-dir="state.sortKey===col?state.sortDir:''">
          ▲▼
        </span>
      `
    },
    Pager: {
      props: ['state'],
      methods: {
        prev(){ if(this.state.page>1) this.state.page-- },
        next(){ if(this.state.page<this.state.totalPages) this.state.page++ }
      },
      template: `
        <div class="pager">
          <div class="left">
            <span>Rows per page:</span>
            <select v-model.number="state.pageSize">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
          <div class="right">
            <button class="btn-outline sm" :disabled="state.page<=1" @click="prev">Prev</button>
            <span>Page {{ state.page }} / {{ state.totalPages }}</span>
            <button class="btn-outline sm" :disabled="state.page>=state.totalPages" @click="next">Next</button>
          </div>
        </div>
      `
    },
    RangeFilter: {
      props: { min: Number, max: Number },
      emits: ['update:min', 'update:max'],
      template: `
        <div class="range">
          <input type="number" :value="min ?? ''" @input="$emit('update:min', $event.target.value === '' ? null : Number($event.target.value))" placeholder="Min" />
          <span>—</span>
          <input type="number" :value="max ?? ''" @input="$emit('update:max', $event.target.value === '' ? null : Number($event.target.value))" placeholder="Max" />
        </div>
      `
    }
  }
}
</script>

<style scoped>
.planner{max-width:1100px;margin:0 auto;padding:16px}
.head{display:flex;align-items:center;justify-content:space-between;margin:12px 0 16px}
.ops{display:flex;gap:10px}
.empty{margin:12px 0}

.table-card{background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:14px 16px;margin:18px 0}
.table-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.table-title{margin:4px 0 10px}
.hi-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hi-controls .hint{opacity:.7}
.hi-controls input{width:90px;padding:6px;border:1px solid #e0e0e0;border-radius:8px}

.table-wrap{overflow:auto}
.table{width:100%;border-collapse:separate;border-spacing:0}
.table thead th{position:sticky;top:0;background:#f7faf8;border-bottom:2px solid #e8efe9;cursor:pointer;user-select:none;padding:10px}
.table thead th:first-child{border-top-left-radius:8px}
.table thead th:last-child{border-top-right-radius:8px}
.table tbody td{padding:10px;border-bottom:1px dashed #e9e9e9}
.table .filters th{cursor:default;background:#fbfdfc}
.table .filters input,.select{width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;background:#fff}
.date-range{display:flex;gap:6px;align-items:center}
.range{display:flex;gap:6px;align-items:center}

.cap{text-transform:capitalize}
.ellipsis{max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.sort-icon{font-size:.72rem;opacity:.35;margin-left:6px}
.sort-icon[data-active="true"]{opacity:.9}
.sort-icon[data-dir="asc"]{content:"▲";}
.sort-icon[data-dir="desc"]{content:"▼";}

.pager{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.pager .left{display:flex;align-items:center;gap:8px}
.pager .right{display:flex;align-items:center;gap:8px}

.btn-outline{padding:8px 12px;border-radius:8px;background:#fff;color:#4caf7a;border:2px solid #4caf7a;font-weight:700}
.btn-outline:hover{background:#4caf7a;color:#fff}
.btn-danger{padding:8px 12px;border-radius:8px;background:#fff;color:#c0392b;border:2px solid #c0392b;font-weight:700}
.btn-danger:hover{background:#c0392b;color:#fff}
.btn-outline.sm{padding:6px 10px;border-width:2px}

.over{color:#c0392b;font-weight:700}
@media (max-width: 960px){ .ellipsis{max-width:220px} }
</style>
