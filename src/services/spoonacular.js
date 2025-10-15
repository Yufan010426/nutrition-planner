// src/services/spoonacular.js
import axios from 'axios'

// 你的 .env 里配置的完整触发 URL，例如：
// VITE_API_BASE=https://us-central1-<project>.cloudfunctions.net/api
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

/**
 * 走 Cloud Function 生成 1 日餐单
 * @param {{ targetCalories:number, diet?:string, exclude?:string }} opts
 */
export async function genDayPlan (opts) {
  const { targetCalories, diet = '', exclude = '' } = opts
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

/**
 * 获取菜谱详情（含营养）
 * @param {number|string} id
 */
export async function getRecipeInfo (id) {
  const { data } = await axios.get(`${API_BASE}`, {
    params: {
      path: 'recipeInfo',
      id,
    },
  })
  return data
}

// 兼容你之前的命名（如果别处还在用）
export const generateMealPlan = (kcals) => genDayPlan({ targetCalories: kcals })
