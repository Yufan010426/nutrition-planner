<!-- src/views/Guide.vue -->
<template>
  <div class="guide">
    <h2>Tell us about yourself 👇</h2>

    <form class="form" @submit.prevent="onSubmit">
      <label>
        Sex:
        <select v-model="sex" required>
          <option value="">-- Select --</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>

      <label>
        Age:
        <input type="number" v-model.number="age" placeholder="Enter your age" min="5" max="100" required />
      </label>

      <label>
        Height (cm):
        <input type="number" v-model.number="height" placeholder="Enter your height" min="80" max="230" required />
      </label>

      <label>
        Weight (kg):
        <input type="number" v-model.number="weight" placeholder="Enter your weight" min="20" max="250" required />
      </label>

      <label>
        Activity level:
        <select v-model="activity" required>
          <option value="">-- Select --</option>
          <option value="sedentary">Sedentary (little or no exercise)</option>
          <option value="light">Light (1-3 days/week)</option>
          <option value="moderate">Moderate (3-5 days/week)</option>
          <option value="active">Active (6-7 days/week)</option>
          <option value="very">Very active (hard exercise)</option>
        </select>
      </label>

      <label>
        Goal:
        <select v-model="goal" required>
          <option value="">-- Select --</option>
          <option value="loss">Lose weight</option>
          <option value="maintain">Maintain</option>
          <option value="gain">Gain weight</option>
        </select>
      </label>

      <label>
        Diet preference (optional):
        <select v-model="diet">
          <option value="">-- None --</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="paleo">Paleo</option>
          <option value="ketogenic">Keto</option>
          <option value="gluten free">Gluten Free</option>
        </select>
      </label>

      <label>
        Exclude (comma separated):
        <input v-model.trim="exclude" placeholder="e.g. shellfish, peanuts" />
      </label>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Generating…' : 'Get Recommendation' }}
      </button>
    </form>

    <p v-if="error" class="err">{{ error }}</p>

    <div v-if="bestPlan" class="result">
      <h3>
        Recommended Plan:
        <span class="plan-title">{{ bestPlan.title }}</span>
      </h3>

      <div class="compare">
        <div>
          <h4>Your Target</h4>
          <p>kcal: <b>{{ targets.kcal }}</b></p>
          <p>protein: <b>{{ targets.protein }}</b> g</p>
          <p>fat: <b>{{ targets.fat }}</b> g</p>
          <p>carbs: <b>{{ targets.carbs }}</b> g</p>
        </div>
        <div>
          <h4>Plan Totals</h4>
          <p>kcal: <b>{{ bestPlan.totals.kcal }}</b></p>
          <p>protein: <b>{{ bestPlan.totals.protein }}</b> g</p>
          <p>fat: <b>{{ bestPlan.totals.fat }}</b> g</p>
          <p>carbs: <b>{{ bestPlan.totals.carbs }}</b> g</p>
        </div>
      </div>

      <div class="meals">
        <h4>Meals</h4>
        <ul>
          <li v-for="m in bestPlan.meals" :key="m.type + '-' + m.id" class="meal">
            <span class="type">{{ m.type }}</span>
            <span class="name">{{ m.name }}</span>
            <span class="macros">
              {{ m.kcal }} kcal · P {{ m.protein }} · F {{ m.fat }} · C {{ m.carbs }}
            </span>
          </li>
        </ul>
      </div>

      <div class="actions">
        <button class="secondary" @click="recalculate">Recalculate</button>
        <button @click="saveDay">Save one day (Add to Planner)</button>
        <button class="primary" @click="saveWeek">Generate a week & add to Planner</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { calcTargets } from '@/stores/targets.js'
import { generateMealPlan, getRecipeInfo } from '@/services/spoonacular.js'
import { usePlanner } from '@/stores/planner'
import { useAuth } from '@/stores/auth'

/** ---- stores ---- */
const plannerStore = usePlanner()
const auth = useAuth()

