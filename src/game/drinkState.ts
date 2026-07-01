import type { Ingredient } from './ingredients'
import type { PreparationMethod } from './preparationMethods'

export type DrinkPhase = 'empty' | 'filling' | 'shaking' | 'shaken' | 'served'

export type DrinkState = {
  ingredients: Ingredient[]
  phase: DrinkPhase
  wasShaken: boolean
}

export function emptyDrinkState(): DrinkState {
  return { ingredients: [], phase: 'empty', wasShaken: false }
}

export function addDrinkIngredient(state: DrinkState, ingredient: Ingredient): DrinkState {
  if (state.phase === 'shaking') return state
  return {
    ingredients: [...state.ingredients, ingredient],
    phase: 'filling',
    wasShaken: false,
  }
}

export function canShake(state: DrinkState): boolean {
  return state.ingredients.length > 0 && state.phase === 'filling'
}

export function canServe(state: DrinkState, method: PreparationMethod): boolean {
  if (state.ingredients.length === 0 || state.phase === 'shaking') return false
  return method === 'shake' ? state.phase === 'shaken' : state.phase === 'filling' || state.phase === 'shaken'
}

export function preparationMatches(state: DrinkState, method: PreparationMethod): boolean {
  return method === 'shake' ? state.phase === 'shaken' && state.wasShaken : !state.wasShaken
}
