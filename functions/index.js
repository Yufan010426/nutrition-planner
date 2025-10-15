// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const cors = require("cors")({ origin: true });

let SPOON_KEY = process.env.SPOON_KEY;
if (!SPOON_KEY) {
  try {
    const v1 = require("firebase-functions");
    SPOON_KEY = v1.config()?.spoon?.key;
  } catch (_) {}
}

exports.api = onRequest({ region: "us-central1" }, async (req, res) => {
  await new Promise((resolve) => cors(req, res, resolve));
  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const path = req.query.path || "";

    if (path === "mealplan") {
      const targetCalories = Number(req.query.targetCalories || 2000);
      const diet = req.query.diet || "";
      const exclude = req.query.exclude || "";

      const { data } = await axios.get(
        "https://api.spoonacular.com/mealplanner/generate",
        {
          params: {
            timeFrame: "day",
            targetCalories,
            diet: diet || undefined,
            exclude: exclude || undefined,
            apiKey: SPOON_KEY,
          },
        }
      );
      return res.json(data);
    }

    if (path === "recipeInfo") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "missing id" });

      const { data } = await axios.get(
        `https://api.spoonacular.com/recipes/${id}/information`,
        {
          params: {
            includeNutrition: true,
            apiKey: SPOON_KEY,
          },
        }
      );
      return res.json(data);
    }

    return res.status(404).json({ error: "unknown path" });
  } catch (e) {
    logger.error(e);
    return res.status(500).json({ error: e?.message || "internal error" });
  }
});