/** ---- form state ---- */
const sex = ref('')
const age = ref()
const height = ref()
const weight = ref()
const activity = ref('')
const goal = ref('')
const diet = ref('')
const exclude = ref('')

/** ---- outputs ---- */
const targets = ref(null)
const bestPlan = ref(null)
const loading = ref(false)
const error = ref('')

/** ---- helpers ---- */
function extractMacros(info) {
  const arr = info?.nutrition?.nutrients || []
  const find = (name) => arr.find((n) => n.name.toLowerCase() === name.toLowerCase())
  const cal = find('Calories')?.amount ?? 0
  const pro = find('Protein')?.amount ?? 0
  const fat = find('Fat')?.amount ?? 0
  const car = find('Carbohydrates')?.amount ?? 0
  return {
    kcal: Math.round(cal),
    protein: Math.round(pro),
    fat: Math.round(fat),
    carbs: Math.round(car),
  }
}
const toN = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0)
function sumTotals(items) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  for (const r of items) {
    t.kcal += toN(r.kcal)
    t.protein += toN(r.protein)
    t.fat += toN(r.fat)
    t.carbs += toN(r.carbs)
  }
  t.kcal = Math.round(t.kcal)
  t.protein = Math.round(t.protein)
  t.fat = Math.round(t.fat)
  t.carbs = Math.round(t.carbs)
  return t
}

/** ---- main actions ---- */
async function onSubmit () {
  error.value = ''
  bestPlan.value = null

  // 1) 计算目标
  targets.value = calcTargets({
    sex: sex.value,
    age: Number(age.value),
    height: Number(height.value),
    weight: Number(weight.value),
    activity: activity.value,
    goal: goal.value,
  })

  loading.value = true
  try {
    // 2) Cloud Function 生成 1 天餐单
    const day = await generateMealPlan(targets.value.kcal, diet.value || '', exclude.value || '')

    // 3) 拉取每个菜谱的详细营养
    const infos = await Promise.all(day.meals.map((m) => getRecipeInfo(m.id)))
    const meals = day.meals.map((m, idx) => {
      const info = infos[idx]
      const macros = extractMacros(info)
      const type = ['breakfast','lunch','dinner'][idx] || 'snack'
      return { id: m.id, type, name: m.title, ...macros }
    })

    bestPlan.value = {
      title: '1-Day Meal Plan',
      meals,
      totals: sumTotals(meals),
    }
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to generate meal plan.'
  } finally {
    loading.value = false
  }
}

async function recalculate () {
  if (!targets.value) return onSubmit()
  loading.value = true
  error.value = ''
  try {
    const day = await generateMealPlan(targets.value.kcal, diet.value || '', exclude.value || '')
    const infos = await Promise.all(day.meals.map((m) => getRecipeInfo(m.id)))
    const meals = day.meals.map((m, idx) => {
      const info = infos[idx]
      const type = ['breakfast','lunch','dinner'][idx] || 'snack'
      return { id: m.id, type, name: m.title, ...extractMacros(info) }
    })
    bestPlan.value = { title: '1-Day Meal Plan', meals, totals: sumTotals(meals) }
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Recalculate failed.'
  } finally {
    loading.value = false
  }
}

/** ---- Save to Planner ---- */
function saveDay () {
  if (!bestPlan.value) return alert('Please generate a plan first.')

  const dayItem = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: 'day',
    savedAt: new Date().toISOString(),
    title: bestPlan.value.title,
    meals: bestPlan.value.meals,
    totals: bestPlan.value.totals,
    targets: targets.value,
  }

  // ✅ 这里就有 auth 了
  const uid = auth.user?.uid || 'guest'
  plannerStore.addDay(uid, dayItem)
  alert('✅ Saved (one day) to Planner!')
}

