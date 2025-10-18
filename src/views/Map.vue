<!-- src/views/Map.vue -->
<template>
  <section class="map-page">
    <div class="toolbar">
      <div class="row">
        <input
          v-model.trim="query"
          class="input"
          type="text"
          placeholder="Search a location (e.g. Clayton, Melbourne, postcode, etc.)"
          @keyup.enter="geocodeAndMove"
        />
        <button class="btn" :disabled="loading" @click="geocodeAndMove">
          {{ loading ? 'Locating…' : 'Go' }}
        </button>

        <button class="btn-outline" :disabled="loading" @click="locateMe">
          Use my location
        </button>

        <button class="btn-outline" :disabled="loading" @click="searchHere">
          Search this area
        </button>
      </div>

      <div class="row wrap">
        <label class="inline">
          Radius:
          <select v-model.number="radiusMeters" class="select">
            <option :value="500">0.5 km</option>
            <option :value="1000">1 km</option>
            <option :value="2000">2 km</option>
            <option :value="3000">3 km</option>
            <option :value="5000">5 km</option>
          </select>
        </label>

        <div class="checks">
          <label v-for="c in allCats" :key="c.key" class="check">
            <input type="checkbox" v-model="c.enabled" />
            {{ c.label }}
          </label>
        </div>

        <div class="route-tools">
          <label class="mode">
            Mode:
            <select v-model="travelMode">
              <option value="walking">Walking</option>
              <option value="cycling">Cycling</option>
              <option value="driving">Driving</option>
            </select>
          </label>
          <button class="btn-outline" @click="clearRoute" :disabled="!routeLayer">
            Clear route
          </button>
          <span class="route-tip" v-if="routeInfo">{{ routeInfo }}</span>
        </div>

        <span v-if="error" class="err">{{ error }}</span>
      </div>
    </div>

    <div class="content">
      <aside class="list">
        <div class="list-head">
          <strong>{{ results.length }}</strong> results
          <span v-if="centerText" class="muted">around {{ centerText }}</span>
        </div>

        <div v-if="loading" class="loading">Searching nearby places…</div>
        <div v-else-if="!results.length" class="empty">No results. Try a different radius or place types.</div>

        <ul v-else class="cards">
          <li v-for="r in results" :key="r.id" class="card">
            <div class="title">
              <span class="name">{{ r.name || 'Unnamed place' }}</span>
              <span class="badge">{{ r.typeLabel }}</span>
            </div>
            <div class="line">
              <span class="muted">{{ r.address || 'Address unknown' }}</span>
            </div>
            <div class="line">
              <span class="muted">{{ (r.distance/1000).toFixed(2) }} km away</span>
            </div>
            <div class="actions">
              <a
                class="link"
                :href="`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`"
                target="_blank"
                rel="noopener"
              >Open in Google Maps</a>
              <a
                class="link"
                :href="`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.name || 'Grocery')}&destination=${r.lat},${r.lng}`"
                target="_blank"
                rel="noopener"
              >Directions</a>
              <button class="btn-mini" @click="flyTo(r)">Show on map</button>
              <button class="btn-mini primary" @click="drawRouteTo(r)">Route</button>
            </div>
          </li>
        </ul>
      </aside>

      <div class="map-wrap">
        <div ref="mapEl" class="map" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, watchEffect } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ---------- UI 状态 ---------- */
const query = ref('')
const loading = ref(false)
const error = ref('')

/* 半径（米） */
const radiusMeters = ref(2000)

/* POI 类型（可勾选） */
const allCats = ref([
  { key: 'supermarket', label: 'Supermarket', enabled: true,  tag: 'shop=supermarket' },
  { key: 'convenience', label: 'Convenience', enabled: true,  tag: 'shop=convenience' },
  { key: 'greengrocer', label: 'Greengrocer', enabled: true,  tag: 'shop=greengrocer' },
  { key: 'bakery',      label: 'Bakery',      enabled: false, tag: 'shop=bakery' },
  { key: 'butcher',     label: 'Butcher',     enabled: false, tag: 'shop=butcher' },
])

/* 地图与结果 */
const mapEl = ref(null)
let map, centerMarker, circle
let markersLayer = L.layerGroup()
const centerLatLng = ref({ lat: -37.8136, lng: 144.9631 }) // 默认墨尔本 CBD
const centerText = ref('')
const results = ref([])

/* 路线相关 */
const travelMode = ref('walking')      // walking / cycling / driving
const routeLayer = ref(null)           // L.GeoJSON
const routeInfo = ref('')              // 距离 + 预估时间
const userLatLng = ref(null)           // 定位后填充

/* ---------- 工具函数 ---------- */
function setError(msg) {
  error.value = msg || ''
  if (msg) console.error('[Map]', msg)
}

function computeDistanceMeters(a, b) {
  return map ? map.distance([a.lat, a.lng], [b.lat, b.lng]) : 0
}

