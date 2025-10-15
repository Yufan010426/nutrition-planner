// src/stores/auth.js
import { defineStore } from "pinia";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const useAuth = defineStore("auth", {
  state: () => ({
    user: null,  // { uid, email, displayName, role }
    ready: false,
  }),

  actions: {
    // 等待初始化完成，避免初始渲染误判
    bootstrap () {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser) {
            this.user = null;
            this.ready = true;
            resolve();
            return;
          }

          // 先用默认 role，防止 Firestore 规则阻塞 UI
          let role = "user";
          try {
            const ref = doc(db, "userRoles", fbUser.uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, { role: "user" });
            } else {
              role = snap.data()?.role ?? "user";
            }
          } catch (e) {
            console.warn("role load/create failed:", e);
          }

          this.user = {
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || (fbUser.email?.split("@")[0] ?? "user"),
            role,
          };

          this.ready = true;
          resolve();
        });
      });
    },

    async logout () {
      await signOut(auth);
      this.user = null;
    },
  },
});
