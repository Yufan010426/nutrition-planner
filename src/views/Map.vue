<!-- src/views/Map.vue (AA-ready) -->
<template>
  <main id="main" class="map-page" role="main" aria-labelledby="map-title">
    <h1 id="map-title" class="sr-only">Find nearby grocery places and routes</h1>

    <form class="toolbar" role="search" @submit.prevent="geocodeAndMove" aria-describedby="search-help">
      <div class="row">
        <label class="sr-only" for="q">Search a location</label>
        <input
          id="q"
          v-model.trim="query"
          class="input"
          type="text"
          autocomplete="off"
          placeholder="Search a location (e.g. Clayton, Melbourne, postcode, etc.)"
          @keyup.enter="geocodeAndMove"
          :aria-describedby="'search-help'"
        />
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Locating…' : 'Go' }}
        </button>

        <button class="btn-outline" type="button" :disabled="loading" @click="locateMe">
          Use my location
        </button>

        <button class="btn-outline" type="button" :disabled="loading" @click="searchHere">
          Search this area
        </button>
      </div>

      <p id="search-help" class="muted sr-only">
        Type a place name, city or postcode. Press Enter to search.
      </p>

      <div class="row wrap" role="group" aria-label="Search filters">
        <label class="inline" for="radius">
          Radius:
        </label>
        <select id="radius" v-model.number="radiusMeters" class="select" aria-label="Search radius">
          <option :value="500">0.5 km</option>
          <option :value="1000">1 km</option>
          <option :value="2000">2 km</option>
          <option :value="3000">3 km</option>
          <option :value="5000">5 km</option>
        </select>

        <fieldset class="checks" aria-label="Place types">
          <legend class="sr-only">Place types</legend>
          <label v-for="c in allCats" :key="c.key" class="check">
            <input :id="`cat-${c.key}`" type="checkbox" v-model="c.enabled" />
            {{ c.label }}
          </label>
        </fieldset>

        <div class="route-tools" role="group" aria-label="Routing tools">
          <label class="mode" for="mode">Mode:</label>
          <select id="mode" v-model="travelMode" aria-label="Travel mode">
            <option value="walking">Walking</option>
            <option value="cycling">Cycling</option>
            <option value="driving">Driving</option>
          </select>
          <button class="btn-outline" type="button" @click="clearRoute" :disabled="!routeLayer">
            Clear route
          </button>

          <span class="route-tip" role="status" aria-live="polite" v-if="routeInfo">{{ routeInfo }}</span>
        </div>

        <span v-if="error" class="err" role="alert" aria-live="assertive">{{ error }}</span>
      </div>
    </form>

    <div class="content">
      <aside class="list" role="region" aria-labelledby="results-title">
        <h2 id="results-title" class="list-head">
          <strong aria-live="polite">{{ results.length }}</strong> results
          <span v-if="centerText" class="muted">around {{ centerText }}</span>
        </h2>

        <div v-if="loading" class="loading" role="status" aria-live="polite">Searching nearby places…</div>
        <div v-else-if="!results.length" class="empty">No results. Try a different radius or place types.</div>

        <ul v-else class="cards">
          <li v-for="r in results" :key="r.id" class="card">
            <h3 class="title" :id="`place-${r.id}`">
              <span class="name">{{ r.name || 'Unnamed place' }}</span>
              <span class="badge">{{ r.typeLabel }}</span>
            </h3>

            <p class="line">
              <span class="muted">{{ r.address || 'Address unknown' }}</span>
            </p>
            <p class="line">
              <span class="muted">{{ (r.distance/1000).toFixed(2) }} km away</span>
            </p>

            <div class="actions" :aria-labelledby="`place-${r.id}`">
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
              <button class="btn-mini" type="button" @click="flyTo(r)">Show on map</button>
              <button class="btn-mini primary" type="button" @click="drawRouteTo(r)">Route</button>
            </div>
          </li>
        </ul>
      </aside>

      <div class="map-wrap">
        <div
          ref="mapEl"
          class="map"
          role="img"
          aria-label="Map showing search center and nearby places"
          :aria-describedby="'map-desc'"
        />
        <p id="map-desc" class="sr-only">
          The map displays OpenStreetMap tiles, a draggable green center marker and a circle for the search radius.
        </p>
        <button class="btn-outline sr-only-focus" type="button" @click="focusMapCanvas">
          Focus map
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref, watchEffect, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import marker1x from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const query = ref('')
const loading = ref(false)
const error = ref('')

const radiusMeters = ref(2000)

const allCats = ref([
  { key: 'supermarket', label: 'Supermarket', enabled: true,  tag: 'shop=supermarket' },
  { key: 'convenience', label: 'Convenience', enabled: true,  tag: 'shop=convenience' },
  { key: 'greengrocer', label: 'Greengrocer', enabled: true,  tag: 'shop=greengrocer' },
  { key: 'bakery',      label: 'Bakery',      enabled: false, tag: 'shop=bakery' },
  { key: 'butcher',     label: 'Butcher',     enabled: false, tag: 'shop=butcher' },
])

const mapEl = ref(null)
let map, centerMarker, circle
let markersLayer = L.layerGroup()
const centerLatLng = ref({ lat: -37.8136, lng: 144.9631 }) 
const centerText = ref('')
const results = ref([])

