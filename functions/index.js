// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

const allowOrigins = new Set([
  "http://localhost:5173",
  "https://nutrition-planner.pages.dev",
]);
function isAllowed(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return allowOrigins.has(origin) || u.hostname.endsWith(".pages.dev");
  } catch {
    return false;
  }
}
function setCors(req, res) {
  const origin = req.get("Origin") || "";
  res.set("Access-Control-Allow-Origin", isAllowed(origin) ? origin : "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Vary", "Origin"); 
}

exports.api = onRequest(
  {
    region: "us-central1",
    secrets: ["SPOON_KEY", "SENDGRID_API_KEY", "FROM_EMAIL"],
    cors: true, 
  },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const path = String(req.query.path || "");

      if (path === "debug") {
        const s = process.env.SPOON_KEY || "";
        const g = process.env.SENDGRID_API_KEY || "";
        const f = process.env.FROM_EMAIL || "";
        return res.json({
          spoon: { has: !!s, len: s.length, prefix: s.slice(0, 4) },
          sendgrid: { has: !!g, len: g.length, prefix: g.slice(0, 3) },
          from: f,
        });
      }

      if (path === "mealplan") {
        const targetCalories = Number(req.query.targetCalories || 2000);
        const diet = String(req.query.diet || "").trim();
        const exclude = String(req.query.exclude || "").trim();

        const { data } = await axios.get(
          "https://api.spoonacular.com/mealplanner/generate",
          {
            params: {
              timeFrame: "day",
              targetCalories,
              diet: diet || undefined,
              exclude: exclude || undefined,
              apiKey: process.env.SPOON_KEY,
            },
          }
        );
        return res.json(data);
      }

      if (path === "recipeInfo") {
        const id = String(req.query.id || "");
        if (!id) return res.status(400).json({ error: "missing id" });

        const { data } = await axios.get(
          `https://api.spoonacular.com/recipes/${id}/information`,
          { params: { includeNutrition: true, apiKey: process.env.SPOON_KEY } }
        );
        return res.json(data);
      }

      if (path === "send-mail" && req.method === "POST") {
        const { to, subject, filename, contentBase64, html } = req.body || {};
        if (!to || !contentBase64) {
          return res.status(400).json({ error: "missing to/content" });
        }

        logger.info("send-mail request", {
          to,
          filename,
          len: contentBase64?.length || 0,
          origin: req.get("Origin"),
        });

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to,
          from: process.env.FROM_EMAIL, 
          subject: subject || "Your Nutrition Planner PDF",
          html: html || "<p>Please find the planner PDF attached.</p>",
          attachments: [
            {
              content: contentBase64, 
              filename: filename || "planner.pdf",
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
        };

        await sgMail.send(msg);
        logger.info("send-mail ok", { to, filename });
        return res.json({ ok: true });
      }

      return res.status(404).json({ error: "unknown path" });
    } catch (e) {
      const code = e?.response?.status || 500;
      const payload =
        typeof e?.response?.data === "object"
          ? e.response.data
          : { error: e?.message || "internal error" };
      logger.error("API error", code, payload);
      return res.status(code).json(payload);
    }
  }
);
