// src/services/spoonacular.js
import axios from "axios";

// 1) 取 .env 里的函数地址，并去掉末尾所有斜杠，避免出现双斜杠
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

// 2) 统一 axios 实例，并用 paramsSerializer 把 ""/null/undefined 的参数都过滤掉
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  withCredentials: false,
  headers: { Accept: "application/json" },
  paramsSerializer: (params) => {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== "" && v !== undefined && v !== null
    );
    return new URLSearchParams(entries).toString();
  },
});

// 生成一日餐单 —— 只传“有值”的参数；空值就别传
export async function generateMealPlan(targetCalories, diet = "", exclude = "") {
  const params = {
    path: "mealplan",
    targetCalories: Math.round(Number(targetCalories || 0)),
  };
  if (diet && String(diet).trim()) params.diet = String(diet).trim();
  if (exclude && String(exclude).trim()) params.exclude = String(exclude).trim();

  // 这里 path 用根路径就行。因为 baseURL 已经去掉了尾部斜杠，
  // 用 "" 或 "/" 都不会出现双斜杠问题。
  const { data } = await api.get("/", { params });
  return data;
}

// 拉取单个菜谱信息（带营养）
export async function getRecipeInfo(id) {
  const { data } = await api.get("/", { params: { path: "recipeInfo", id } });
  return data;
}
