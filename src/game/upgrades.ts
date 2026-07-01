export const UPGRADE_IDS = [
  'quickHands', 'betterGlasses', 'cozyBar', 'advertising',
  'proShaker', 'tipJar', 'barInsurance', 'comboMaster', 'quickCleanup',
  'neonSign', 'reputationReserve', 'barTraining',
] as const

export type UpgradeId = (typeof UPGRADE_IDS)[number]
export type UpgradeCategory = 'service' | 'income' | 'equipment'

export type UpgradeDefinition = {
  id: UpgradeId
  category: UpgradeCategory
  name: string
  iconKey: string
  iconPath?: string
  description: string
  basePrice: number
  growthMultiplier: number
  maxLevel: number
  color: number
  unlockAfterShift?: number
  requiresCombo?: number
  effectText: (level: number) => string
}

export const UPGRADES: UpgradeDefinition[] = [
  { id: 'quickHands', category: 'service', name: 'Быстрые руки', iconKey: 'upgrade-quick-hands', description: 'Клиенты медленнее теряют терпение.', basePrice: 55, growthMultiplier: 1.65, maxLevel: 10, color: 0xe5a84d, effectText: (l) => `−${l * 10}% расход терпения` },
  { id: 'cozyBar', category: 'service', name: 'Уютный бар', iconKey: 'upgrade-cozy-bar', description: 'Повышает стартовую репутацию.', basePrice: 80, growthMultiplier: 1.65, maxLevel: 10, color: 0xb879d1, effectText: (l) => `+${l * 5} репутации` },
  { id: 'barInsurance', category: 'service', name: 'Страховка бара', iconKey: 'upgrade-bar-insurance', description: 'Прощает первые уходы гостей за смену.', basePrice: 150, growthMultiplier: 1.8, maxLevel: 3, color: 0x6a9dc7, unlockAfterShift: 3, effectText: (l) => `${l} защищённых уходов` },
  { id: 'quickCleanup', category: 'service', name: 'Быстрая уборка', iconKey: 'upgrade-quick-cleanup', description: 'Быстрее возвращает управление после ошибки.', basePrice: 120, growthMultiplier: 1.7, maxLevel: 3, color: 0x78b99a, effectText: (l) => `−${l * 20}% задержки ошибки` },
  { id: 'reputationReserve', category: 'service', name: 'Запас репутации', iconKey: 'upgrade-reputation-reserve', description: 'Увеличивает максимум репутации.', basePrice: 135, growthMultiplier: 1.65, maxLevel: 5, color: 0xe1bf59, effectText: (l) => `+${l} к максимуму` },

  { id: 'betterGlasses', category: 'income', name: 'Лучшие бокалы', iconKey: 'upgrade-better-glasses', description: 'Повышает базовую награду заказа.', basePrice: 65, growthMultiplier: 1.65, maxLevel: 10, color: 0x63b6db, effectText: (l) => `+${l * 10}% награды` },
  { id: 'tipJar', category: 'income', name: 'Банка для чаевых', iconKey: 'upgrade-tip-jar', iconPath: 'assets/icons/upgrades/tip-jar.svg', description: 'Добавляет чаевые к каждому заказу.', basePrice: 100, growthMultiplier: 1.6, maxLevel: 5, color: 0xd7a64d, effectText: (l) => `+${l * 5}% чаевых` },
  { id: 'comboMaster', category: 'income', name: 'Комбо-мастер', iconKey: 'upgrade-combo-master', description: 'Усиливает бонус серии 3+.', basePrice: 180, growthMultiplier: 1.7, maxLevel: 5, color: 0xe66c52, requiresCombo: 5, effectText: (l) => l ? `+${25 + l * 5}% при комбо 3+` : '+25% при комбо 3+' },
  { id: 'barTraining', category: 'income', name: 'Барный тренинг', iconKey: 'upgrade-bar-training', description: 'Повышает награду за рецепты в шейкере.', basePrice: 160, growthMultiplier: 1.65, maxLevel: 5, color: 0x9f7bd5, unlockAfterShift: 4, effectText: (l) => `+${l * 6}% за шейкер` },

  { id: 'advertising', category: 'equipment', name: 'Реклама', iconKey: 'upgrade-advertising', description: 'Улучшает поток ценных клиентов.', basePrice: 70, growthMultiplier: 1.65, maxLevel: 10, color: 0x69c58b, effectText: (l) => `+${l * 4}% шанс щедрого` },
  { id: 'proShaker', category: 'equipment', name: 'Профессиональный шейкер', iconKey: 'upgrade-pro-shaker', iconPath: 'assets/icons/upgrades/pro-shaker.svg', description: 'Сокращает время взбалтывания.', basePrice: 140, growthMultiplier: 1.7, maxLevel: 5, color: 0xb7c5d6, unlockAfterShift: 4, effectText: (l) => `−${l * 12}% времени` },
  { id: 'neonSign', category: 'equipment', name: 'Неоновая вывеска', iconKey: 'upgrade-neon-sign', description: 'Дополнительно привлекает щедрых гостей.', basePrice: 175, growthMultiplier: 1.7, maxLevel: 5, color: 0xdb6dac, unlockAfterShift: 5, effectText: (l) => `+${l * 3}% шанс щедрого` },
]

export function upgradePrice(upgrade: UpgradeDefinition, level: number): number {
  return Math.round(upgrade.basePrice * upgrade.growthMultiplier ** level)
}

export function upgradeUnlocked(upgrade: UpgradeDefinition, shifts: number, maxComboEver: number, devUnlock = false): boolean {
  if (devUnlock) return true
  return shifts >= (upgrade.unlockAfterShift ?? 0) && maxComboEver >= (upgrade.requiresCombo ?? 0)
}

export function upgradeUnlockText(upgrade: UpgradeDefinition): string {
  if (upgrade.requiresCombo) return `Достигните комбо ${upgrade.requiresCombo}`
  return `Откроется после смены ${upgrade.unlockAfterShift ?? 0}`
}
