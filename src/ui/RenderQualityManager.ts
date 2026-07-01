export type RenderQuality = 'performance' | 'balanced' | 'quality'

const STORAGE_KEY = 'bar-rush-render-quality-v1'

export const RENDER_QUALITY_LABELS: Record<RenderQuality, string> = {
  performance: 'Производительность',
  balanced: 'Баланс',
  quality: 'Качество',
}

export const RENDER_QUALITY_SCALES: Record<RenderQuality, number> = {
  performance: 1,
  balanced: 1.5,
  quality: 2,
}

export function loadRenderQuality(): RenderQuality {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'performance' || saved === 'balanced' || saved === 'quality' ? saved : 'balanced'
}

export function saveRenderQuality(quality: RenderQuality): void {
  localStorage.setItem(STORAGE_KEY, quality)
}

export function renderScale(): number {
  return RENDER_QUALITY_SCALES[loadRenderQuality()]
}

export function renderSizeForViewport(width: number, height: number): { width: number; height: number } {
  const scale = renderScale()
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function initialRenderSize(): { width: number; height: number } {
  return renderSizeForViewport(window.innerWidth, window.innerHeight)
}
