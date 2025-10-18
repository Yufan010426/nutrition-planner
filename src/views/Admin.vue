<template>
  <div class="card">
    <h2>Admin Panel</h2>
    <p>Only users with role <b>admin</b> can see this page.</p>

    <div class="tool">
      <input v-model="promoteUid" placeholder="Enter a user's UID to promote to admin" />
      <button @click="promote">Promote to Admin</button>
    </div>

    <p class="tip">⚠️</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { db } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";

const promoteUid = ref("");

async function promote() {
  if (!promoteUid.value) return alert("Enter a UID");
  await updateDoc(doc(db, "users", promoteUid.value), { role: "admin" });
  alert("Done. You can refresh and check NavBar/Admin access.");
}
</script>

<style scoped>
.card{max-width:640px;margin:30px auto;padding:20px;background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
.tool{display:flex;gap:8px;margin-top:12px}
.tool input{flex:1;padding:10px;border:1px solid #ddd;border-radius:8px}
.tool button{padding:10px 14px;border-radius:8px;border:0;background:#4caf7a;color:#fff;font-weight:700;cursor:pointer}
.tip{margin-top:12px;color:#666}
</style>
