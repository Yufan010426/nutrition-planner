<template>
  <main id="main" class="planner" role="main" aria-labelledby="page-title">
    <div class="head">
      <h1 id="page-title">Your Weekly Planner</h1>

      <div class="ops" aria-live="polite">
        <button class="btn-outline" type="button" @click="refresh">Refresh</button>
        <button class="btn-danger"  type="button" @click="clearPlan">Clear</button>

        <button class="btn-outline" type="button" :disabled="exporting" @click="downloadPdf">
          {{ exporting ? 'Exporting…' : 'Download PDF' }}
        </button>
        <button class="btn" type="button" :disabled="exporting || !auth.user?.email" @click="emailPdf">
          {{ exporting ? 'Preparing…' : 'Email me the PDF' }}
        </button>
      </div>
    </div>

    <p v-if="!days.length" class="empty">
      No plan yet. Go to <RouterLink to="/guide">Guide</RouterLink> to generate one.
    </p>

    <template v-else>
      <!-- ===== 表 1：按天汇总 ===== -->
      <div class="table-card">
        <div class="table-title-row">
          <h2 class="table-title">Daily Totals</h2>

          <div class="hi-controls" role="group" aria-label="Highlight thresholds">
            <span class="hint">Highlight &gt; </span>
            <label for="hi-kcal">kcal</label>
            <input id="hi-kcal" type="number" v-model.number="dayState.highlight.kcal" placeholder="-" />
            <label for="hi-p">P</label>
            <input id="hi-p" type="number" v-model.number="dayState.highlight.protein" placeholder="-" />
            <label for="hi-f">F</label>
            <input id="hi-f" type="number" v-model.number="dayState.highlight.fat" placeholder="-" />
            <label for="hi-c">C</label>
            <input id="hi-c" type="number" v-model.number="dayState.highlight.carbs" placeholder="-" />
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <caption class="sr-only">Daily nutrition totals for your selected week</caption>
            <thead>
              <tr>
                <th scope="col"
                    :aria-sort="ariaSort(dayState,'date')"
                    @click="toggleSort(dayState,'date')">Date
                  <SortIcon :state="dayState" col="date" />
                </th>
                <th scope="col"
                    :aria-sort="ariaSort(dayState,'kcal')"
                    @click="toggleSort(dayState,'kcal')">kcal
                  <SortIcon :state="dayState" col="kcal" />
                </th>
                <th scope="col"
                    :aria-sort="ariaSort(dayState,'protein')"
                    @click="toggleSort(dayState,'protein')">Protein (g)
                  <SortIcon :state="dayState" col="protein" />
                </th>
                <th scope="col"
                    :aria-sort="ariaSort(dayState,'fat')"
                    @click="toggleSort(dayState,'fat')">Fat (g)
                  <SortIcon :state="dayState" col="fat" />
                </th>
                <th scope="col"
                    :aria-sort="ariaSort(dayState,'carbs')"
                    @click="toggleSort(dayState,'carbs')">Carbs (g)
                  <SortIcon :state="dayState" col="carbs" />
                </th>
              </tr>
              <tr class="filters">
                <th class="date-range">
                  <label class="sr-only" for="d-from">From</label>
                  <input id="d-from" type="date" v-model="dayState.filters.dateFrom" />
                  <span aria-hidden="true">—</span>
                  <label class="sr-only" for="d-to">To</label>
                  <input id="d-to" type="date" v-model="dayState.filters.dateTo" />
                </th>
                <th>
                  <RangeFilter
                    aria-labelledby="f-kcal"
                    v-model:min="dayState.filters.kcalMin"
                    v-model:max="dayState.filters.kcalMax" />
                  <span id="f-kcal" class="sr-only">Filter kcal range</span>
                </th>
                <th>
                  <RangeFilter
                    aria-labelledby="f-p"
                    v-model:min="dayState.filters.proteinMin"
                    v-model:max="dayState.filters.proteinMax" />
                  <span id="f-p" class="sr-only">Filter protein range</span>
                </th>
                <th>
                  <RangeFilter
                    aria-labelledby="f-f"
                    v-model:min="dayState.filters.fatMin"
                    v-model:max="dayState.filters.fatMax" />
                  <span id="f-f" class="sr-only">Filter fat range</span>
                </th>
                <th>
                  <RangeFilter
                    aria-labelledby="f-c"
                    v-model:min="dayState.filters.carbsMin"
                    v-model:max="dayState.filters.carbsMax" />
                  <span id="f-c" class="sr-only">Filter carbs range</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in dayPageRows" :key="r._key">
                <th scope="row">
                  <div class="date-line">{{ r.date }}</div>
                  <div v-if="r.metaChips.length" class="chips" aria-label="Profile meta">
                    <span v-for="(c,idx) in r.metaChips" :key="idx" class="chip">{{ c }}</span>
                  </div>
                </th>
                <td :class="overCls(r.kcal, dayState.highlight.kcal)">{{ r.kcal }}</td>
                <td :class="overCls(r.protein, dayState.highlight.protein)">{{ r.protein }}</td>
                <td :class="overCls(r.fat, dayState.highlight.fat)">{{ r.fat }}</td>
                <td :class="overCls(r.carbs, dayState.highlight.carbs)">{{ r.carbs }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pager
          :page="dayState.page"
          :page-size="dayState.pageSize"
          :total-pages="dayTotalPages"
          @update:page="val => dayState.page = val"
          @update:page-size="val => dayState.pageSize = val"
        />
      </div>

      <!-- ===== 表 2：逐餐明细 ===== -->
      <div class="table-card">
        <div class="table-title-row">
          <h2 class="table-title">Meals (All Days)</h2>
          <div class="hi-controls" role="group" aria-label="Highlight thresholds (meals)">
            <span class="hint">Highlight &gt; </span>
            <label for="mh-k">kcal</label>
            <input id="mh-k" type="number" v-model.number="mealState.highlight.kcal" placeholder="-" />
            <label for="mh-p">P</label>
            <input id="mh-p" type="number" v-model.number="mealState.highlight.protein" placeholder="-" />
            <label for="mh-f">F</label>
            <input id="mh-f" type="number" v-model.number="mealState.highlight.fat" placeholder="-" />
            <label for="mh-c">C</label>
            <input id="mh-c" type="number" v-model.number="mealState.highlight.carbs" placeholder="-" />
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <caption class="sr-only">All meals across days with nutrition details</caption>
            <thead>
              <tr>
                <th scope="col" :aria-sort="ariaSort(mealState,'date')"   @click="toggleSort(mealState,'date')">Date   <SortIcon :state="mealState" col="date" /></th>
                <th scope="col" :aria-sort="ariaSort(mealState,'type')"   @click="toggleSort(mealState,'type')">Type   <SortIcon :state="mealState" col="type" /></th>
                <th scope="col" :aria-sort="ariaSort(mealState,'name')"   @click="toggleSort(mealState,'name')">Title  <SortIcon :state="mealState" col="name" /></th>
                <th scope="col" :aria-sort="ariaSort(mealState,'kcal')"   @click="toggleSort(mealState,'kcal')">kcal   <SortIcon :state="mealState" col="kcal" /></th>
                <th scope="col" :aria-sort="ariaSort(mealState,'protein')"@click="toggleSort(mealState,'protein')">P (g) <SortIcon :state="mealState" col="protein" /></th>
                <th scope="col" :aria-sort="ariaSort(mealState,'fat')"    @click="toggleSort(mealState,'fat')">F (g)   <SortIcon :state="mealState" col="fat" /></th>
                <th scope="col" :aria-sort="ariaSort(mealState,'carbs')"  @click="toggleSort(mealState,'carbs')">C (g)  <SortIcon :state="mealState" col="carbs" /></th>
              </tr>
              <tr class="filters">
                <th class="date-range">
                  <label class="sr-only" for="m-from">From</label>
                  <input id="m-from" type="date" v-model="mealState.filters.dateFrom" />
                  <span aria-hidden="true">—</span>
                  <label class="sr-only" for="m-to">To</label>
                  <input id="m-to" type="date" v-model="mealState.filters.dateTo" />
                </th>
                <th>
                  <label class="sr-only" for="m-type">Type</label>
                  <select id="m-type" v-model="mealState.filters.type" class="select">
                    <option value="">All</option>
                    <option v-for="t in mealTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                </th>
                <th>
                  <label class="sr-only" for="title-search">Search title</label>
                  <input id="title-search" v-model="mealState.filters.name" placeholder="Search title" />
                </th>
                <th><RangeFilter aria-labelledby="rf-k" v-model:min="mealState.filters.kcalMin"    v-model:max="mealState.filters.kcalMax" /></th>
                <span id="rf-k" class="sr-only">Filter kcal range</span>
                <th><RangeFilter aria-labelledby="rf-p" v-model:min="mealState.filters.proteinMin" v-model:max="mealState.filters.proteinMax" /></th>
                <span id="rf-p" class="sr-only">Filter protein range</span>
                <th><RangeFilter aria-labelledby="rf-f" v-model:min="mealState.filters.fatMin"     v-model:max="mealState.filters.fatMax" /></th>
                <span id="rf-f" class="sr-only">Filter fat range</span>
                <th><RangeFilter aria-labelledby="rf-c" v-model:min="mealState.filters.carbsMin"   v-model:max="mealState.filters.carbsMax" /></th>
                <span id="rf-c" class="sr-only">Filter carbs range</span>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in mealPageRows" :key="r._key">
                <th scope="row">
                  <div class="date-line">{{ r.date }}</div>
                  <div v-if="r.metaChips.length" class="chips" aria-label="Profile meta">
                    <span v-for="(c,idx) in r.metaChips" :key="idx" class="chip">{{ c }}</span>
                  </div>
                </th>
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
          @update:page-size="val => mealState.pageSize = val"
        />
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { usePlanner } from '@/stores/planner'
import { useAuth } from '@/stores/auth'
import html2pdf from 'html2pdf.js'
import { getFunctions, httpsCallable } from 'firebase/functions'

const planner = usePlanner()
const auth = useAuth()

const ariaSort = (st, key) => st.sortKey===key ? (st.sortDir==='asc'?'ascending':'descending') : 'none'
function refresh () {
  const uid = auth.user?.uid || auth.user?.id || 'guest'
  planner.load(uid)
}
function clearPlan () {
  const uid = auth.user?.uid || auth.user?.id || 'guest'
  if (confirm('Clear current week?')) planner.clear(uid)
}

const days = computed(() => planner.days || [])

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
        metaChips: chips,
      })
    })
  })
  return out
})