const travelMode = ref('walking')    
const routeLayer = ref(null)         
const routeInfo = ref('')             
const userLatLng = ref(null)          

function setError(msg) {
  error.value = msg || ''
  if (msg) console.error('[Map]', msg)
}
function computeDistanceMeters(a, b) {
  return map ? map.distance([a.lat, a.lng], [b.lat, b.lng]) : 0
}

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
  circle = L.circle(latlng, { radius: radiusMeters.value, color: '#1f6d4d', weight: 1 })
  circle.addTo(map)
}
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
async function searchHere() { await searchAt(map.getCenter()) }
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
function flyTo(p) { map.flyTo([p.lat, p.lng], 17) }
watchEffect(() => { if (map && centerMarker) drawCenterCircle(centerMarker.getLatLng()) })

async function drawRouteTo(place) {
  try {
    const to = place?.lat && place?.lng ? { lat: place.lat, lng: place.lng } : null
    if (!to) return
    const fromLL = userLatLng.value || map.getCenter()
    const from = { lat: fromLL.lat, lng: fromLL.lng }
    const mode = travelMode.value // walking | cycling | driving

    const url = `https://router.project-osrm.org/route/v1/${mode}/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=false`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const data = await res.json()
    if (!data?.routes?.length) throw new Error('No route found')

    const route = data.routes[0]
    const geo = route.geometry

    if (routeLayer.value) { map.removeLayer(routeLayer.value); routeLayer.value = null }
    // @ts-ignore
    routeLayer.value = L.geoJSON(geo, { style: { color: '#1f6d4d', weight: 5, opacity: 0.95 } }).addTo(map)
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
  if (routeLayer.value) { map.removeLayer(routeLayer.value); routeLayer.value = null }
  routeInfo.value = ''
}

async function focusMapCanvas() {
  await nextTick()
  const canvas = mapEl.value?.querySelector('canvas')
  if (canvas) { canvas.setAttribute('tabindex', '0'); canvas.focus() }
}

onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: true, scrollWheelZoom: true })
        .setView([centerLatLng.value.lat, centerLatLng.value.lng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
  }).addTo(map)

  locateMe()
})
</script>

<style scoped>
.sr-only{
  position:absolute !important; height:1px; width:1px; overflow:hidden;
  clip:rect(1px,1px,1px,1px); white-space:nowrap;
}
.sr-only-focus{position:absolute; left:-9999px;}
.sr-only-focus:focus{left:8px; top:8px; z-index:999;}

:focus-visible{outline:3px solid #1d4ed8; outline-offset:2px}

.map-page{max-width:1200px;margin:0 auto;padding:16px}
.toolbar{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:12px 14px;margin-bottom:14px}
.row{display:flex;gap:8px;align-items:center}
.row.wrap{flex-wrap:wrap;margin-top:8px}
.inline{display:flex;align-items:center;gap:6px}
.input{flex:1;min-width:260px;padding:10px 12px;border:1px solid #d9e3dd;border-radius:10px}
.select{padding:8px;border:1px solid #d9e3dd;border-radius:8px;background:#fff}
.checks{display:flex;gap:10px;flex-wrap:wrap}
.check{display:flex;align-items:center;gap:6px;background:#f7faf8;border:1px solid #e3efe7;padding:6px 10px;border-radius:999px}
.muted{color:#6b7280}
.err{color:#b3261e;margin-left:auto}

.route-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-left:auto}
.route-tools .mode{display:flex;align-items:center;gap:6px}
.route-tools select{padding:6px 8px;border:1px solid #e0e0e0;border-radius:8px;background:#fff}
.route-tip{color:#1f6d4d;font-weight:700}

.content{display:grid;grid-template-columns:360px 1fr;gap:14px}
.list{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:12px 14px;min-height:540px}
.list-head{display:flex;align-items:center;gap:10px;margin:0 0 10px 0;font-size:1.05rem}
.list-head .muted{color:#6b7280}
.loading,.empty{color:#6b7280}
.cards{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.card{border:1px solid #e7efe9;border-radius:10px;padding:10px 12px}
.title{display:flex;align-items:center;gap:8px;margin:0}
.name{font-weight:700}
.badge{font-size:.75rem;background:#eef7f0;color:#2f7d56;border:1px solid #cfe9d9;border-radius:999px;padding:2px 8px}
.line{color:#374151;margin-top:4px}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.link{color:#2563eb;text-decoration:none}
.link:hover{text-decoration:underline}

.map-wrap{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:8px}
.map{width:100%;height:600px;border-radius:8px}

.btn,.btn-outline,.btn-mini{padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer}
.btn{background:#1f6d4d;color:#fff;border:0}
.btn:hover{background:#16583e}
.btn-outline{background:#fff;border:2px solid #1f6d4d;color:#1f6d4d}
.btn-outline:hover{background:#1f6d4d;color:#fff}
.btn-mini{padding:6px 10px;border:1px solid #cfe9d9;background:#f7faf8;border-radius:8px}
.btn-mini.primary{background:#1f6d4d;color:#fff;border:0}

@media (max-width: 1024px){
  .content{grid-template-columns:1fr}
  .list{order:2}
  .map-wrap{order:1}
  .map{height:520px}
}
</style>
