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

    <div v-else class="grid">
      <div v-for="d in days" :key="d.day" class="card">
        <h3>{{ d.day }}</h3>
        <ul class="meals">
          <li v-for="m in d.meals" :key="m.title" class="row">
            <span class="type">{{ label(m.type) }}</span>
            <span class="title">{{ m.title }}</span>
            <span class="macros">{{ m.kcal }} kcal · P {{ m.protein }} · F {{ m.fat }} · C {{ m.carbs }}</span>
          </li>
        </ul>
        <div class="totals">
          <strong>Day total:</strong>
          {{ d.totals.kcal }} kcal · P {{ d.totals.protein }} · F {{ d.totals.fat }} · C {{ d.totals.carbs }}
        </div>
      </div>
    </div>

    <div v-if="days.length" class="grand">
      <div class="inner">
        <strong>Week total:</strong>
        {{ totals.kcal }} kcal · P {{ totals.protein }} · F {{ totals.fat }} · C {{ totals.carbs }}
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { usePlanner } from '@/stores/planner'
import { useAuth } from '@/stores/auth'

const planner = usePlanner()
const auth = useAuth()
const uid = computed(() => auth.user?.id || 'guest')

function refresh() { planner.load(uid.value) }
function clearPlan() { if (confirm('Clear current week?')) planner.clear(uid.value) }
function label(t){ return (t||'').charAt(0).toUpperCase()+ (t||'').slice(1) }

planner.load(uid.value)

const days   = computed(() => planner.days)
const totals = computed(() => planner.grandTotals)
</script>

<style scoped>
.planner{max-width:1100px;margin:0 auto;padding:16px}
.head{display:flex;align-items:center;justify-content:space-between;margin:12px 0 16px}
.ops{display:flex;gap:10px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 6px 18px rgba(0,0,0,.06)}
h3{margin:4px 0 10px}
.meals{list-style:none;padding:0;margin:0}
.row{display:grid;grid-template-columns:92px 1fr auto;gap:8px;padding:6px 0;border-bottom:1px dashed #e9e9e9}
.row:last-child{border-bottom:0}
.type{font-weight:700;color:#4caf7a}
.title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.macros{white-space:nowrap;color:#555}
.totals{margin-top:8px;padding-top:8px;border-top:1px solid #eee}
.grand{margin:18px 0 8px}
.inner{background:#ffffffc8;border:2px solid #4caf7a;border-radius:12px;padding:12px 16px;font-weight:700}
.empty{margin:12px 0}
.btn-outline{padding:8px 12px;border-radius:8px;background:#fff;color:#4caf7a;border:2px solid #4caf7a;font-weight:700}
.btn-outline:hover{background:#4caf7a;color:#fff}
.btn-danger{padding:8px 12px;border-radius:8px;background:#fff;color:#c0392b;border:2px solid #c0392b;font-weight:700}
.btn-danger:hover{background:#c0392b;color:#fff}
@media (max-width: 960px){ .grid{grid-template-columns:1fr} }
</style>
