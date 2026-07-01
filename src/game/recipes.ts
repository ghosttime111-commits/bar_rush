import { INGREDIENTS } from './ingredients'
import type { Ingredient } from './ingredients'
import type { PreparationMethod } from './preparationMethods'

export type RecipeDifficulty = 1 | 2 | 3 | 4

export type Recipe = {
  id: string
  name: string
  icon: string
  iconKey: string
  iconAsset: string
  ingredients: Ingredient[]
  preparationMethod: PreparationMethod
  unlockAfterShift: number
  reward: number
  difficulty: RecipeDifficulty
  description: string
}

const recipe = (
  id: string, name: string, icon: string, ingredients: Ingredient[], preparationMethod: PreparationMethod,
  unlockAfterShift: number, difficulty: RecipeDifficulty, reward: number, description: string,
): Recipe => ({
  id,
  name,
  icon,
  iconKey: `cocktail-${id}`,
  iconAsset: `assets/icons/cocktails/cyberpunk/${id}.png`,
  ingredients,
  preparationMethod,
  unlockAfterShift,
  difficulty,
  reward,
  description,
})

export const RECIPES: Recipe[] = [
  recipe('beer', 'Пиво', '🍺', ['Пиво'], 'build', 0, 1, 8, 'Классика без лишних движений.'),
  recipe('shot', 'Шот', '🥃', ['Водка'], 'build', 0, 1, 10, 'Коротко, холодно, по делу.'),
  recipe('whisky-ice', 'Виски со льдом', '🥃', ['Виски', 'Лёд'], 'build', 0, 1, 14, 'Виски, смягчённый кубиками льда.'),
  recipe('rum-cola', 'Ром-кола', '🍹', ['Ром', 'Кола'], 'build', 0, 1, 16, 'Тёмный ром и сладкая кола.'),
  recipe('mojito', 'Мохито', '🍸', ['Ром', 'Лайм', 'Мята', 'Лёд', 'Содовая'], 'build', 1, 3, 28, 'Свежий длинный коктейль с мятой.'),
  recipe('gin-tonic', 'Джин-тоник', '🍸', ['Джин', 'Тоник', 'Лёд'], 'build', 2, 2, 20, 'Терпкий, прохладный и пузырящийся.'),
  recipe('screwdriver', 'Отвёртка', '🍊', ['Водка', 'Апельсиновый сок', 'Лёд'], 'build', 3, 2, 20, 'Простой цитрусовый коктейль.'),
  recipe('daiquiri', 'Дайкири', '🍸', ['Ром', 'Лайм', 'Сахарный сироп', 'Лёд'], 'shake', 4, 3, 34, 'Кисло-сладкая классика из шейкера.'),
  recipe('cuba-libre', 'Куба либре', '🍹', ['Ром', 'Кола', 'Лайм', 'Лёд'], 'build', 5, 3, 25, 'Ром-кола с ярким лаймовым акцентом.'),
  recipe('margarita', 'Маргарита', '🍸', ['Текила', 'Апельсиновый ликёр', 'Лайм', 'Лёд'], 'shake', 6, 3, 36, 'Цитрусовая текила из холодного шейкера.'),
  recipe('tequila-sunrise', 'Текила санрайз', '🌅', ['Текила', 'Апельсиновый сок', 'Гренадин', 'Лёд'], 'build', 7, 3, 28, 'Слоистый коктейль цвета рассвета.'),
  recipe('kamikaze', 'Камикадзе', '🍸', ['Водка', 'Апельсиновый ликёр', 'Лайм', 'Лёд'], 'shake', 8, 3, 36, 'Яркий, крепкий и очень холодный.'),
  recipe('cosmopolitan', 'Космополитен', '🍸', ['Водка', 'Апельсиновый ликёр', 'Клюквенный сок', 'Лайм', 'Лёд'], 'shake', 10, 4, 44, 'Клюквенно-цитрусовый коктейль из шейкера.'),
  recipe('whisky-sour', 'Виски сауэр', '🥃', ['Виски', 'Лимонный сок', 'Сахарный сироп', 'Лёд'], 'shake', 12, 4, 42, 'Кисло-сладкий виски с бархатным вкусом.'),
]

export function getUnlockedRecipes(shiftsCompleted: number): Recipe[] {
  return RECIPES.filter((item) => item.unlockAfterShift <= shiftsCompleted)
}

export function getNewlyUnlockedRecipes(before: number, after: number): Recipe[] {
  return RECIPES.filter((item) => item.unlockAfterShift > before && item.unlockAfterShift <= after)
}

export function getUnlockedIngredients(recipes: Recipe[]): Ingredient[] {
  const used = new Set(recipes.flatMap((item) => item.ingredients))
  return INGREDIENTS.filter((ingredient) => used.has(ingredient.name)).map((ingredient) => ingredient.name)
}

export function sameRecipe(current: Ingredient[], expected: Ingredient[]): boolean {
  return current.length === expected.length && current.every((ingredient, index) => ingredient === expected[index])
}

export type { Ingredient } from './ingredients'
