<template>
  <div class="guide">
    <h2>Tell us about yourself 👇</h2>

    <!-- 表单 -->
    <form class="form" @submit.prevent="submitForm">
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

      <button type="submit">Get Recommendation</button>
    </form>

    <!-- 推荐结果 -->
    <div v-if="bestPlan" class="result">
      <h3>Recommended Plan: <span class="plan-title">{{ bestPlan.title }}</span></h3>

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
          <li v-for="m in expandedMeals" :key="m.type" class="meal">
            <span class="type">{{ m.type }}</span>
            <span class="name">{{ m.recipe.name }}</span>
            <span class="macros">
              {{ m.recipe.kcal }} kcal · P {{ m.recipe.protein }} · F {{ m.recipe.fat }} · C {{ m.recipe.carbs }}
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
import { ref, computed, onMounted } from 'vue'
import { calcTargets } from '@/stores/targets.js'

// ------- 基本表单状态 -------
const sex = ref('')
const age = ref()
const height = ref()
const weight = ref()
const activity = ref('')
const goal = ref('')

// ------- 数据源 -------
const recipes = ref([])     // /public/recipes.json
const plans = ref([])       // /public/meal-plans.json

// ------- 计算结果 -------
const targets = ref(null)   // {kcal, protein, fat, carbs}
const bestPlan = ref(null)  // 选中的 meal plan（包含 totals / meals / title / id）

// 展开 meals，把 recipeId 映射为完整配方
const expandedMeals = computed(() => {
  if (!bestPlan.value) return []
  const map = new Map(recipes.value.map(r => [r.id, r]))
  return bestPlan.value.meals.map(m => ({
    ...m,
    recipe: map.get(m.recipeId) || { name: 'Unknown', kcal: 0, protein: 0, fat: 0, carbs: 0 }
  }))
})

// 载入 JSON
onMounted(async () => {
  const [r1, r2] = await Promise.all([
    fetch('/recipes.json').then(r => r.json()),
    fetch('/meal-plans.json').then(r => r.json())
  ])
  recipes.value = r1
  plans.value = r2
})

// 评分：和目标的“距离”
function scoreDistance(target, planTotals) {
  const w = { kcal: 1.0, protein: 2.0, fat: 1.0, carbs: 1.0 }
  return (
    w.kcal    * Math.abs(planTotals.kcal    - target.kcal)   +
    w.protein * Math.abs(planTotals.protein - target.protein)+
    w.fat     * Math.abs(planTotals.fat     - target.fat)    +
    w.carbs   * Math.abs(planTotals.carbs   - target.carbs)
  )
}

// 计算推荐
function submitForm() {
  targets.value = calcTargets({
    sex: sex.value,
    age: Number(age.value),
    height: Number(height.value),
    weight: Number(weight.value),
    activity: activity.value,
    goal: goal.value
  })

  let best = null
  let bestScore = Infinity
  for (const p of plans.value) {
    const s = scoreDistance(targets.value, p.totals)
    if (s < bestScore) {
      bestScore = s
      best = p
    }
  }
  bestPlan.value = best
}

// 重新匹配（不变）
function recalculate() {
  if (!targets.value) return submitForm()
  let best = null
  let bestScore = Infinity
  for (const p of plans.value) {
    const s = scoreDistance(targets.value, p.totals)
    if (s < bestScore) {
      bestScore = s
      best = p
    }
  }
  bestPlan.value = best
}

// 保存“单日”到 Planner
function saveDay() {
  if (!bestPlan.value) return alert('Please generate a plan first.')
  const key = 'planner'
  const prev = JSON.parse(localStorage.getItem(key) || '[]')
  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: 'day',
    savedAt: new Date().toISOString(),
    planId: bestPlan.value.id,
    title: bestPlan.value.title,
    meals: bestPlan.value.meals,
    totals: bestPlan.value.totals,
    targets: targets.value
  }
  localStorage.setItem(key, JSON.stringify([item, ...prev]))
  alert('✅ Saved (one day) to Planner!')
}

