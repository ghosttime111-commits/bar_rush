import Phaser from 'phaser'
import type { UpgradeDefinition } from '../game/upgrades'
import { UPGRADES } from '../game/upgrades'

export function preloadUpgradeIcons(scene: Phaser.Scene): void {
  UPGRADES.forEach((upgrade) => {
    if (!scene.textures.exists(upgrade.iconKey)) scene.load.image(upgrade.iconKey, `assets/icons/upgrades/cyberpunk/${kebab(upgrade.id)}.png`)
  })
}

function kebab(id: string): string {
  return id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

export function createUpgradeIcon(scene: Phaser.Scene, upgrade: UpgradeDefinition, x: number, y: number, size = 32): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)
  if (scene.textures.exists(upgrade.iconKey)) {
    const image = scene.add.image(0, 0, upgrade.iconKey)
    image.setDisplaySize(size, size)
    root.add(image)
    return root
  }
  root.add(drawFallback(scene, upgrade, size))
  return root
}

function drawFallback(scene: Phaser.Scene, upgrade: UpgradeDefinition, size: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics()
  const s = size / 32
  g.lineStyle(3 * s, 0x241a28, 1).fillStyle(upgrade.color, 1)
  if (upgrade.category === 'service') {
    g.fillRoundedRect(-12 * s, -12 * s, 24 * s, 24 * s, 6 * s).strokeRoundedRect(-12 * s, -12 * s, 24 * s, 24 * s, 6 * s)
    g.lineStyle(3 * s, 0xffffff, 0.8).lineBetween(-6 * s, 0, 6 * s, 0).lineBetween(0, -6 * s, 0, 6 * s)
  } else if (upgrade.category === 'income') {
    g.fillCircle(0, 0, 13 * s).strokeCircle(0, 0, 13 * s)
    g.lineStyle(3 * s, 0xffffff, 0.78).strokeCircle(0, 0, 7 * s)
  } else {
    g.fillTriangle(0, -14 * s, 13 * s, 11 * s, -13 * s, 11 * s).strokeTriangle(0, -14 * s, 13 * s, 11 * s, -13 * s, 11 * s)
    g.fillStyle(0xffffff, 0.8).fillCircle(0, 3 * s, 4 * s)
  }
  return g
}
