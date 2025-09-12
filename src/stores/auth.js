// src/stores/auth.js
import { defineStore } from "pinia";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const useAuth = defineStore("auth", {
  state: () => ({
    user: null,     // { uid, email, displayName, role }
    ready: false,   
  }),

  actions: {
    bootstrap() {
      onAuthStateChanged(auth, async (fbUser) => {
        if (!fbUser) {
          this.user = null;
          this.ready = true;
          return;
        }

        await this.ensureDefaultRole(fbUser.uid);
        const roleSnap = await getDoc(doc(db, "userRoles", fbUser.uid));
        const role = roleSnap.exists() ? roleSnap.data().role : "user";

        this.user = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName:
            fbUser.displayName || (fbUser.email?.split("@")[0] ?? "user"),
          role,
        };
        this.ready = true;
      });
    },

    async ensureDefaultRole(uid) {
      const ref = doc(db, "userRoles", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { role: "user" });
      }
    },

    async logout() {
      await signOut(auth);
      this.user = null;
    },
  },
});