// 生成“7 天”并保存到 Planner
function saveWeek() {
  if (!bestPlan.value) return alert('Please generate a plan first.')

  // 把单日 meals 轮换/轻微扰动 → 7 天
  const baseMeals = expandedMeals.value.map(m => m.recipe) // 直接拿展开后的真实配方对象
  if (baseMeals.length === 0) return alert('No meals to build from.')

  const days = []
  const start = new Date()
  for (let d = 0; d < 7; d++) {
    // 轮换顺序（让每天看起来不同）
    const order = [d % 4, (d + 1) % 4, (d + 2) % 4, (d + 3) % 4]
    const dayMeals = [
      { type: 'breakfast', recipe: cloneMacros(baseMeals[order[0]], jitter(0.03)) },
      { type: 'lunch',     recipe: cloneMacros(baseMeals[order[1]], jitter(0.04)) },
      { type: 'dinner',    recipe: cloneMacros(baseMeals[order[2]], jitter(0.05)) },
      { type: 'snack',     recipe: cloneMacros(baseMeals[order[3]], jitter(0.02)) },
    ]
    const totals = sumTotals(dayMeals.map(m => m.recipe))
    const date = new Date(start); date.setDate(start.getDate() + d)
    days.push({
      date: date.toISOString().slice(0, 10),
      meals: dayMeals.map(m => ({ type: m.type, recipe: stripId(m.recipe) })),
      totals
    })
  }

  const key = 'planner'
  const prev = JSON.parse(localStorage.getItem(key) || '[]')
  const weekItem = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: 'week',
    title: `${bestPlan.value.title} — 7-Day Plan`,
    weekStart: days[0].date,
    days,
    targets: targets.value,
    savedAt: new Date().toISOString()
  }
  localStorage.setItem(key, JSON.stringify([weekItem, ...prev]))
  alert('✅ A 7-day plan has been added to Planner!')
}

// —— 辅助函数 ——

// 复制配方并按比例微调宏（±几 %），返回新对象
function cloneMacros(recipe, factor = 1) {
  const r = { ...recipe }
  // 只对能数值化的宏做微扰，不改名字/描述
  r.kcal    = Math.round(r.kcal    * factor)
  r.protein = Math.round(r.protein * factor)
  r.fat     = Math.round(r.fat     * factor)
  r.carbs   = Math.round(r.carbs   * factor)
  return r
}

// factor 生成器（例如 jitter(0.05) → 0.95~1.05 之间）
function jitter(range = 0.03) {
  const delta = (Math.random() * 2 - 1) * range
  return 1 + delta
}

function sumTotals(recipes) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  for (const r of recipes) {
    t.kcal    += toN(r.kcal)
    t.protein += toN(r.protein)
    t.fat     += toN(r.fat)
    t.carbs   += toN(r.carbs)
  }
  t.kcal    = Math.round(t.kcal)
  t.protein = Math.round(t.protein)
  t.fat     = Math.round(t.fat)
  t.carbs   = Math.round(t.carbs)
  return t
}

const toN = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0)

// 去掉 id 字段（避免把公共 recipes 的 id 写进本地实例，保持纯粹）
function stripId(r) {
  const { id, ...rest } = r
  return rest
}
</script>

<style scoped>
.guide {
  max-width: 680px;
  margin: 40px auto 80px;
  padding: 20px;
  background: #ffffffcc;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
}

h2 { text-align: center; margin-bottom: 16px; color: #2a2a2a; }

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
  margin-bottom: 18px;
}
.form label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; color: #444; }
.form input, .form select {
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid #d6d6d6;
  background: #fff;
}
.form button[type="submit"] {
  grid-column: 1 / -1;
  padding: 12px;
  background: #4caf7a;
  color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;
  transition: .2s;
}
.form button[type="submit"]:hover { background:#388e5a; transform: scale(1.03); }

.result { margin-top: 22px; }
.plan-title { color:#2f7d56; }

.compare {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0 6px;
}
.compare > div {
  background: #f7faf8; border: 1px solid #e7efe9; padding: 12px; border-radius: 10px;
}

.meals h4 { margin: 14px 0 8px; }
.meal { display: grid; grid-template-columns: 90px 1fr auto; gap: 8px; padding: 8px 0; border-bottom: 1px dashed #e6e6e6; }
.meal .type { font-weight: 700; color:#2f7d56; text-transform: capitalize; }
.meal .name { color:#333; }
.meal .macros { color:#666; font-variant-numeric: tabular-nums; }

.actions { margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap; }
.actions .secondary {
  padding: 10px 14px; border-radius: 8px; border: 2px solid #4caf7a; color:#2f7d56; background:#fff; font-weight:700;
}
.actions .secondary:hover { background:#e9f5ef; }
.actions .primary,
.actions button:not(.secondary) {
  padding: 10px 14px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700;
  background:#4caf7a; color:#fff; transition:.2s;
}
.actions .primary:hover,
.actions button:not(.secondary):hover { background:#388e5a; transform: scale(1.03); }
</style>
