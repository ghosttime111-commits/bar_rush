import type { PreparationMethod } from './preparationMethods'
import type { UpgradeLevels } from './progress'

export function calculateReward(
  base: number,
  customerMultiplier: number,
  combo: number,
  upgrades: UpgradeLevels,
  method: PreparationMethod,
): number {
  const comboBonus = combo >= 3 ? 0.25 + upgrades.comboMaster * 0.05 : 0
  const baseBonus = upgrades.betterGlasses * 0.1
  const tipBonus = upgrades.tipJar * 0.05
  const shakeBonus = method === 'shake' ? upgrades.barTraining * 0.06 : 0
  return Math.round(base * customerMultiplier * (1 + baseBonus + tipBonus + shakeBonus) * (1 + comboBonus))
}

// Порядок формулы фиксирован: рецепт × тип гостя × улучшения × комбо,
// затем множитель режима применяется ровно один раз.
export function applyShiftModeReward(baseReward: number, modeMultiplier: number): number {
  return Math.round(baseReward * modeMultiplier)
}

export function shiftGrade(money: number, maxCombo: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  const score = money + maxCombo * 8
  if (score >= 150) return 'S'
  if (score >= 110) return 'A'
  if (score >= 75) return 'B'
  if (score >= 40) return 'C'
  return 'D'
}
