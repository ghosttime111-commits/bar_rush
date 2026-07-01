import { getNewlyUnlockedRecipes, getUnlockedRecipes } from './recipes'
import type { Recipe } from './recipes'
import { loadProgress, recipeUnlockShift, saveProgress } from './progress'
import type { PlayerProgress, ShiftGrade } from './progress'
import { SHIFT_MODES, unlockedSpecialModes } from './shiftModes'
import type { ShiftModeId, SpecialShiftModeId } from './shiftModes'

export type ShiftCompletion = {
  modeId: ShiftModeId
  money: number
  maxCombo: number
  grade: ShiftGrade
  reachedTimerEnd: boolean
}

const gradeRank: Record<ShiftGrade, number> = { D: 0, C: 1, B: 2, A: 3, S: 4 }

export function completeShiftProgress(completion: ShiftCompletion): {
  progress: PlayerProgress
  newlyUnlocked: Recipe[]
  offeredModeId: SpecialShiftModeId | null
  isNewRecord: boolean
} {
  const progress = loadProgress()
  const before = progress.shiftsCompleted
  progress.balance += Math.max(0, Math.round(completion.money))
  if (completion.reachedTimerEnd) progress.shiftsCompleted += 1
  progress.maxComboEver = Math.max(progress.maxComboEver, completion.maxCombo)
  let offeredModeId: SpecialShiftModeId | null = null
  let isNewRecord = false

  if (completion.modeId === 'normal') {
    if (completion.reachedTimerEnd) progress.normalShiftsSinceSpecial += 1
    if (!progress.pendingSpecialShiftId && progress.normalShiftsSinceSpecial >= 3) {
      offeredModeId = chooseSpecialOffer(progress)
      if (offeredModeId) {
        progress.pendingSpecialShiftId = offeredModeId
        progress.normalShiftsSinceSpecial = 0
      }
    }
  } else {
    const stat = progress.specialShiftStats[completion.modeId]
    const previousMoney = stat.bestMoney
    const previousCombo = stat.bestCombo
    stat.attempts += 1
    if (completion.reachedTimerEnd) stat.completions += 1
    stat.bestMoney = Math.max(stat.bestMoney, completion.money)
    stat.bestCombo = Math.max(stat.bestCombo, completion.maxCombo)
    if (completion.reachedTimerEnd && (!stat.bestGrade || gradeRank[completion.grade] > gradeRank[stat.bestGrade])) {
      stat.bestGrade = completion.grade
    }
    isNewRecord = completion.money > previousMoney || completion.maxCombo > previousCombo
    progress.lastSpecialShiftId = completion.modeId
    progress.pendingSpecialShiftId = null
  }

  const newlyUnlocked = getNewlyUnlockedRecipes(before, progress.shiftsCompleted)
    .filter((recipe) => !progress.shownRecipeUnlocks.includes(recipe.id))
  saveProgress(progress)
  return { progress, newlyUnlocked, offeredModeId, isNewRecord }
}

export function declineSpecialShift(): PlayerProgress {
  const progress = loadProgress()
  if (progress.pendingSpecialShiftId) progress.lastSpecialShiftId = progress.pendingSpecialShiftId
  progress.pendingSpecialShiftId = null
  saveProgress(progress)
  return progress
}

export function markSpecialShiftTutorialSeen(): PlayerProgress {
  const progress = loadProgress()
  progress.specialShiftTutorialSeen = true
  saveProgress(progress)
  return progress
}

function chooseSpecialOffer(progress: PlayerProgress): SpecialShiftModeId | null {
  const recipes = getUnlockedRecipes(recipeUnlockShift(progress))
  let candidates = unlockedSpecialModes(progress, recipes).map((mode) => mode.id as SpecialShiftModeId)
  if (candidates.length > 1 && progress.lastSpecialShiftId) candidates = candidates.filter((id) => id !== progress.lastSpecialShiftId)
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)]! : null
}

export function specialModeIsPlayable(id: SpecialShiftModeId, progress: PlayerProgress): boolean {
  const recipes = getUnlockedRecipes(recipeUnlockShift(progress))
  return SHIFT_MODES[id].unlockCondition(progress, recipes) && recipes.some(SHIFT_MODES[id].allowedRecipeFilter)
}
