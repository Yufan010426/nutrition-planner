<template>
  <section style="padding:16px">
    <h2>Meal Count (by user)</h2>
    <div style="margin:12px 0">
      <label>UID:
        <input v-model="uid" placeholder="uid..." />
      </label>
      <button @click="load">Refresh</button>
    </div>
    <p v-if="loading">Loading…</p>
    <p v-else>Count: <b>{{ count }}</b></p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const API = import.meta.env.VITE_API_BASE
const uid = ref('test-user-1')        // 这里填你测试用的 uid
const count = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const r = await fetch(`${API}/mealCount?uid=${encodeURIComponent(uid.value)}`)
    const data = await r.json()
    count.value = data.count ?? 0
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
