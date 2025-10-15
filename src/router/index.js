// functions/index.js
const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const axios = require('axios')
const cors = require('cors')({ origin: true })

// 二代函数 + Secret：SPOON_KEY
exports.api = onRequest({ region: 'us-central1', secrets: ['SPOON_KEY'] }, async (req, res) => {
  await new Promise((resolve) => cors(req, res, resolve))
  if (req.method === 'OPTIONS') return res.status(204).send('')

  try {
    const path = req.query.path || ''

    // 健康/调试：确认云端 Secret 生效
    if (path === 'debug') {
      const k = process.env.SPOON_KEY || ''
      return res.json({ hasKey: !!k, len: k.length, prefix: k.slice(0, 4) })
    }

    if (path === 'mealplan') {
      const targetCalories = Number(req.query.targetCalories || 2000)
      const diet = req.query.diet || ''
      const exclude = req.query.exclude || ''

      const { data } = await axios.get('https://api.spoonacular.com/mealplanner/generate', {
        params: {
          timeFrame: 'day',
          targetCalories,
          diet: diet || undefined,
          exclude: exclude || undefined,
          apiKey: process.env.SPOON_KEY,
        },
      })
      return res.json(data)
    }

    if (path === 'recipeInfo') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'missing id' })

      const { data } = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
        params: { includeNutrition: true, apiKey: process.env.SPOON_KEY },
      })
      return res.json(data)
    }

    return res.status(404).json({ error: 'unknown path' })
  } catch (e) {
    const code = e?.response?.status || 500
    const payload = typeof e?.response?.data === 'object'
      ? e.response.data
      : { error: e?.message || 'internal error' }
    logger.error('Proxy error', code, payload)
    return res.status(code).json(payload)
  }
})
