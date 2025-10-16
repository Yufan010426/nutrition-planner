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
      <div v-for="d in days" :key="d.day + Math.random()" class="card">
        <h3>{{ d.day }}</h3>
        <ul class="meals">
          <li v-for="m in d.meals" :key="m.type + m.title" class="row">
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
import { computed, watch, onMounted } from 'vue'
import { usePlanner } from '@/stores/planner'
import { useAuth } from '@/stores/auth'

const planner = usePlanner()
const auth = useAuth()

// ✅ 你的 auth.user 字段叫 uid，不是 id
const uid = computed(() => auth.user?.uid || 'guest')

function refresh() {
  planner.load(uid.value)
}
function clearPlan() {
  if (confirm('Clear current week?')) planner.clear(uid.value)
}
function label(t) {
  return (t || '').charAt(0).toUpperCase() + (t || '').slice(1)
}

onMounted(() => {
  planner.load(uid.value)
})

// 登录状态切换时，重新加载对应用户的计划
watch(uid, () => {
  planner.load(uid.value)
})

const days = computed(() => planner.days)
const totals = computed(() => planner.grandTotals)
</script>

<style scoped>
/* 保持你原来的样式即可，这里略 */
</style>