const mealTypes = computed(() => {
  const set = new Set(mealRows.value.map(r => r.type).filter(Boolean))
  return Array.from(set).map(s => s.charAt(0).toUpperCase() + s.slice(1))
})

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

const dayFiltered   = computed(() => filterRows(dayRows.value, dayState))
const daySorted     = computed(() => sortRows(dayFiltered.value, dayState))
const dayTotalPages = computed(() => Math.max(1, Math.ceil(daySorted.value.length / dayState.pageSize)))
const dayPageRows   = computed(() => paginate(daySorted.value, dayState.page, dayState.pageSize))

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

const exporting = ref(false)

async function renderPdfBlob() {
  const targetEl = document.querySelector('.planner') || document.body
  const opt = {
    margin: [10,10,10,10],
    filename: 'Nutrition-Planner.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }
  const pdf = await html2pdf().set(opt).from(targetEl).toPdf().get('pdf')
  const blob = pdf.output('blob')
  return { blob, filename: opt.filename, pdf }
}

async function downloadPdf() {
  exporting.value = true
  try {
    const { pdf, filename } = await renderPdfBlob()
    pdf.save(filename) 
  } finally {
    exporting.value = false
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).replace(/^data:application\/pdf;base64,/, ''))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')
if (!API_BASE) {
  console.error('[emailPdf] Missing VITE_API_BASE, check Pages env vars')
}

async function emailPdf() {
  if (!auth.user?.email) return alert('Please sign in first.')
  exporting.value = true
  try {
    const { blob, filename } = await renderPdfBlob()
    const base64 = await blobToBase64(blob)

    const url = `${API_BASE}/?path=send-mail`
    console.log('[emailPdf] POST', url, 'to:', auth.user.email)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: auth.user.email,
        subject: 'Your Nutrition Planner PDF',
        html: '<p>Please find the planner PDF attached.</p>',
        filename,
        contentBase64: base64, 
      }),
    })

    let data = null
    try { data = await res.json() } catch {}
    console.log('[emailPdf] resp', res.status, data)

    if (!res.ok || !data?.ok) {
      throw new Error(`send-mail ${res.status} ${JSON.stringify(data)}`)
    }

    alert('📧 Email sent! Check your inbox.')
  } catch (e) {
    console.error('[emailPdf] failed:', e)
    alert('Failed to email the PDF. See console.')
  } finally {
    exporting.value = false
  }
}


