import { clearAllStorageForDev, recipeUnlockShift, updateProgressForDev } from './progress'
import type { PlayerProgress } from './progress'
import { RECIPES, getUnlockedRecipes } from './recipes'
import type { SpecialShiftModeId } from './shiftModes'

const MAX_RECIPE_SHIFT = Math.max(...RECIPES.map((recipe) => recipe.unlockAfterShift))

export function devIncrementShift(): PlayerProgress {
  return updateProgressForDev((progress) => {
    progress.shiftsCompleted += 1
    progress.devRecipeUnlockShift = null
  })
}

export function devSetShift(value: number): PlayerProgress {
  return updateProgressForDev((progress) => {
    progress.shiftsCompleted = Math.max(0, Math.floor(value))
    progress.devRecipeUnlockShift = null
  })
}

export function devAddMoney(amount = 1000): PlayerProgress {
  return updateProgressForDev((progress) => {
    progress.balance += Math.max(0, Math.floor(amount))
  })
}

export function devUnlockFirstShake(): PlayerProgress { return devSetShift(4) }
export function devResetShakeTutorial(): PlayerProgress {
  return updateProgressForDev((progress) => { progress.shakeTutorialSeen = false })
}
export function devUnlockAllShop(): PlayerProgress {
  return updateProgressForDev((progress) => { progress.devUnlockShop = true })
}
export function devSetNewUpgradesMax(): PlayerProgress {
  return updateProgressForDev((progress) => {
    const ids = ['proShaker', 'tipJar', 'barInsurance', 'comboMaster', 'quickCleanup', 'neonSign', 'reputationReserve', 'barTraining'] as const
    const maxima = { proShaker: 5, tipJar: 5, barInsurance: 3, comboMaster: 5, quickCleanup: 3, neonSign: 5, reputationReserve: 5, barTraining: 5 }
    ids.forEach((id) => { progress.upgrades[id] = maxima[id] })
  })
}
export function devSetDrinkPreset(preset: PlayerProgress['devDrinkPreset']): PlayerProgress {
  return updateProgressForDev((progress) => { progress.devDrinkPreset = preset })
}

export function devResetTutorial(): PlayerProgress {
  return updateProgressForDev((progress) => {
    progress.recipeTutorialSeen = false
  })
}

export function devResetShownUnlocks(): PlayerProgress {
  return updateProgressForDev((progress) => {
    progress.shownRecipeUnlocks = []
  })
}

export function devOpenAllRecipes(): PlayerProgress {
  return updateProgressForDev((progress) => {
    progress.devRecipeUnlockShift = MAX_RECIPE_SHIFT
  })
}

export function devCloseRecipesToCurrentShift(): PlayerProgress {
  return updateProgressForDev((progress) => {
    progress.devRecipeUnlockShift = null
  })
}

export function devClearAllStorage(): PlayerProgress {
  return clearAllStorageForDev()
}

export function devProgressSummary(progress: PlayerProgress): {
  unlockShift: number
  unlockedRecipes: string[]
} {
  const unlockShift = recipeUnlockShift(progress)
  return {
    unlockShift,
    unlockedRecipes: getUnlockedRecipes(unlockShift).map((recipe) => recipe.name),
  }
}

export function devOfferSpecialShift(id: SpecialShiftModeId): PlayerProgress {
  return updateProgressForDev((progress) => { progress.pendingSpecialShiftId = id })
}
export function devClearSpecialOffer(): PlayerProgress {
  return updateProgressForDev((progress) => { progress.pendingSpecialShiftId = null })
}
export function devSetNormalShiftCounter(value: number): PlayerProgress {
  return updateProgressForDev((progress) => { progress.normalShiftsSinceSpecial = Math.max(0, Math.floor(value)) })
}
export function devResetSpecialStats(): PlayerProgress {
  return updateProgressForDev((progress) => {
    ;(['fridayRush', 'vipNight', 'shakerNight'] as SpecialShiftModeId[]).forEach((id) => {
      progress.specialShiftStats[id] = { attempts: 0, completions: 0, bestMoney: 0, bestCombo: 0, bestGrade: null }
    })
  })
}
export function devResetSpecialTutorial(): PlayerProgress {
  return updateProgressForDev((progress) => { progress.specialShiftTutorialSeen = false })
}