/* 把 OSM 节点/面 转成我们需要的对象 */
function nodeToPlace(n) {
  const name = n.tags?.name || ''
  const addrParts = [
    n.tags?.['addr:housenumber'],
    n.tags?.['addr:street'],
    n.tags?.['addr:suburb'],
    n.tags?.['addr:city'],
    n.tags?.['addr:state'],
    n.tags?.['addr:postcode'],
  ].filter(Boolean)
  const address = addrParts.join(', ')
  const lat = n.lat ?? n.center?.lat
  const lng = n.lon ?? n.center?.lon
  let typeLabel = 'Grocery'
  const tagKeys = ['shop', 'amenity']
  for (const k of tagKeys) {
    if (n.tags?.[k]) { typeLabel = n.tags[k]; break }
  }
  return { id: n.id, name, address, lat, lng, typeLabel }
}

/* ---------- Overpass 查询 ---------- */
const overpassEndpoints = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
  'https://overpass-api.nextzen.org/api/interpreter',
]

function buildOverpassQuery(lat, lng, radius, selectedTags) {
  const parts = selectedTags.map(tag => `
    node(around:${radius},${lat},${lng})[${tag}];
    way(around:${radius},${lat},${lng})[${tag}];
    relation(around:${radius},${lat},${lng})[${tag}];
  `).join('\n')

  return `
    [out:json][timeout:25];
    (
      ${parts}
    );
    out center tags;
  `
}

async function queryOverpass(lat, lng) {
  const selected = allCats.value.filter(c => c.enabled).map(c => c.tag)
  if (!selected.length) {
    setError('Please select at least one place type.')
    return []
  }
  const q = buildOverpassQuery(lat, lng, radiusMeters.value, selected)

  for (const ep of overpassEndpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: q })
      })
      if (!res.ok) throw new Error(`Overpass ${res.status}`)
      const data = await res.json()
      return data?.elements || []
    } catch (e) {
      console.warn('[Overpass] fallback to next endpoint', ep, e)
    }
  }
  throw new Error('All Overpass endpoints failed. Please try again later.')
}

/* ---------- Nominatim 地理编码（免密钥） ---------- */
async function geocode(text) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', text)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '1')
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error(`Geocoding failed ${res.status}`)
  const arr = await res.json()
  if (!arr.length) throw new Error('No results for the place you entered.')
  const hit = arr[0]
  const center = { lat: Number(hit.lat), lng: Number(hit.lon) }
  const label = hit.display_name
  return { center, label }
}

/* ---------- 地图交互 ---------- */
function updateCenter(latlng, label = '') {
  centerLatLng.value = { lat: latlng.lat, lng: latlng.lng }
  centerText.value = label
  if (!centerMarker) {
    centerMarker = L.marker(latlng, { draggable: true })
      .addTo(map)
      .bindPopup('Search center (drag me)')
    centerMarker.on('dragend', () => {
      const ll = centerMarker.getLatLng()
      drawCenterCircle(ll)
    })
  } else {
    centerMarker.setLatLng(latlng)
  }
  drawCenterCircle(latlng)
  map.flyTo(latlng, Math.max(14, map.getZoom()))
}

function drawCenterCircle(latlng) {
  if (circle) circle.remove()
  circle = L.circle(latlng, { radius: radiusMeters.value, color: '#2f7d56', weight: 1 })
  circle.addTo(map)
}

/* 渲染结果 */
function renderResults(list) {
  markersLayer.clearLayers()
  const places = list
    .map(nodeToPlace)
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map(p => ({ ...p, distance: computeDistanceMeters(centerLatLng.value, p) }))
    .sort((a, b) => a.distance - b.distance)

  results.value = places

  places.forEach(p => {
    const marker = L.marker([p.lat, p.lng])
      .bindPopup(`
        <div><strong>${p.name || 'Unnamed place'}</strong></div>
        <div>${p.typeLabel || ''}</div>
        <div style="margin-top:4px;color:#666">${p.address || ''}</div>
        <div style="margin-top:6px">
          <a href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}" target="_blank" rel="noopener">Open in Google Maps</a>
        </div>
      `)
    markersLayer.addLayer(marker)
  })
  markersLayer.addTo(map)
}

async function searchAt(latlng) {
  loading.value = true
  setError('')
  try {
    updateCenter(latlng, centerText.value)
    const elements = await queryOverpass(latlng.lat, latlng.lng)
    renderResults(elements)
  } catch (e) {
    setError(e.message || String(e))
  } finally {
    loading.value = false
  }
}

/* 事件：按输入的地点定位 */
async function geocodeAndMove() {
  if (!query.value) return
  loading.value = true
  setError('')
  try {
    const { center, label } = await geocode(query.value)
    centerText.value = label
    updateCenter(center, label)
    await searchAt(center)
  } catch (e) {
    setError(e.message || String(e))
  } finally {
    loading.value = false
  }
}

/* 事件：用当前地图中心搜索 */
async function searchHere() {
  await searchAt(map.getCenter())
}

