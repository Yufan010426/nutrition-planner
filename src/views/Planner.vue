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
      <!-- ===== 表 1：按天汇总 ===== -->
      <div class="table-card">
        <div class="table-title-row">
          <h3 class="table-title">Daily Totals</h3>
        <div class="hi-controls">
            <span class="hint">Highlight &gt; </span>
            <label>kcal <input type="number" v-model.number="dayState.highlight.kcal" placeholder="-" /></label>
            <label>P <input type="number" v-model.number="dayState.highlight.protein" placeholder="-" /></label>
            <label>F <input type="number" v-model.number="dayState.highlight.fat" placeholder="-" /></label>
            <label>C <input type="number" v-model.number="dayState.highlight.carbs" placeholder="-" /></label>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th @click="toggleSort(dayState,'date')">Date <SortIcon :state="dayState" col="date" /></th>
                <th @click="toggleSort(dayState,'kcal')">kcal <SortIcon :state="dayState" col="kcal" /></th>
                <th @click="toggleSort(dayState,'protein')">Protein (g) <SortIcon :state="dayState" col="protein" /></th>
                <th @click="toggleSort(dayState,'fat')">Fat (g) <SortIcon :state="dayState" col="fat" /></th>
                <th @click="toggleSort(dayState,'carbs')">Carbs (g) <SortIcon :state="dayState" col="carbs" /></th>
              </tr>
              <tr class="filters">
                <th class="date-range">
                  <input type="date" v-model="dayState.filters.dateFrom" />
                  <span>—</span>
                  <input type="date" v-model="dayState.filters.dateTo" />
                </th>
                <th><RangeFilter v-model:min="dayState.filters.kcalMin" v-model:max="dayState.filters.kcalMax" /></th>
                <th><RangeFilter v-model:min="dayState.filters.proteinMin" v-model:max="dayState.filters.proteinMax" /></th>
                <th><RangeFilter v-model:min="dayState.filters.fatMin" v-model:max="dayState.filters.fatMax" /></th>
                <th><RangeFilter v-model:min="dayState.filters.carbsMin" v-model:max="dayState.filters.carbsMax" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in dayPageRows" :key="r._key">
                <td>
                  <div class="date-line">{{ r.date }}</div>
                  <div v-if="r.metaChips.length" class="chips">
                    <span v-for="(c,idx) in r.metaChips" :key="idx" class="chip">{{ c }}</span>
                  </div>
                </td>
                <td :class="overCls(r.kcal, dayState.highlight.kcal)">{{ r.kcal }}</td>
                <td :class="overCls(r.protein, dayState.highlight.protein)">{{ r.protein }}</td>
                <td :class="overCls(r.fat, dayState.highlight.fat)">{{ r.fat }}</td>
                <td :class="overCls(r.carbs, dayState.highlight.carbs)">{{ r.carbs }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ✅ 与 Pager 的 props/事件完全一致 -->
        <Pager
          :page="dayState.page"
          :page-size="dayState.pageSize"
          :total-pages="dayTotalPages"
          @update:page="val => dayState.page = val"
          @update:page-size="val => { dayState.pageSize = val; dayState.page = 1 }"
        />
      </div>

      <!-- ===== 表 2：逐餐明细 ===== -->
      <div class="table-card">
        <div class="table-title-row">
          <h3 class="table-title">Meals (All Days)</h3>
          <div class="hi-controls">
            <span class="hint">Highlight &gt; </span>
            <label>kcal <input type="number" v-model.number="mealState.highlight.kcal" placeholder="-" /></label>
            <label>P <input type="number" v-model.number="mealState.highlight.protein" placeholder="-" /></label>
            <label>F <input type="number" v-model.number="mealState.highlight.fat" placeholder="-" /></label>
            <label>C <input type="number" v-model.number="mealState.highlight.carbs" placeholder="-" /></label>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th @click="toggleSort(mealState,'date')">Date <SortIcon :state="mealState" col="date" /></th>
                <th @click="toggleSort(mealState,'type')">Type <SortIcon :state="mealState" col="type" /></th>
                <th @click="toggleSort(mealState,'name')">Title <SortIcon :state="mealState" col="name" /></th>
                <th @click="toggleSort(mealState,'kcal')">kcal <SortIcon :state="mealState" col="kcal" /></th>
                <th @click="toggleSort(mealState,'protein')">P (g) <SortIcon :state="mealState" col="protein" /></th>
                <th @click="toggleSort(mealState,'fat')">F (g) <SortIcon :state="mealState" col="fat" /></th>
                <th @click="toggleSort(mealState,'carbs')">C (g) <SortIcon :state="mealState" col="carbs" /></th>
              </tr>
              <tr class="filters">
                <th class="date-range">
                  <input type="date" v-model="mealState.filters.dateFrom" />
                  <span>—</span>
                  <input type="date" v-model="mealState.filters.dateTo" />
                </th>
                <th>
                  <select v-model="mealState.filters.type" class="select">
                    <option value="">All</option>
                    <option v-for="t in mealTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                </th>
                <th><input v-model="mealState.filters.name" placeholder="Search title" /></th>
                <th><RangeFilter v-model:min="mealState.filters.kcalMin" v-model:max="mealState.filters.kcalMax" /></th>
                <th><RangeFilter v-model:min="mealState.filters.proteinMin" v-model:max="mealState.filters.proteinMax" /></th>
                <th><RangeFilter v-model:min="mealState.filters.fatMin" v-model:max="mealState.filters.fatMax" /></th>
                <th><RangeFilter v-model:min="mealState.filters.carbsMin" v-model:max="mealState.filters.carbsMax" /></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in mealPageRows" :key="r._key">
                <td>{{ r.date }}</td>
                <td class="cap">{{ r.type }}</td>
                <td class="ellipsis" :title="r.name">{{ r.name }}</td>
                <td :class="overCls(r.kcal, mealState.highlight.kcal)">{{ r.kcal }}</td>
                <td :class="overCls(r.protein, mealState.highlight.protein)">{{ r.protein }}</td>
                <td :class="overCls(r.fat, mealState.highlight.fat)">{{ r.fat }}</td>
                <td :class="overCls(r.carbs, mealState.highlight.carbs)">{{ r.carbs }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pager
          :page="mealState.page"
          :page-size="mealState.pageSize"
          :total-pages="mealTotalPages"
          @update:page="val => mealState.page = val"
          @update:page-size="val => { mealState.pageSize = val; mealState.page = 1 }"
        />
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { usePlanner } from '@/stores/planner'
import { useAuth } from '@/stores/auth'

/* ---------- 数据源 ---------- */
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

/* ---------- 构造行数据 ---------- */
const dayRows = computed(() => {
  const out = []
  days.value.forEach((d, idx) => {
    const date = d.date || d.day || d.weekDate || d.weekStart || ''
    const meta = d.meta || {}
    const chips = []
    if (meta.sex) chips.push(`Sex:${meta.sex}`)
    if (meta.age) chips.push(`Age:${meta.age}`)
    if (meta.height) chips.push(`H:${meta.height}cm`)
    if (meta.weight) chips.push(`W:${meta.weight}kg`)
    if (meta.activity) chips.push(`Act:${meta.activity}`)
    if (meta.goal) chips.push(`Goal:${meta.goal}`)
    if (meta.diet) chips.push(`Diet:${meta.diet}`)
    if (meta.exclude) chips.push(`Ex:${meta.exclude}`)

    out.push({
      _key: `${date}#${idx}`,
      date,
      kcal: d.totals?.kcal ?? 0,
      protein: d.totals?.protein ?? 0,
      fat: d.totals?.fat ?? 0,
      carbs: d.totals?.carbs ?? 0,
      metaChips: chips,
    })
  })
  return out
})

const mealRows = computed(() => {
  const out = []
  days.value.forEach((d, dIdx) => {
    const date = d.date || d.day || d.weekDate || d.weekStart || ''
    ;(d.meals || []).forEach((m, mIdx) => {
      out.push({
        _key: `${date}#${dIdx}#${mIdx}`,
        date,
        type: (m.type || '').toLowerCase(),
        name: m.name || m.title || '',
        kcal: m.kcal ?? 0,
        protein: m.protein ?? 0,
        fat: m.fat ?? 0,
        carbs: m.carbs ?? 0,
      })
    })
  })
  return out
})

const mealTypes = computed(() => {
  const set = new Set(mealRows.value.map(r => r.type).filter(Boolean))
  return Array.from(set).map(s => s.charAt(0).toUpperCase() + s.slice(1))
})

/* ---------- 轻量状态 & 纯 computed 派生 ---------- */
function createState() {
  return reactive({
    filters: {
      dateFrom: '', dateTo: '',
      type: '', name: '',
      kcalMin: null,  kcalMax: null,
      proteinMin: null, proteinMax: null,
      fatMin: null,     fatMax: null,
      carbsMin: null,   carbsMax: null,
    },
    highlight: { kcal: null, protein: null, fat: null, carbs: null },
    sortKey: 'date',
    sortDir: 'asc',
    page: 1,
    pageSize: 10,
  })
}
const dayState  = createState()
const mealState = createState()

const filterRows = (rows, st) => {
  const f = st.filters
  const inDate = (ds) => {
    if (!ds) return true
    if (f.dateFrom && ds < f.dateFrom) return false
    if (f.dateTo && ds > f.dateTo) return false
    return true
  }
  const inNum = (v,min,max) => {
    if (min != null && Number(v) < Number(min)) return false
    if (max != null && Number(v) > Number(max)) return false
    return true
  }
  return rows.filter(r => {
    if (!inDate(r.date)) return false
    if (f.type && r.type && r.type.toLowerCase() !== f.type.toLowerCase()) return false
    if (f.name && !String(r.name ?? '').toLowerCase().includes(f.name.toLowerCase())) return false
    if (!inNum(r.kcal,    f.kcalMin,    f.kcalMax)) return false
    if (!inNum(r.protein, f.proteinMin, f.proteinMax)) return false
    if (!inNum(r.fat,     f.fatMin,     f.fatMax)) return false
    if (!inNum(r.carbs,   f.carbsMin,   f.carbsMax)) return false
    return true
  })
}
const sortRows = (rows, st) => {
  const k = st.sortKey
  const dir = st.sortDir === 'asc' ? 1 : -1
  const arr = [...rows]
  arr.sort((a,b) => {
    const va = a[k], vb = b[k]
    const na = typeof va === 'number' ? va : parseFloat(va) || 0
    const nb = typeof vb === 'number' ? vb : parseFloat(vb) || 0
    if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })
  return arr
}
const paginate = (rows, page, pageSize) => {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

/* —— 日表 —— */
const dayFiltered   = computed(() => filterRows(dayRows.value, dayState))
const daySorted     = computed(() => sortRows(dayFiltered.value, dayState))
const dayTotalPages = computed(() => Math.max(1, Math.ceil(daySorted.value.length / dayState.pageSize)))
const dayPageRows   = computed(() => paginate(daySorted.value, dayState.page, dayState.pageSize))

/* —— 餐表 —— */
const mealFiltered   = computed(() => filterRows(mealRows.value, mealState))
const mealSorted     = computed(() => sortRows(mealFiltered.value, mealState))
const mealTotalPages = computed(() => Math.max(1, Math.ceil(mealSorted.value.length / mealState.pageSize)))
const mealPageRows   = computed(() => paginate(mealSorted.value, mealState.page, mealState.pageSize))

function toggleSort(state, key) {
  if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
  else { state.sortKey = key; state.sortDir = 'asc' }
}
function overCls(value, th) {
  return th != null && value > Number(th) ? 'over' : ''
}

/* 初次加载 */
refresh()
</script>

<script>
import { defineComponent, h } from 'vue'

export default defineComponent({
  components: {
    /* 无运行时模板，避免 CSP 报错 */
    SortIcon: defineComponent({
      props: { state: Object, col: String },
      setup(props) {
        return () =>
          h('span', {
            class: 'sort-icon',
            'data-active': props.state.sortKey === props.col ? 'true' : 'false',
            'data-dir': props.state.sortKey === props.col ? props.state.sortDir : ''
          }, '▲▼')
      }
    }),

    RangeFilter: defineComponent({
      props: { min: Number, max: Number },
      emits: ['update:min', 'update:max'],
      setup(props, { emit }) {
        const onMin = e => emit('update:min', e.target.value === '' ? null : Number(e.target.value))
        const onMax = e => emit('update:max', e.target.value === '' ? null : Number(e.target.value))
        return () =>
          h('div', { class: 'range' }, [
            h('input', { type: 'number', value: props.min ?? '', placeholder: 'Min', onInput: onMin }),
            h('span', null, '—'),
            h('input', { type: 'number', value: props.max ?? '', placeholder: 'Max', onInput: onMax })
          ])
      }
    }),

    /* ✅ 与模版使用的 props/事件对齐 */
    Pager: defineComponent({
      props: {
        page: { type: Number, required: true },
        pageSize: { type: Number, required: true },
        totalPages: { type: Number, required: true },
      },
      emits: ['update:page', 'update:page-size'],
      setup(props, { emit }) {
        const prev = () => { if (props.page > 1) emit('update:page', props.page - 1) }
        const next = () => { if (props.page < props.totalPages) emit('update:page', props.page + 1) }
        const onPageSize = e => emit('update:page-size', Number(e.target.value))

        return () =>
          h('div', { class: 'pager' }, [
            h('div', { class: 'left' }, [
              h('span', null, 'Rows per page:'),
              h('select', { value: props.pageSize, onChange: onPageSize }, [
                h('option', { value: 10 }, '10'),
                h('option', { value: 25 }, '25'),
                h('option', { value: 50 }, '50')
              ])
            ]),
            h('div', { class: 'right' }, [
              h('button', {
                class: 'btn-outline sm',
                disabled: props.page <= 1,
                onClick: prev
              }, 'Prev'),
              h('span', null, `Page ${props.page} / ${props.totalPages}`),
              h('button', {
                class: 'btn-outline sm',
                disabled: props.page >= props.totalPages,
                onClick: next
              }, 'Next')
            ])
          ])
      }
    })
  }
})
</script>
<style scoped>
/* 更宽的容器，桌面端无横向滚动 */
.planner{ max-width:1600px; margin:0 auto; padding:20px 28px; }

.head{display:flex;align-items:center;justify-content:space-between;margin:12px 0 16px}
.ops{display:flex;gap:10px}
.empty{margin:12px 0}

/* 卡片外观 */
.table-card{
  background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.08);
  padding:18px 20px;margin:18px 0; overflow:hidden; /* 防止极端情况下轻微溢出 */
}
.table-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.table-title{margin:4px 0 10px}
.hi-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hi-controls .hint{opacity:.7}
.hi-controls input{width:76px;padding:6px;border:1px solid #e0e0e0;border-radius:8px}

/* 表格本体 */
.table-wrap{overflow:visible}
.table{
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  table-layout:fixed;               /* 固定布局，列更稳定 */
}
.table thead th{
  position:sticky; top:0; z-index:1;
  background:#f7faf8;border-bottom:2px solid #e8efe9;
  cursor:pointer; user-select:none;
  padding:10px 12px;                /* 收一点 padding，给过滤控件留空间 */
  font-size:15px;
}
.table thead th:first-child{border-top-left-radius:8px}
.table thead th:last-child{border-top-right-radius:8px}
.table tbody td{padding:12px;border-bottom:1px dashed #e9e9e9;font-size:15px}

.table .filters th{cursor:default;background:#fbfdfc}
.table .filters input,.select{
  width:100%; padding:8px; border:1px solid #e0e0e0; border-radius:8px; background:#fff;
  box-sizing:border-box;            /* 防止边框把单元格撑爆 */
}

/* 关键：让两个输入并排时可收缩而不溢出 */
.date-range,.range{
  width:100%;
  display:grid;
  grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
  gap:6px; align-items:center;
}
.date-range input,.range input{
  min-width:0;                      /* 允许在窄列中收缩 */
  width:100%; box-sizing:border-box;
}

/* 其余小样式 */
.date-line{font-weight:600}
.chips{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}
.chip{background:#eef7f0;color:#2f7d56;border:1px solid #cfe9d9;border-radius:999px;padding:2px 8px;font-size:.75rem}

.cap{text-transform:capitalize}
.ellipsis{max-width:600px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.sort-icon{font-size:.72rem;opacity:.35;margin-left:6px}
.sort-icon[data-active="true"]{opacity:.9}

.pager{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.pager .left{display:flex;align-items:center;gap:8px}
.pager .right{display:flex;align-items:center;gap:8px}

.btn-outline{padding:8px 12px;border-radius:8px;background:#fff;color:#4caf7a;border:2px solid #4caf7a;font-weight:700}
.btn-outline:hover{background:#4caf7a;color:#fff}
.btn-danger{padding:8px 12px;border-radius:8px;background:#fff;color:#c0392b;border:2px solid #c0392b;font-weight:700}
.btn-danger:hover{background:#c0392b;color:#fff}
.btn-outline.sm{padding:6px 10px;border-width:2px}

.over{color:#c0392b;font-weight:700}

/* 小屏回退：允许横向滚动避免布局拥挤 */
@media (max-width:1200px){
  .planner{ max-width:100%; padding:12px; }
  .table-wrap{ overflow:auto; }
  .table thead th, .table tbody td{ padding:10px 12px; font-size:14px; }
  .ellipsis{ max-width:220px; }
}
</style>
