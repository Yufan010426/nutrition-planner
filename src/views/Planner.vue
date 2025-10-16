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
      <!-- 表 1：按天汇总 -->
      <div class="table-card">
        <h3 class="table-title">Daily Totals</h3>
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
              <!-- 每列搜索 -->
              <tr class="filters">
                <th><input v-model="dayTable.filters.date" placeholder="Search date (YYYY-MM-DD)" /></th>
                <th><input v-model="dayTable.filters.kcal" placeholder="Search kcal" /></th>
                <th><input v-model="dayTable.filters.protein" placeholder="Search protein" /></th>
                <th><input v-model="dayTable.filters.fat" placeholder="Search fat" /></th>
                <th><input v-model="dayTable.filters.carbs" placeholder="Search carbs" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in dayTable.pageRows" :key="r.date">
                <td>{{ r.date }}</td>
                <td>{{ r.kcal }}</td>
                <td>{{ r.protein }}</td>
                <td>{{ r.fat }}</td>
                <td>{{ r.carbs }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pager :state="dayTable" />
      </div>

      <!-- 表 2：逐餐明细（跨所有天） -->
      <div class="table-card">
        <h3 class="table-title">Meals (All Days)</h3>
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
                <th><input v-model="mealTable.filters.date" placeholder="Search date" /></th>
                <th><input v-model="mealTable.filters.type" placeholder="Search type" /></th>
                <th><input v-model="mealTable.filters.name" placeholder="Search title" /></th>
                <th><input v-model="mealTable.filters.kcal" placeholder="Search kcal" /></th>
                <th><input v-model="mealTable.filters.protein" placeholder="Search protein" /></th>
                <th><input v-model="mealTable.filters.fat" placeholder="Search fat" /></th>
                <th><input v-model="mealTable.filters.carbs" placeholder="Search carbs" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in mealTable.pageRows" :key="r.date + r.type + r.name">
                <td>{{ r.date }}</td>
                <td class="cap">{{ r.type }}</td>
                <td class="ellipsis" :title="r.name">{{ r.name }}</td>
                <td>{{ r.kcal }}</td>
                <td>{{ r.protein }}</td>
                <td>{{ r.fat }}</td>
                <td>{{ r.carbs }}</td>
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
  const uid = auth.user?.uid || 'guest'
  planner.load(uid)
}
function clearPlan () {
  const uid = auth.user?.uid || 'guest'
  if (confirm('Clear current week?')) planner.clear(uid)
}

const days = computed(() => planner.days || [])

/* 把 days -> 两个表的数据 */
const dayRows = computed(() =>
  days.value.map(d => ({
    date: d.date || d.day || d.weekDate || d.weekStart || '', // 兼容不同字段名
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
        type: m.type || '',
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

/* ------------------ 轻量表格状态&逻辑 ------------------ */
function makeTableState(defaultSortKey) {
  return reactive({
    // 原始行
    rows: [],
    // 过滤器（每列搜索）
    filters: {
      date: '', type: '', name: '',
      kcal: '', protein: '', fat: '', carbs: '',
    },
    // 排序
    sortKey: defaultSortKey,
    sortDir: 'asc', // 'asc' | 'desc'
    // 分页
    pageSize: 10,
    page: 1,

    // 计算得到的行（过滤+排序）
    get filtered() {
      const f = this.filters
      const pass = (val, key) => {
        const q = (f[key] ?? '').toString().trim().toLowerCase()
        if (!q) return true
        return (val ?? '').toString().toLowerCase().includes(q)
      }
      return this.rows.filter(r =>
        pass(r.date, 'date') &&
        pass(r.type, 'type') &&
        pass(r.name, 'name') &&
        pass(r.kcal, 'kcal') &&
        pass(r.protein, 'protein') &&
        pass(r.fat, 'fat') &&
        pass(r.carbs, 'carbs')
      )
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

// 同步源数据到表状态
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

/* 初次进入加载一次 */
refresh()
</script>

<script>
// 小部件：排序图标
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
    }
  }
}
</script>

<style scoped>
.planner{max-width:1100px;margin:0 auto;padding:16px}
.head{display:flex;align-items:center;justify-content:space-between;margin:12px 0 16px}
.ops{display:flex;gap:10px}
.empty{margin:12px 0}

.table-card{background:#fff;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.06);padding:12px 14px;margin:14px 0}
.table-title{margin:4px 0 10px}
.table-wrap{overflow:auto}
.table{width:100%;border-collapse:separate;border-spacing:0}
.table thead th{position:sticky;top:0;background:#f7faf8;border-bottom:2px solid #e8efe9;cursor:pointer;user-select:none;padding:10px}
.table thead th:first-child{border-top-left-radius:8px}
.table thead th:last-child{border-top-right-radius:8px}
.table tbody td{padding:10px;border-bottom:1px dashed #e9e9e9}
.table .filters th{cursor:default;background:#fbfdfc}
.table .filters input{width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;background:#fff}

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
@media (max-width: 960px){ .ellipsis{max-width:220px} }
</style>
