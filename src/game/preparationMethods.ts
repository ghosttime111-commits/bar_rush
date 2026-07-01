export type PreparationMethod = 'build' | 'shake'

export function preparationLabel(method: PreparationMethod): string {
  return method === 'shake' ? 'Взболтать' : 'Собрать'
}

export function preparationIcon(method: PreparationMethod): string {
  return method === 'shake' ? '🧋' : '🥃'
}
