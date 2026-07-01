import Phaser from 'phaser'
import type { PreparationMethod } from '../game/preparationMethods'
import { CYBER } from './cyberTheme'

const METHOD_TEXTURES: Record<PreparationMethod, { key: string; path: string }> = {
  shake: {
    key: 'preparation-method-shake',
    path: 'assets/icons/ui/cyberpunk/method-shake.svg',
  },
  build: {
    key: 'preparation-method-build',
    path: 'assets/icons/ui/cyberpunk/method-build.svg',
  },
}

export function preloadPreparationMethodIcons(scene: Phaser.Scene): void {
  Object.values(METHOD_TEXTURES).forEach(({ key, path }) => {
    if (!scene.textures.exists(key)) scene.load.svg(key, path)
  })
}

export function createPreparationMethodIcon(
  scene: Phaser.Scene,
  method: PreparationMethod,
  x: number,
  y: number,
  size = 22,
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)
  const texture = METHOD_TEXTURES[method]
  if (scene.textures.exists(texture.key)) {
    root.add(scene.add.image(0, 0, texture.key).setDisplaySize(size, size))
    return root
  }

  const graphics = scene.add.graphics()
  const unit = size / 32
  graphics.lineStyle(2.5 * unit, CYBER.cyan, 0.95)
  if (method === 'shake') {
    graphics.fillStyle(CYBER.panelBright, 0.95).fillRoundedRect(-7 * unit, -9 * unit, 14 * unit, 20 * unit, 3 * unit)
    graphics.strokeRoundedRect(-7 * unit, -9 * unit, 14 * unit, 20 * unit, 3 * unit)
    graphics.lineStyle(2 * unit, CYBER.magenta, 0.9)
    graphics.lineBetween(-12 * unit, -6 * unit, -16 * unit, -9 * unit)
    graphics.lineBetween(12 * unit, 5 * unit, 16 * unit, 8 * unit)
  } else {
    graphics.fillStyle(CYBER.panelBright, 0.95).fillTriangle(-9 * unit, -8 * unit, 9 * unit, -8 * unit, 6 * unit, 11 * unit)
    graphics.strokeTriangle(-9 * unit, -8 * unit, 9 * unit, -8 * unit, 6 * unit, 11 * unit)
    graphics.lineStyle(2 * unit, CYBER.magenta, 0.9)
    graphics.lineBetween(0, -14 * unit, 0, -4 * unit)
    graphics.lineBetween(0, -4 * unit, -4 * unit, -8 * unit)
    graphics.lineBetween(0, -4 * unit, 4 * unit, -8 * unit)
  }
  root.add(graphics)
  return root
}
