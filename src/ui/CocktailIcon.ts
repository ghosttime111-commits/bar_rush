import Phaser from 'phaser'
import type { Recipe } from '../game/recipes'
import { RECIPES } from '../game/recipes'
import { CYBER } from './cyberTheme'

const warnedMissing = new Set<string>()

export function preloadCocktailIcons(scene: Phaser.Scene): void {
  RECIPES.forEach((recipe) => {
    if (!scene.textures.exists(recipe.iconKey)) scene.load.image(recipe.iconKey, recipe.iconAsset)
  })
}

export function createCocktailIcon(
  scene: Phaser.Scene,
  recipe: Recipe,
  x: number,
  y: number,
  size: number,
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)
  if (scene.textures.exists(recipe.iconKey)) {
    const source = scene.textures.get(recipe.iconKey).getSourceImage() as HTMLImageElement
    const scale = Math.min(size / Math.max(1, source.width), size / Math.max(1, source.height))
    root.add(scene.add.image(0, 0, recipe.iconKey).setScale(scale))
    return root
  }

  if (import.meta.env.DEV && !warnedMissing.has(recipe.iconKey)) {
    warnedMissing.add(recipe.iconKey)
    console.warn(`[Bar Rush] Не найдена иконка коктейля: ${recipe.iconKey}; используется fallback.`)
  }

  const fallback = scene.add.graphics()
  const unit = size / 48
  fallback.fillStyle(CYBER.panelBright, 0.9).fillCircle(0, 0, 21 * unit)
  fallback.lineStyle(2.5 * unit, CYBER.cyan, 0.9).strokeCircle(0, 0, 21 * unit)
  fallback.lineStyle(3 * unit, CYBER.magenta, 0.9)
  fallback.strokeTriangle(-12 * unit, -10 * unit, 12 * unit, -10 * unit, 0, 8 * unit)
  fallback.lineBetween(0, 8 * unit, 0, 15 * unit)
  fallback.lineBetween(-8 * unit, 15 * unit, 8 * unit, 15 * unit)
  root.add(fallback)
  return root
}
