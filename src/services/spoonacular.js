// src/services/spoonacular.js
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE  // e.g. https://api-xxxx-uc.a.run.app

// 生成一天餐单（通过你的云函数代理；前端不再携带 apiKey）
export async function generateMealPlan(targetCalories, diet = '', exclude = '') {
  const { data } = await axios.get(`${API_BASE}`, {
    params: {
      path: 'mealplan',
      targetCalories,
      diet,
      exclude,
    },
  })
  return data
}

// 获取菜谱详情+营养（同样走自己的云函数）
export async function getRecipeInfo(id) {
  const { data } = await axios.get(`${API_BASE}`, {
    params: {
      path: 'recipeInfo',
      id,
    },
  })
  return data
}
