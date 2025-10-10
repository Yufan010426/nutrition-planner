import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/countMeals", async (req, res) => {
  try {
    const uid = String(req.query.uid || "").trim();
    if (!uid) return res.status(400).json({ error: "uid is required" });
    const snap = await db.collection("meals").where("uid", "==", uid).get();
    res.json({ count: snap.size });
  } catch (e) {
    console.error("countMeals error:", e);
    res.status(500).json({ error: "internal" });
  }
});

app.get("/mealCount", async (req, res) => {
  try {
    const uid = req.query.uid ? String(req.query.uid).trim() : null;
    const col = db.collection("meals");
    const snap = uid ? await col.where("uid", "==", uid).get() : await col.get();
    res.json({ count: snap.size });
  } catch (e) {
    console.error("mealCount error:", e);
    res.status(500).json({ error: "internal" });
  }
});

app.post("/addMeal", async (req, res) => {
  try {
    const { uid, name, category, calories } = req.body || {};
    if (!uid || !name || !category) {
      return res.status(400).json({ error: "uid, name and category are required" });
    }
    const doc = {
      uid: String(uid).trim(),
      name: String(name).toUpperCase(),
      category: String(category).toUpperCase(),
      calories:
        typeof calories === "number"
          ? calories
          : calories != null && !Number.isNaN(Number(calories))
          ? Number(calories)
          : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection("meals").add(doc);
    res.json({ id: ref.id, saved: doc });
  } catch (e) {
    console.error("addMeal error:", e);
    res.status(500).json({ error: "internal" });
  }
});

export const api = onRequest(
  {
    region: "australia-southeast2",
    timeoutSeconds: 60,
    cors: false, 
    memory: "256MiB",
  },
  app
);
