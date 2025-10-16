// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

// 统一设置 CORS 响应头（允许本地和部署环境）
// 如果你只想允许本地：origin 改成 'http://localhost:5173'
const allowOrigin = '*';
function setCors(res) {
  res.set('Access-Control-Allow-Origin', allowOrigin);
  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Vary', 'Origin');
}

exports.api = onRequest({ region: 'us-central1', secrets: ['SPOON_KEY'] }, async (req, res) => {
  setCors(res);

  // 处理预检
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const path = (req.query.path || '').toString();

    if (path === 'debug') {
      const k = process.env.SPOON_KEY || '';
      return res.json({ haskey: Boolean(k), len: k.length, prefix: k.slice(0, 4) });
    }

    if (path === 'mealplan') {
      const targetCalories = Number(req.query.targetCalories || 2000);
      const diet = (req.query.diet || '').toString().trim();
      const exclude = (req.query.exclude || '').toString().trim();

      const { data } = await axios.get('https://api.spoonacular.com/mealplanner/generate', {
        params: {
          timeFrame: 'day',
          targetCalories,
          diet: diet || undefined,
          exclude: exclude || undefined,
          apiKey: process.env.SPOON_KEY,
        },
      });
      return res.json(data);
    }

    if (path === 'recipeInfo') {
      const id = (req.query.id || '').toString();
      if (!id) return res.status(400).json({ error: 'missing id' });

      const { data } = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
        params: { includeNutrition: true, apiKey: process.env.SPOON_KEY },
      });
      return res.json(data);
    }

    return res.status(404).json({ error: 'unknown path' });
  } catch (e) {
    // 尽可能把上游错误透传回来，便于前端显示 message
    const code = e?.response?.status || 500;
    const payload = typeof e?.response?.data === 'object'
      ? e.response.data
      : { error: e?.message || 'internal error' };
    logger.error('Proxy error', code, payload);
    return res.status(code).json(payload);
  }
});
