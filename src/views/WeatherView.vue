<template>
  <section class="weather">
    <h2>Current Weather (by your location)</h2>

    <div v-if="loading" class="info">Locating & fetching weather…</div>
    <div v-else-if="error" class="error">Failed to fetch weather. Please check your API key or network.</div>

    <div v-else-if="weather" class="card">
      <h3>{{ weather.name }}, {{ weather.sys?.country }}</h3>
      <div class="row">
        <img v-if="iconUrl" :src="iconUrl" alt="Weather Icon" />
        <div>
          <p class="temp">{{ temperature }} °C</p>
          <p>{{ weather.weather?.[0]?.description }}</p>
        </div>
      </div>
    </div>

    <pre class="raw" v-if="weather">{{ weather }}</pre>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(true)
const error = ref(false)
const weather = ref(null)

const temperature = computed(() => {
  if (!weather.value) return ''
  // OpenWeather 返回开尔文，这里转摄氏
  return Math.round((weather.value.main?.temp ?? 0) - 273.15)
})

const iconUrl = computed(() => {
  const code = weather.value?.weather?.[0]?.icon
  return code ? `https://openweathermap.org/img/w/${code}.png` : ''
})

onMounted(() => {
  getWeather()
})

async function getWeather() {
  try {
    error.value = false
    loading.value = true

    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported')
    }

    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    const { latitude, longitude } = pos.coords
    const key = import.meta.env.VITE_OWM_KEY
    if (!key) throw new Error('Missing VITE_OWM_KEY')

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${key}`
    const res = await axios.get(url)
    weather.value = res.data
  } catch (e) {
    console.error(e)
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.weather{max-width:720px;margin:24px auto;background:#fff8;padding:16px;border-radius:12px}
.info{padding:10px;border-radius:8px;background:#f3f7ff;border:1px solid #cfe0ff}
.error{padding:10px;border-radius:8px;background:#ffecec;border:1px solid #ffb3b3;color:#c0392b}
.card{background:#fff;border:1px solid #eee;border-radius:12px;padding:12px}
.row{display:flex;gap:12px;align-items:center}
.temp{font-size:28px;font-weight:800;margin:0}
.raw{margin-top:12px;background:#f7f7f7;border:1px solid #eee;border-radius:8px;padding:8px;white-space:pre-wrap}
</style>
