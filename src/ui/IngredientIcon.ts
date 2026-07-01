import Phaser from 'phaser'
import { INGREDIENTS, ingredientDefinition } from '../game/ingredients'
import type { Ingredient } from '../game/ingredients'

export const TONIC_TEXTURE_KEY = 'cyber-ingredient-tonic'

export function preloadIngredientIcons(scene: Phaser.Scene): void {
  INGREDIENTS.forEach((definition) => {
    const key = ingredientTextureKey(definition.id)
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `assets/icons/ingredients/cyberpunk/${kebab(definition.id)}.png`)
    }
  })
}

export function createIngredientIcon(
  scene: Phaser.Scene,
  ingredient: Ingredient,
  x: number,
  y: number,
  size: number,
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)
  const definition = ingredientDefinition(ingredient)
  const textureKey = ingredientTextureKey(definition.id)
  if (scene.textures.exists(textureKey)) {
    root.add(scene.add.image(0, 0, textureKey).setDisplaySize(size, size))
    return root
  }

  const graphics = scene.add.graphics()
  const scale = size / 64
  graphics.setScale(scale)
  graphics.fillStyle(0x101329, 0.95).fillRoundedRect(-15, -24, 30, 48, 6)
  graphics.fillStyle(definition.color, 0.85).fillRoundedRect(-11, -5, 22, 25, 3)
  graphics.lineStyle(4, 0x34e7f5, 0.9).strokeRoundedRect(-15, -24, 30, 48, 6)
  graphics.lineStyle(3, 0xff3fa4, 0.8).lineBetween(-8, -16, 4, -16)
  graphics.fillStyle(0xeafcff).fillCircle(-4, 9, 2.5).fillCircle(5, 3, 2).fillCircle(4, 15, 1.5)
  root.add(graphics)
  return root
}

export function createIngredientSequence(
  scene: Phaser.Scene,
  ingredients: Ingredient[],
  x: number,
  y: number,
  options: { iconSize?: number; showNames?: boolean; color?: string; maxWidth?: number } = {},
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)
  const iconSize = options.iconSize ?? 17
  const showNames = options.showNames === true
  const color = options.color ?? '#6e4d59'
  const gap = showNames ? 8 : 5
  let cursor = 0

  ingredients.forEach((ingredient, index) => {
    const icon = createIngredientIcon(scene, ingredient, cursor + iconSize / 2, 0, iconSize)
    root.add(icon)
    cursor += iconSize + 3
    if (showNames) {
      const label = scene.add.text(cursor, 0, ingredient, {
        fontFamily: '"Segoe UI", "Trebuchet MS", Arial, sans-serif', fontSize: '11px', color,
      }).setOrigin(0, 0.5)
      root.add(label)
      cursor += label.width + gap
    }
    if (index < ingredients.length - 1) {
      const arrow = scene.add.text(cursor, 0, '→', {
        fontFamily: 'Arial', fontSize: '13px', color,
      }).setOrigin(0, 0.5)
      root.add(arrow)
      cursor += arrow.width + gap
    }
  })

  if (options.maxWidth && cursor > options.maxWidth) root.setScale(options.maxWidth / cursor)
  return root
}

function ingredientTextureKey(id: string): string {
  return `cyber-ingredient-${id}`
}

function kebab(id: string): string {
  return id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}