refresh()
</script>

<script>
import { defineComponent, h } from 'vue'

export default defineComponent({
  components: {
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
    Pager: defineComponent({
      props: {
        page: { type: Number, required: true },
        pageSize: { type: Number, required: true },
        totalPages: { type: Number, required: true }
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
              h('button', { class: 'btn-outline sm', disabled: props.page <= 1, onClick: prev }, 'Prev'),
              h('span', null, `Page ${props.page} / ${props.totalPages}`),
              h('button', { class: 'btn-outline sm', disabled: props.page >= props.totalPages, onClick: next }, 'Next')
            ])
          ])
      }
    })
  }
})
</script>

<style scoped>
.planner{max-width: 1200px;margin: 0 auto;padding: 16px 24px;}
.head{display:flex;align-items:center;justify-content:space-between;margin:12px 0 16px}
.ops{display:flex;gap:10px;flex-wrap:wrap}
.empty{margin:12px 0}

.table-card{background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:16px 18px;margin:18px 0;}
.table-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.table-title{margin:4px 0 10px}
.hi-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hi-controls .hint{opacity:.7}
.hi-controls input{width:90px;padding:6px;border:1px solid #e0e0e0;border-radius:8px}

.table-wrap{overflow:auto}
.table{width:100%;border-collapse:separate;border-spacing:0;min-width:860px}
.table thead th{position:sticky;top:0;background:#f7faf8;border-bottom:2px solid #e8efe9;cursor:pointer;user-select:none;padding:10px}
.table thead th:first-child{border-top-left-radius:8px}
.table thead th:last-child{border-top-right-radius:8px}
.table tbody td{padding:10px;border-bottom:1px dashed #e9e9e9;vertical-align:top}
.table .filters th{cursor:default;background:#fbfdfc}
.table .filters input,.select{width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;background:#fff}
.date-range{display:flex;gap:6px;align-items:center}
.range{display:flex;gap:6px;align-items:center}

.date-line{font-weight:600}
.chips{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}
.chip{background:#eef7f0;color:#2f7d56;border:1px solid #cfe9d9;border-radius:999px;padding:2px 8px;font-size:.75rem}

.cap{text-transform:capitalize}
.ellipsis{max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.sort-icon{font-size:.72rem;opacity:.35;margin-left:6px}
.sort-icon[data-active="true"]{opacity:.9}

.pager{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.pager .left{display:flex;align-items:center;gap:8px}
.pager .right{display:flex;align-items:center;gap:8px}

.btn{padding:8px 12px;border-radius:8px;background:#4caf7a;color:#fff;border:0;font-weight:700;cursor:pointer}
.btn:hover{background:#388e5a}
.btn-outline{padding:8px 12px;border-radius:8px;background:#fff;color:#4caf7a;border:2px solid #4caf7a;font-weight:700;cursor:pointer}
.btn-outline:hover{background:#4caf7a;color:#fff}
.btn-danger{padding:8px 12px;border-radius:8px;background:#fff;color:#c0392b;border:2px solid #c0392b;font-weight:700;cursor:pointer}
.btn-danger:hover{background:#c0392b;color:#fff}
.btn-outline.sm{padding:6px 10px;border-width:2px}

.over{color:#c0392b;font-weight:700}
@media (max-width: 960px){ .ellipsis{max-width:220px} }
</style>
