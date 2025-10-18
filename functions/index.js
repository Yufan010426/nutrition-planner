// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

// CORS：允许你的本地 & 线上域名
const allowOrigins = new Set([
  "http://localhost:5173",
  "https://nutrition-planner.pages.dev",     // 你的站点域名
]);
function setCors(req, res) {
  const origin = req.get("Origin") || "*";
  if (allowOrigins.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", "*");
  }
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Vary", "Origin");
}

exports.api = onRequest(
  {
    region: "us-central1",
    secrets: ["SPOON_KEY", "SENDGRID_API_KEY", "FROM_EMAIL"],
    cors: true, // v2 这行不会自动回写 header，还是自己 set 保险
  },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const path = String(req.query.path || "");

      // 0) 健康检查 & 秘钥检查
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

      // 1) 生成一天的餐单
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

      // 2) 拉取菜谱详情（含营养）
      if (path === "recipeInfo") {
        const id = String(req.query.id || "");
        if (!id) return res.status(400).json({ error: "missing id" });

        const { data } = await axios.get(
          `https://api.spoonacular.com/recipes/${id}/information`,
          { params: { includeNutrition: true, apiKey: process.env.SPOON_KEY } }
        );
        return res.json(data);
      }

      // 3) 发送带 PDF 附件的邮件（前端 POST）
      if (path === "send-mail" && req.method === "POST") {
        const { to, subject, filename, contentBase64, html } = req.body || {};
        if (!to || !contentBase64)
          return res.status(400).json({ error: "missing to/content" });

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to,
          from: process.env.FROM_EMAIL,
          subject: subject || "Your Nutrition Planner PDF",
          html: html || "<p>Please find the planner PDF attached.</p>",
          attachments: [
            {
              content: contentBase64,        // 不要带 data: 前缀
              filename: filename || "planner.pdf",
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
        };
        await sgMail.send(msg);
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
