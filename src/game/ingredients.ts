export const INGREDIENT_NAMES = [
  'Пиво', 'Виски', 'Лёд', 'Водка', 'Ром', 'Лайм', 'Мята', 'Содовая', 'Кола',
  'Джин', 'Тоник', 'Апельсиновый сок', 'Текила', 'Гренадин', 'Клюквенный сок',
  'Апельсиновый ликёр', 'Сахарный сироп', 'Лимонный сок',
] as const

export type Ingredient = (typeof INGREDIENT_NAMES)[number]
export type IngredientCategory = 'alcohol' | 'mixer' | 'garnish'

export type IngredientDefinition = {
  id: string
  name: Ingredient
  shortName: string
  icon: string
  color: number
  category: IngredientCategory
  textureKey?: string
  texturePath?: string
}

export const INGREDIENTS: IngredientDefinition[] = [
  { id: 'beer', name: 'Пиво', shortName: 'Пиво', icon: '🍺', color: 0xf6b73c, category: 'alcohol' },
  { id: 'whisky', name: 'Виски', shortName: 'Виски', icon: '🥃', color: 0xc77b30, category: 'alcohol' },
  { id: 'ice', name: 'Лёд', shortName: 'Лёд', icon: '🧊', color: 0xbcecff, category: 'garnish' },
  { id: 'vodka', name: 'Водка', shortName: 'Водка', icon: '🍸', color: 0xe7f4ff, category: 'alcohol' },
  { id: 'rum', name: 'Ром', shortName: 'Ром', icon: '🏺', color: 0xd9823b, category: 'alcohol' },
  { id: 'lime', name: 'Лайм', shortName: 'Лайм', icon: '🍋', color: 0x8ed34f, category: 'garnish' },
  { id: 'mint', name: 'Мята', shortName: 'Мята', icon: '🌿', color: 0x42b883, category: 'garnish' },
  { id: 'soda', name: 'Содовая', shortName: 'Содовая', icon: '💧', color: 0x80cfff, category: 'mixer' },
  { id: 'cola', name: 'Кола', shortName: 'Кола', icon: '🥤', color: 0x8d4e38, category: 'mixer' },
  { id: 'gin', name: 'Джин', shortName: 'Джин', icon: '🍶', color: 0xb9d9df, category: 'alcohol' },
  {
    id: 'tonic', name: 'Тоник', shortName: 'Тоник', icon: 'T', color: 0x9bdcf0, category: 'mixer',
    textureKey: 'ingredient-tonic', texturePath: 'assets/icons/ingredients/tonic.svg',
  },
  { id: 'orangeJuice', name: 'Апельсиновый сок', shortName: 'Апельс. сок', icon: '🍊', color: 0xf39a32, category: 'mixer' },
  { id: 'tequila', name: 'Текила', shortName: 'Текила', icon: '🌵', color: 0xe3c65b, category: 'alcohol' },
  { id: 'grenadine', name: 'Гренадин', shortName: 'Гренадин', icon: '🍒', color: 0xb92f4b, category: 'garnish' },
  {
    id: 'cranberryJuice', name: 'Клюквенный сок', shortName: 'Клюкв. сок', icon: 'К', color: 0xa62f57, category: 'mixer',
    textureKey: 'ingredient-cranberry', texturePath: 'assets/icons/ingredients/cranberry-juice.svg',
  },
  {
    id: 'orangeLiqueur', name: 'Апельсиновый ликёр', shortName: 'Апельс. ликёр', icon: 'Л', color: 0xe8872f, category: 'alcohol',
    textureKey: 'ingredient-orange-liqueur', texturePath: 'assets/icons/ingredients/orange-liqueur.svg',
  },
  {
    id: 'sugarSyrup', name: 'Сахарный сироп', shortName: 'Сахар. сироп', icon: 'С', color: 0xf1dfb3, category: 'garnish',
    textureKey: 'ingredient-sugar-syrup', texturePath: 'assets/icons/ingredients/sugar-syrup.svg',
  },
  {
    id: 'lemonJuice', name: 'Лимонный сок', shortName: 'Лимон. сок', icon: 'Л', color: 0xf4d84f, category: 'mixer',
    textureKey: 'ingredient-lemon-juice', texturePath: 'assets/icons/ingredients/lemon-juice.svg',
  },
]

const BY_NAME = new Map(INGREDIENTS.map((ingredient) => [ingredient.name, ingredient]))

export function ingredientDefinition(name: Ingredient): IngredientDefinition {
  return BY_NAME.get(name)!
}

export function ingredientIcon(name: Ingredient): string {
  return ingredientDefinition(name).icon
}

export function ingredientColor(name: Ingredient): number {
  return ingredientDefinition(name).color
}
