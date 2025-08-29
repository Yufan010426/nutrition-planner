function bmr({ sex, weight, height, age }) {
  if (sex === 'female') return 10 * weight + 6.25 * height - 5 * age - 161
  return 10 * weight + 6.25 * height - 5 * age + 5
}

const ACTIVITY = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
}

const GOAL_ADJ = {
  loss: 0.85,     
  maintain: 1.0,  
  gain: 1.10,     
}

function proteinPerKg(goal) {
  if (goal === 'gain') return 1.6
  if (goal === 'loss') return 1.4
  return 1.2
}

export function calcTargets({ sex, age, height, weight, activity, goal }) {
  const base = bmr({ sex, age, height, weight })
  const tdee = base * (ACTIVITY[activity] || 1.2)
  const kcal = Math.round(tdee * (GOAL_ADJ[goal] || 1.0))

  const p = Math.round(weight * proteinPerKg(goal))
  const pKcal = p * 4

  const fatKcal = Math.round(kcal * 0.30)
  const f = Math.round(fatKcal / 9)

  const cKcal = Math.max(kcal - pKcal - fatKcal, 0)
  const c = Math.round(cKcal / 4)

  return { kcal, protein: p, fat: f, carbs: c }
}
