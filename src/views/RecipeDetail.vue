<script setup>
import { useRoute } from 'vue-router'
import { useReceiptsStore } from '../stores/receipts'
const route = useRoute()
const store = useReceiptsStore()
const item = store.list.find((x) => x.id === route.params.id)
</script>

<template>
  <div class="wrap" v-if="item">
    <h1>{{ item.name }}</h1>
    <small>{{ new Date(item.createdAt).toLocaleString() }}</small>

    <p style="margin: 8px 0 16px">
      Total: <strong>{{ item.snapshot.total.kcal }}</strong> kcal · P
      {{ item.snapshot.total.protein }} · F {{ item.snapshot.total.fat }} · C
      {{ item.snapshot.total.carbs }}
    </p>

    <div class="grid">
      <div v-for="(val, day) in item.snapshot.days" :key="day" class="card">
        <h3>{{ day }}</h3>
        <p>
          Day total: {{ val.total.kcal }} kcal · P {{ val.total.protein }} · F {{ val.total.fat }} ·
          C {{ val.total.carbs }}
        </p>
        <ul>
          <li v-for="m in val.meals" :key="m._ts">
            {{ m.name }} — {{ m.kcal }} kcal (P{{ m.protein }}/F{{ m.fat }}/C{{ m.carbs }})
          </li>
        </ul>
      </div>
    </div>
  </div>
  <p v-else class="wrap">Not found.</p>
</template>

<style scoped>
.wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 12px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
