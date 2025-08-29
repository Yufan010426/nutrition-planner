<script setup>
import { useReceiptsStore } from '../stores/recipes'
import { RouterLink } from 'vue-router'

const store = useReceiptsStore()
</script>

<template>
  <div class="wrap">
    <h1>Receipts</h1>
    <p v-if="!store.list.length">No receipts yet. Go to Planner and save your first week.</p>

    <div class="list" v-else>
      <div v-for="r in store.list" :key="r.id" class="card">
        <h3>{{ r.name }}</h3>
        <small>{{ new Date(r.createdAt).toLocaleString() }}</small>
        <p>Total: {{ r.snapshot.total.kcal }} kcal ·
           P {{ r.snapshot.total.protein }} · F {{ r.snapshot.total.fat }} · C {{ r.snapshot.total.carbs }}</p>
        <div class="actions">
          <RouterLink class="btn sm" :to="`/receipts/${r.id}`">View</RouterLink>
          <button class="btn sm danger" @click="store.remove(r.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap{max-width:900px;margin:0 auto;padding:16px}
.list{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{background:#fff;border:1px solid #eee;border-radius:12px;padding:12px}
.actions{display:flex;gap:8px;margin-top:6px}
.btn{height:36px;padding:0 12px;border:none;border-radius:8px;background:#4CAF7A;color:#fff;cursor:pointer}
.btn.sm{height:30px}
.btn.danger{background:#c85a54}
@media (max-width:800px){.list{grid-template-columns:1fr}}
</style>
