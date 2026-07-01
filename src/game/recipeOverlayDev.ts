import { RECIPES } from './recipes'
import type { Recipe } from './recipes'

export function createRecipeOverlayDevRecipes(count = 20): Recipe[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const source = RECIPES[index % RECIPES.length]!
    return {
      ...source,
      id: `dev-overlay-${index}`,
      name: `${source.name} · ${index + 1}`,
      ingredients: [...source.ingredients],
    }
  })
}
