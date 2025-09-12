<!-- src/views/Home.vue -->
<template>
  <!-- Hero -->
  <section class="hero">
    <div class="content">
      <h1>Eat better, live better!</h1>
      <p class="subtitle">Welcome to the Nutrition Planner App 🎉</p>
      <div class="home-cta">
        <RouterLink to="/guide" class="btn">Guide</RouterLink>
        <RouterLink to="/planner" class="btn">Planner</RouterLink>
      </div>
    </div>
  </section>

  <!-- About -->
  <section class="about">
    <h2>Why Nutrition Matters</h2>
    <p>
      At <strong>Nutrition Planner</strong>, we believe that healthy eating should be simple,
      personalized, and enjoyable. Our mission is to provide you with smart daily meal
      recommendations tailored to your age, body, and lifestyle, so you can fuel your day with
      confidence and energy. 🌱
    </p>
    <p>
      Balanced nutrition is the foundation of good health — it helps boost your energy, supports
      your immune system, and even improves focus and mood. Whether your goal is to stay fit, build
      strength, or simply feel your best, a thoughtful meal plan is the key to long-term wellness. 💪
    </p>
  </section>

  <!-- Rating -->
  <section class="rating">
    <h3>Rate this App</h3>

    <div class="avg">
      <strong>{{ avg.toFixed(1) }}</strong> / 5
      <span class="count">({{ ratings.length }} ratings)</span>
    </div>

    <div class="stars readonly" aria-label="Average rating">
      <span v-for="n in 5" :key="'avg'+n" :class="{ on: n <= Math.round(avg) }">★</span>
    </div>

    <form class="rate-form" @submit.prevent="submit">
      <div class="stars" role="radiogroup" aria-label="Your rating">
        <label v-for="n in 5" :key="n" :aria-label="n + ' star'">
          <input type="radio" name="score" :value="n" v-model.number="score" />
          <span :class="{ on: n <= score }">★</span>
        </label>
      </div>

      <textarea
        v-model.trim="note"
        placeholder="Optional: leave a short comment (max 140 chars)…"
        maxlength="140"
      ></textarea>

      <!-- 错误 / 成功信息 -->
      <p v-if="invalidReason" class="msg error" role="alert">{{ invalidReason }}</p>
      <p v-else-if="msg" class="msg ok">{{ msg }}</p>

      <button class="btn" :disabled="!canSubmit">Submit</button>
    </form>

    <!-- 最近 5 条评论（纯文本渲染） -->
    <ul v-if="ratings.length" class="recent">
      <li v-for="(r, i) in recentFive" :key="i">
        <span class="mini-stars" aria-hidden="true">
          <span v-for="n in 5" :key="n" :class="{ on: n <= r.score }">★</span>
        </span>
        <span class="cmt" v-text="r.note" />
        <span class="meta">· {{ new Date(r.at).toLocaleString() }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const LS_KEY = 'np_ratings'

const ratings = ref([])   // { score:1..5, note, at, by }
const score   = ref(0)
const note    = ref('')
const msg     = ref('')

// 1) 禁止的字符集合：出现即报错、禁用提交
const FORBIDDEN = /[<>{}\[\]()`'",&]/   // < > & { } [ ] ( ) ` ' " , &（含逗号可按需移除）

// 2) 仅用于存储前的保险性转义，防止意外注入（即使禁用也再净化一次）
function sanitizeText (s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .slice(0, 140)
}

onMounted(() => {
  try { ratings.value = JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { ratings.value = [] }
})

const avg = computed(() => {
  if (!ratings.value.length) return 0
  const s = ratings.value.reduce((a, b) => a + (+b.score || 0), 0)
  return s / ratings.value.length
})

const recentFive   = computed(() => ratings.value.slice(0, 5))

// 3) 实时校验理由（有内容才校验；允许空评语）
const invalidReason = computed(() => {
  const raw = note.value ?? ''
  if (!raw) return ''                  // 空备注允许
  if (raw.length > 140) return 'Comment exceeds 140 characters'
  if (FORBIDDEN.test(raw)) {
    return 'Comment contains illegal characters: <, >, &, { }, [ ], ( ), `, \', "'
  }
  return ''
})

// 4) 提交条件：评分已选 + 无错误
const canSubmit = computed(() => !!score.value && !invalidReason.value)

function submit () {
  msg.value = ''

  // 再次严格校验（双保险）
  const reason = invalidReason.value
  if (!score.value || reason) {
    return
  }

  const item = {
    score: Math.max(1, Math.min(5, Number(score.value))),
    note: sanitizeText(note.value),     // 存储前仍做转义
    at: new Date().toISOString(),
    by: auth.user?.uid || 'guest'
  }

  const next = [item, ...ratings.value]
  ratings.value = next
  localStorage.setItem(LS_KEY, JSON.stringify(next))

  score.value = 0
  note.value  = ''
  msg.value   = 'Thanks for the feedback!'
}
</script>

<style scoped>
/* ====== Hero ====== */
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
  min-height: 30vh;
  padding-top: 60px;
}
.content { max-width: 600px; }
h1 { font-size: 2.5rem; color: #2a2a2a; margin-bottom: 12px; }
.subtitle { font-size: 1.2rem; color: #555; margin-bottom: 24px; }
.home-cta { display: flex; justify-content: center; gap: 40px; }
.btn {
  padding: 12px 24px; border-radius: 8px; font-weight: 600;
  background: #4caf7a; color: #fff; text-decoration: none; transition: .2s;
}
.btn:hover { background: #388e5a; transform: scale(1.05); }

/* ====== About ====== */
.about { max-width: 800px; margin: 40px auto; text-align: center; padding: 0 20px; }
.about h2 { font-size: 1.8rem; margin-bottom: 16px; color: #2a2a2a; }
.about p { font-size: 1rem; color: #444; line-height: 1.6; margin-bottom: 16px; }

/* ====== Rating ====== */
.rating {
  max-width: 680px; margin: 32px auto; padding: 16px;
  border-radius: 12px; background:#ffffffcc; box-shadow:0 4px 16px rgba(0,0,0,.06);
}
.rating h3 { margin: 0 0 8px; }
.avg { font-size: 1.25rem; margin-bottom: 4px; }
.count { color: #666; font-size: .95rem; margin-left: 6px; }

.stars { display: inline-flex; gap: 6px; font-size: 28px; user-select: none; }
.stars.readonly span { pointer-events: none; }
.stars span { color: #bbb; transition: .15s; }
.stars span.on { color: #f6b400; }
.stars label { cursor: pointer; }
.stars input { display: none; }

.rate-form { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; }
textarea {
  width: 100%; min-height: 80px; padding: 10px;
  border: 1px solid #ddd; border-radius: 8px; resize: vertical;
}

.msg { margin: -4px 0 2px; font-size: .95rem; }
.msg.ok { color: #2f7d56; }
.msg.error { color: #c62828; }

.recent { margin-top: 12px; padding-left: 0; list-style: none; display: grid; gap: 8px; }
.recent li { display: flex; align-items: center; gap: 8px; color:#333; }
.mini-stars { display:inline-flex; gap:3px; font-size:16px; }
.mini-stars span { color:#bbb; }
.mini-stars span.on { color:#f6b400; }
.cmt { white-space: pre-wrap; word-break: break-word; }
.meta { color:#777; font-size:.85rem; }
</style>
