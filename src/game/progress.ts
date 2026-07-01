import { UPGRADE_IDS, upgradePrice, upgradeUnlocked, UPGRADES } from './upgrades'
import type { UpgradeId } from './upgrades'
import type { SpecialShiftModeId } from './shiftModes'

export type UpgradeLevels = Record<UpgradeId, number>
export type ShiftGrade = 'S' | 'A' | 'B' | 'C' | 'D'
export type SpecialShiftStat = { attempts: number; completions: number; bestMoney: number; bestCombo: number; bestGrade: ShiftGrade | null }
export type SpecialShiftStats = Record<SpecialShiftModeId, SpecialShiftStat>

export type PlayerProgress = {
  version: 4
  balance: number
  upgrades: UpgradeLevels
  shiftsCompleted: number
  recipeTutorialSeen: boolean
  shakeTutorialSeen: boolean
  shownRecipeUnlocks: string[]
  maxComboEver: number
  devRecipeUnlockShift: number | null
  devUnlockShop: boolean
  devDrinkPreset: 'none' | 'correct' | 'wrong' | 'shaken'
  normalShiftsSinceSpecial: number
  pendingSpecialShiftId: SpecialShiftModeId | null
  lastSpecialShiftId: SpecialShiftModeId | null
  specialShiftStats: SpecialShiftStats
  specialShiftTutorialSeen: boolean
}

const STORAGE_KEY = 'bar-rush-progress-v1'

export function defaultProgress(): PlayerProgress {
  return {
    version: 4, balance: 0,
    upgrades: Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as UpgradeLevels,
    shiftsCompleted: 0, recipeTutorialSeen: false, shakeTutorialSeen: false,
    shownRecipeUnlocks: [], maxComboEver: 0, devRecipeUnlockShift: null, devUnlockShop: false, devDrinkPreset: 'none',
    normalShiftsSinceSpecial: 0, pendingSpecialShiftId: null, lastSpecialShiftId: null,
    specialShiftStats: emptySpecialShiftStats(), specialShiftTutorialSeen: false,
  }
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const saved = JSON.parse(raw) as Partial<PlayerProgress>
    const fallback = defaultProgress()
    return {
      version: 4,
      balance: validNumber(saved.balance, 0),
      upgrades: Object.fromEntries(UPGRADES.map((upgrade) => [
        upgrade.id,
        Math.min(upgrade.maxLevel, validNumber(saved.upgrades?.[upgrade.id], fallback.upgrades[upgrade.id])),
      ])) as UpgradeLevels,
      shiftsCompleted: validNumber(saved.shiftsCompleted, 0),
      recipeTutorialSeen: saved.recipeTutorialSeen === true,
      shakeTutorialSeen: saved.shakeTutorialSeen === true,
      shownRecipeUnlocks: Array.isArray(saved.shownRecipeUnlocks) ? saved.shownRecipeUnlocks.filter((id): id is string => typeof id === 'string') : [],
      maxComboEver: validNumber(saved.maxComboEver, 0),
      devRecipeUnlockShift: import.meta.env.DEV && typeof saved.devRecipeUnlockShift === 'number' ? validNumber(saved.devRecipeUnlockShift, 0) : null,
      devUnlockShop: import.meta.env.DEV && saved.devUnlockShop === true,
      devDrinkPreset: import.meta.env.DEV && ['correct', 'wrong', 'shaken'].includes(String(saved.devDrinkPreset))
        ? saved.devDrinkPreset as PlayerProgress['devDrinkPreset'] : 'none',
      normalShiftsSinceSpecial: validNumber(saved.normalShiftsSinceSpecial, 0),
      pendingSpecialShiftId: validSpecialId(saved.pendingSpecialShiftId),
      lastSpecialShiftId: validSpecialId(saved.lastSpecialShiftId),
      specialShiftStats: normalizeSpecialShiftStats(saved.specialShiftStats),
      specialShiftTutorialSeen: saved.specialShiftTutorialSeen === true,
    }
  } catch { return defaultProgress() }
}

export function saveProgress(progress: PlayerProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function markRecipeTutorialSeen(): PlayerProgress {
  const progress = loadProgress(); progress.recipeTutorialSeen = true; saveProgress(progress); return progress
}

export function markShakeTutorialSeen(): PlayerProgress {
  const progress = loadProgress(); progress.shakeTutorialSeen = true; saveProgress(progress); return progress
}

export function markRecipeUnlocksShown(ids: string[]): PlayerProgress {
  const progress = loadProgress()
  progress.shownRecipeUnlocks = [...new Set([...progress.shownRecipeUnlocks, ...ids])]
  saveProgress(progress); return progress
}

export function buyUpgrade(id: UpgradeId): { success: boolean; reason?: 'locked' | 'money' | 'max'; progress: PlayerProgress } {
  const progress = loadProgress()
  const upgrade = UPGRADES.find((item) => item.id === id)
  if (!upgrade) return { success: false, reason: 'locked', progress }
  if (!upgradeUnlocked(upgrade, progress.shiftsCompleted, progress.maxComboEver, progress.devUnlockShop)) return { success: false, reason: 'locked', progress }
  const level = progress.upgrades[id]
  if (level >= upgrade.maxLevel) return { success: false, reason: 'max', progress }
  const price = upgradePrice(upgrade, level)
  if (progress.balance < price) return { success: false, reason: 'money', progress }
  progress.balance -= price; progress.upgrades[id] += 1; saveProgress(progress)
  return { success: true, progress }
}

export function resetProgress(): PlayerProgress { localStorage.removeItem(STORAGE_KEY); return defaultProgress() }
export function recipeUnlockShift(progress: PlayerProgress): number { return import.meta.env.DEV && progress.devRecipeUnlockShift !== null ? progress.devRecipeUnlockShift : progress.shiftsCompleted }
export function updateProgressForDev(update: (progress: PlayerProgress) => void): PlayerProgress {
  if (!import.meta.env.DEV) return loadProgress()
  const progress = loadProgress(); update(progress); saveProgress(progress); return progress
}
export function clearAllStorageForDev(): PlayerProgress { if (!import.meta.env.DEV) return loadProgress(); localStorage.clear(); return defaultProgress() }
function validNumber(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback }
function validSpecialId(value: unknown): SpecialShiftModeId | null {
  return value === 'fridayRush' || value === 'vipNight' || value === 'shakerNight' ? value : null
}
function emptySpecialShiftStats(): SpecialShiftStats {
  return Object.fromEntries(['fridayRush', 'vipNight', 'shakerNight'].map((id) => [id, {
    attempts: 0, completions: 0, bestMoney: 0, bestCombo: 0, bestGrade: null,
  }])) as SpecialShiftStats
}
function normalizeSpecialShiftStats(value: unknown): SpecialShiftStats {
  const result = emptySpecialShiftStats()
  if (!value || typeof value !== 'object') return result
  const saved = value as Partial<Record<SpecialShiftModeId, Partial<SpecialShiftStat>>>
  ;(['fridayRush', 'vipNight', 'shakerNight'] as SpecialShiftModeId[]).forEach((id) => {
    const item = saved[id]
    if (!item) return
    result[id] = {
      attempts: validNumber(item.attempts, 0), completions: validNumber(item.completions, 0),
      bestMoney: validNumber(item.bestMoney, 0), bestCombo: validNumber(item.bestCombo, 0),
      bestGrade: item.bestGrade === 'S' || item.bestGrade === 'A' || item.bestGrade === 'B' || item.bestGrade === 'C' || item.bestGrade === 'D' ? item.bestGrade : null,
    }
  })
  return result
}
