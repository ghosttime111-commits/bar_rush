import Phaser from 'phaser'
import type { Recipe } from './recipes'

export type CustomerType = {
  id: 'normal' | 'rushed' | 'generous' | 'difficult'
  name: string
  badge: string
  patienceMultiplier: number
  rewardMultiplier: number
  color: number
}

export const CUSTOMER_TYPES: CustomerType[] = [
  { id: 'normal', name: 'Обычный', badge: '🙂', patienceMultiplier: 1, rewardMultiplier: 1, color: 0x7655a3 },
  { id: 'rushed', name: 'Спешащий', badge: '⚡', patienceMultiplier: 0.62, rewardMultiplier: 1.35, color: 0xd15d55 },
  { id: 'generous', name: 'Щедрый', badge: '💎', patienceMultiplier: 1.35, rewardMultiplier: 1.5, color: 0x348f83 },
  { id: 'difficult', name: 'Сложный', badge: '🎩', patienceMultiplier: 0.9, rewardMultiplier: 1.25, color: 0x8d5cab },
]

export function randomCustomerType(advertisingLevel = 0, neonLevel = 0): CustomerType {
  const generousChance = Math.min(0.72, 0.25 + advertisingLevel * 0.04 + neonLevel * 0.03)
  if (Math.random() < generousChance) return CUSTOMER_TYPES[2]!
  return Phaser.Utils.Array.GetRandom(CUSTOMER_TYPES.filter((type) => type.id !== 'generous'))
}

export function weightedCustomerType(
  weights: Record<CustomerType['id'], number>,
  advertisingLevel = 0,
  neonLevel = 0,
): CustomerType {
  const adjusted = CUSTOMER_TYPES.map((type) => ({
    type,
    weight: Math.max(0, weights[type.id] + (type.id === 'generous' ? advertisingLevel * 0.18 + neonLevel * 0.14 : 0)),
  }))
  let roll = Math.random() * adjusted.reduce((sum, item) => sum + item.weight, 0)
  for (const item of adjusted) {
    roll -= item.weight
    if (roll <= 0) return item.type
  }
  return adjusted[0]!.type
}

export function recipeFor(type: CustomerType, recipes: Recipe[], modeWeights?: Record<Recipe['difficulty'], number>): Recipe {
  const weighted = recipes.map((recipe) => {
    const normalWeight = recipe.difficulty === 1 ? 6 : recipe.difficulty === 2 ? 3 : 1
    const difficultWeight = recipe.difficulty === 1 ? 2 : recipe.difficulty === 2 ? 4 : 6
    const modeWeight = modeWeights?.[recipe.difficulty] ?? 1
    return { recipe, weight: (type.id === 'difficult' ? difficultWeight : normalWeight) * modeWeight }
  })
  let roll = Math.random() * weighted.reduce((sum, item) => sum + item.weight, 0)
  for (const item of weighted) {
    roll -= item.weight
    if (roll <= 0) return item.recipe
  }
  return recipes[0]!
}