// 小工具（用于造一周数据）
function jitter (range = 0.05) {
  const delta = (Math.random() * 2 - 1) * range
  return 1 + delta
}
function cloneMacros (r, factor = 1) {
  return {
    ...r,
    kcal: Math.round(r.kcal * factor),
    protein: Math.round(r.protein * factor),
    fat: Math.round(r.fat * factor),
    carbs: Math.round(r.carbs * factor),
  }
}
function stripId (r) { const { id, ...rest } = r; return rest }

function saveWeek () {
  if (!bestPlan.value) return alert('Please generate a plan first.')
  const base = bestPlan.value.meals
  if (!base.length) return alert('No meals to build from.')

  // ✅ 先定义本函数内部的 days（避免 “days is not defined”）
  const weekDays = []
  const start = new Date()
  for (let d = 0; d < 7; d++) {
    const order = [d % base.length, (d + 1) % base.length, (d + 2) % base.length, (d + 3) % base.length]
    const dayMeals = [
      { type: 'breakfast', ...cloneMacros(base[order[0]], jitter(0.04)) },
      { type: 'lunch',     ...cloneMacros(base[order[1]], jitter(0.05)) },
      { type: 'dinner',    ...cloneMacros(base[order[2]], jitter(0.06)) },
      { type: 'snack',     ...cloneMacros(base[order[3]], jitter(0.03)) },
    ]
    const totals = sumTotals(dayMeals)
    const date = new Date(start); date.setDate(start.getDate() + d)
    weekDays.push({
      date: date.toISOString().slice(0,10),
      meals: dayMeals.map(stripId),
      totals,
    })
  }

  const weekItem = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: 'week',
    title: '7-Day Plan',
    weekStart: weekDays[0].date,
    days: weekDays,            // ← 用我们刚刚定义好的 weekDays
    targets: targets.value,
    savedAt: new Date().toISOString(),
  }

  const uid = auth.user?.uid || 'guest'
  plannerStore.addWeek(uid, weekItem)
  alert('✅ A 7-day plan has been added to Planner!')
}
</script>

<style scoped>
/* 保持你的样式不变 */
.guide{max-width:860px;margin:40px auto 80px;padding:20px;background:#ffffffcc;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.08)}
h2{text-align:center;margin-bottom:16px;color:#2a2a2a}
.form{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px;margin-bottom:18px}
.form label{display:flex;flex-direction:column;gap:6px;font-weight:600;color:#444}
.form input,.form select{padding:9px 10px;border-radius:8px;border:1px solid #d6d6d6;background:#fff}
.form button[type='submit']{grid-column:1 / -1;padding:12px;background:#4caf7a;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;transition:.2s}
.form button[type='submit']:hover{background:#388e5a;transform:scale(1.03)}
.err{color:#c0392b;margin:8px 0}
.result{margin-top:22px}
.plan-title{color:#2f7d56}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0 6px}
.compare>div{background:#f7faf8;border:1px solid #e7efe9;padding:12px;border-radius:10px}
.meals h4{margin:14px 0 8px}
.meal{display:grid;grid-template-columns:90px 1fr auto;gap:8px;padding:8px 0;border-bottom:1px dashed #e6e6e6}
.meal .type{font-weight:700;color:#2f7d56;text-transform:capitalize}
.meal .name{color:#333}
.meal .macros{color:#666;font-variant-numeric:tabular-nums}
.actions{margin-top:16px;display:flex;gap:10px;flex-wrap:wrap}
.actions .secondary{padding:10px 14px;border-radius:8px;border:2px solid #4caf7a;color:#2f7d56;background:#fff;font-weight:700}
.actions .secondary:hover{background:#e9f5ef}
.actions .primary,.actions button:not(.secondary){padding:10px 14px;border-radius:8px;border:none;cursor:pointer;font-weight:700;background:#4caf7a;color:#fff;transition:.2s}
.actions .primary:hover,.actions button:not(.secondary):hover{background:#388e5a;transform:scale(1.03)}
</style>
