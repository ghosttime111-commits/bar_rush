import type { CustomerType } from './customers'
import type { PlayerProgress } from './progress'
import type { Recipe, RecipeDifficulty } from './recipes'

export type ShiftModeId = 'normal' | 'fridayRush' | 'vipNight' | 'shakerNight'
export type SpecialShiftModeId = Exclude<ShiftModeId, 'normal'>
export type ShiftVisualTheme = 'normal' | 'rush' | 'vip' | 'shaker'

export type ShiftModeDefinition = {
  id: ShiftModeId
  name: string
  shortDescription: string
  fullDescription: string
  icon: string
  accentColor: number
  unlockCondition: (progress: PlayerProgress, recipes: Recipe[]) => boolean
  durationSeconds: number
  rewardMultiplier: number
  patienceDrainMultiplier: number
  customerReplacementDelayMultiplier: number
  allowedRecipeFilter: (recipe: Recipe) => boolean
  customerTypeWeights: Record<CustomerType['id'], number>
  recipeDifficultyWeights: Record<RecipeDifficulty, number>
  reputationLossMultiplier: number
  visualTheme: ShiftVisualTheme
  musicIntensity: number
  tutorialText: string
}

const anyRecipe = (): boolean => true

export const SHIFT_MODES: Record<ShiftModeId, ShiftModeDefinition> = {
  normal: {
    id: 'normal', name: 'Обычная смена', shortDescription: 'Классические правила бара.',
    fullDescription: 'Обслуживайте гостей, собирайте комбо и берегите репутацию.',
    icon: '🍸', accentColor: 0xd7a64d, unlockCondition: () => true, durationSeconds: 90,
    rewardMultiplier: 1, patienceDrainMultiplier: 1, customerReplacementDelayMultiplier: 1,
    allowedRecipeFilter: anyRecipe,
    customerTypeWeights: { normal: 1, rushed: 1, generous: 1, difficult: 1 },
    recipeDifficultyWeights: { 1: 6, 2: 3, 3: 1.5, 4: 1 },
    reputationLossMultiplier: 1, visualTheme: 'normal', musicIntensity: 1,
    tutorialText: '',
  },
  fridayRush: {
    id: 'fridayRush', name: 'Пятничная запара',
    shortDescription: 'Гости торопятся, но чаевые выше.',
    fullDescription: 'Короткая и быстрая смена: терпение тает быстрее, новые гости появляются почти сразу.',
    icon: '🔥', accentColor: 0xf06a3b,
    unlockCondition: (progress) => progress.shiftsCompleted >= 3,
    durationSeconds: 75, rewardMultiplier: 1.35, patienceDrainMultiplier: 1.3,
    customerReplacementDelayMultiplier: 0.5, allowedRecipeFilter: anyRecipe,
    customerTypeWeights: { normal: 1, rushed: 4.2, generous: 0.8, difficult: 0.65 },
    recipeDifficultyWeights: { 1: 7, 2: 4.5, 3: 1.5, 4: 0.7 },
    reputationLossMultiplier: 1, visualTheme: 'rush', musicIntensity: 1.15,
    tutorialText: 'Пятничная запара: гости торопятся, но чаевые выше!',
  },
  vipNight: {
    id: 'vipNight', name: 'VIP-вечер',
    shortDescription: 'Дорогие заказы, серьёзные штрафы.',
    fullDescription: 'Гости терпеливее и платят щедро, но ошибки и уходы стоят двух единиц репутации.',
    icon: '👑', accentColor: 0xf1cf79,
    unlockCondition: (progress) => progress.shiftsCompleted >= 6,
    durationSeconds: 70, rewardMultiplier: 1.8, patienceDrainMultiplier: 0.8,
    customerReplacementDelayMultiplier: 1.25, allowedRecipeFilter: anyRecipe,
    customerTypeWeights: { normal: 0.45, rushed: 0.35, generous: 3.4, difficult: 3 },
    recipeDifficultyWeights: { 1: 0.65, 2: 2.5, 3: 5, 4: 6 },
    reputationLossMultiplier: 2, visualTheme: 'vip', musicIntensity: 0.86,
    tutorialText: 'VIP-вечер: дорогие заказы, но ошибки не прощают.',
  },
  shakerNight: {
    id: 'shakerNight', name: 'Ночь шейкеров',
    shortDescription: 'Только коктейли из шейкера.',
    fullDescription: 'Все заказы требуют взбалтывания. Работайте точно и используйте профессиональный шейкер.',
    icon: '🧋', accentColor: 0x8c7dff,
    unlockCondition: (progress, recipes) => progress.shiftsCompleted >= 8 && recipes.some((recipe) => recipe.preparationMethod === 'shake'),
    durationSeconds: 80, rewardMultiplier: 1.45, patienceDrainMultiplier: 1.15,
    customerReplacementDelayMultiplier: 1, allowedRecipeFilter: (recipe) => recipe.preparationMethod === 'shake',
    customerTypeWeights: { normal: 0.9, rushed: 0.8, generous: 0.9, difficult: 1.8 },
    recipeDifficultyWeights: { 1: 1, 2: 2, 3: 4, 4: 4.5 },
    reputationLossMultiplier: 1, visualTheme: 'shaker', musicIntensity: 1.08,
    tutorialText: 'Ночь шейкеров: только взболтанные коктейли и повышенная награда!',
  },
}

export const SPECIAL_SHIFT_IDS: SpecialShiftModeId[] = ['fridayRush', 'vipNight', 'shakerNight']

export function getShiftMode(id: ShiftModeId | undefined): ShiftModeDefinition {
  return SHIFT_MODES[id ?? 'normal'] ?? SHIFT_MODES.normal
}

export function unlockedSpecialModes(progress: PlayerProgress, recipes: Recipe[]): ShiftModeDefinition[] {
  return SPECIAL_SHIFT_IDS.map((id) => SHIFT_MODES[id]).filter((mode) => mode.unlockCondition(progress, recipes))
}

export function modeModifierLines(mode: ShiftModeDefinition): string[] {
  if (mode.id === 'fridayRush') return ['Награда +35%', 'Терпение −30%', 'Гости сменяются быстрее']
  if (mode.id === 'vipNight') return ['Награда +80%', 'Ошибки: −2 репутации', 'Сложные заказы']
  if (mode.id === 'shakerNight') return ['Награда +45%', 'Только рецепты в шейкере', 'Терпение −15%']
  return ['Классические правила']
}