/* 事件：浏览器定位 */
function locateMe() {
  setError('')
  loading.value = true
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const center = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    userLatLng.value = center
    centerText.value = 'your location'
    updateCenter(center, centerText.value)
    await searchAt(center)
    loading.value = false
  }, async () => {
    await searchAt(centerLatLng.value)
    loading.value = false
  }, { enableHighAccuracy: true, timeout: 8000 })
}

/* 列表按钮 */
function flyTo(p) { map.flyTo([p.lat, p.lng], 17) }

/* 半径变化时，更新圆 */
watchEffect(() => {
  if (map && centerMarker) {
    drawCenterCircle(centerMarker.getLatLng())
  }
})

/* ---------- 路由绘制（OSRM） ---------- */
async function drawRouteTo(place) {
  try {
    const to = place?.lat && place?.lng ? { lat: place.lat, lng: place.lng } : null
    if (!to) return

    const fromLL = userLatLng.value || map.getCenter()
    const from = { lat: fromLL.lat, lng: fromLL.lng }

    const mode = travelMode.value // walking | cycling | driving
    const url =
      `https://router.project-osrm.org/route/v1/${mode}/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson&steps=false`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const data = await res.json()
    if (!data?.routes?.length) throw new Error('No route found')

    const route = data.routes[0]
    const geo = route.geometry

    if (routeLayer.value) {
      map.removeLayer(routeLayer.value)
      routeLayer.value = null
    }
    // @ts-ignore
    routeLayer.value = L.geoJSON(geo, {
      style: { color: '#2f7d56', weight: 5, opacity: 0.9 }
    }).addTo(map)
    // @ts-ignore
    map.fitBounds(routeLayer.value.getBounds(), { padding: [30, 30] })

    const km = (route.distance / 1000).toFixed(2)
    const min = Math.round(route.duration / 60)
    routeInfo.value = `Route: ${km} km • ~${min} min (${mode})`
  } catch (e) {
    console.error(e)
    routeInfo.value = 'Failed to get route. Please try another mode or place.'
  }
}

function clearRoute() {
  if (routeLayer.value) {
    map.removeLayer(routeLayer.value)
    routeLayer.value = null
  }
  routeInfo.value = ''
}

/* ---------- 地图初始化 ---------- */
onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: true, scrollWheelZoom: true })
        .setView([centerLatLng.value.lat, centerLatLng.value.lng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
  }).addTo(map)

  locateMe()
})
</script>

<style scoped>
.map-page{max-width:1200px;margin:0 auto;padding:16px}
.toolbar{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:12px 14px;margin-bottom:14px}
.row{display:flex;gap:8px;align-items:center}
.row.wrap{flex-wrap:wrap;margin-top:8px}
.inline{display:flex;align-items:center;gap:6px}
.input{flex:1;min-width:260px;padding:10px 12px;border:1px solid #d9e3dd;border-radius:10px}
.select{padding:8px;border:1px solid #d9e3dd;border-radius:8px;background:#fff}
.checks{display:flex;gap:10px;flex-wrap:wrap}
.check{display:flex;align-items:center;gap:6px;background:#f7faf8;border:1px solid #e3efe7;padding:6px 10px;border-radius:999px}
.err{color:#c0392b;margin-left:auto}

.route-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-left:auto}
.route-tools .mode select{padding:6px 8px;border:1px solid #e0e0e0;border-radius:8px;background:#fff}
.route-tip{color:#2f7d56;font-weight:700}

.content{display:grid;grid-template-columns:360px 1fr;gap:14px}
.list{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:12px 14px;min-height:540px}
.list-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.list-head .muted{color:#6b7280}
.loading,.empty{color:#6b7280}
.cards{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.card{border:1px solid #e7efe9;border-radius:10px;padding:10px 12px}
.title{display:flex;align-items:center;gap:8px}
.name{font-weight:700}
.badge{font-size:.75rem;background:#eef7f0;color:#2f7d56;border:1px solid #cfe9d9;border-radius:999px;padding:2px 8px}
.line{color:#374151;margin-top:4px}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.link{color:#2563eb;text-decoration:none}
.link:hover{text-decoration:underline}

.map-wrap{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:8px}
.map{width:100%;height:600px;border-radius:8px}

/* buttons */
.btn,.btn-outline,.btn-mini{padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer}
.btn{background:#2f7d56;color:#fff;border:0}
.btn:hover{background:#256b49}
.btn-outline{background:#fff;border:2px solid #2f7d56;color:#2f7d56}
.btn-outline:hover{background:#2f7d56;color:#fff}
.btn-mini{padding:6px 10px;border:1px solid #cfe9d9;background:#f7faf8;border-radius:8px}
.btn-mini.primary{background:#2f7d56;color:#fff;border:0}

@media (max-width: 1024px){
  .content{grid-template-columns:1fr}
  .list{order:2}
  .map-wrap{order:1}
  .map{height:520px}
}
</style>
