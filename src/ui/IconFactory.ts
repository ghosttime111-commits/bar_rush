import Phaser from 'phaser'
import { CYBER } from './cyberTheme'

export type CyberUiIcon = 'shaker' | 'recipe-book' | 'sound' | 'pause' | 'special-shift' | 'credits' | 'reputation' | 'combo'

const ICON_PATHS: Record<CyberUiIcon, string> = {
  shaker: 'assets/icons/ui/cyberpunk/shaker.png',
  'recipe-book': 'assets/icons/ui/cyberpunk/recipe-book.png',
  sound: 'assets/icons/ui/cyberpunk/sound.png',
  pause: 'assets/icons/ui/cyberpunk/pause.png',
  'special-shift': 'assets/icons/ui/cyberpunk/special-shift.png',
  credits: 'assets/icons/ui/cyberpunk/credits.png',
  reputation: 'assets/icons/ui/cyberpunk/reputation.png',
  combo: 'assets/icons/ui/cyberpunk/combo.png',
}

export function cyberUiTextureKey(icon: CyberUiIcon): string {
  return `cyber-ui-${icon}`
}

export function preloadCyberUiIcons(scene: Phaser.Scene): void {
  Object.entries(ICON_PATHS).forEach(([icon, path]) => {
    const key = cyberUiTextureKey(icon as CyberUiIcon)
    if (!scene.textures.exists(key)) scene.load.image(key, path)
  })
}

export function createCyberUiIcon(scene: Phaser.Scene, icon: CyberUiIcon, x: number, y: number, size: number): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)
  const key = cyberUiTextureKey(icon)
  if (scene.textures.exists(key)) {
    root.add(scene.add.image(0, 0, key).setDisplaySize(size, size))
    return root
  }

  const fallback = scene.add.graphics()
  const scale = size / 32
  fallback.fillStyle(CYBER.panelBright, 0.9).fillCircle(0, 0, 13 * scale)
  fallback.lineStyle(2.5 * scale, CYBER.cyan, 0.95).strokeCircle(0, 0, 13 * scale)
  fallback.lineStyle(2.5 * scale, CYBER.magenta, 0.9)
  if (icon === 'recipe-book') {
    fallback.strokeRect(-9 * scale, -8 * scale, 18 * scale, 16 * scale)
    fallback.lineBetween(0, -8 * scale, 0, 8 * scale)
  } else if (icon === 'sound') {
    fallback.fillStyle(CYBER.cyan).fillTriangle(-8 * scale, -4 * scale, -2 * scale, -4 * scale, -2 * scale, 4 * scale)
    fallback.lineBetween(2 * scale, -6 * scale, 7 * scale, 0).lineBetween(7 * scale, 0, 2 * scale, 6 * scale)
  } else if (icon === 'pause') {
    fallback.fillStyle(CYBER.magenta).fillRect(-6 * scale, -8 * scale, 4 * scale, 16 * scale).fillRect(2 * scale, -8 * scale, 4 * scale, 16 * scale)
  } else {
    fallback.lineBetween(-7 * scale, 0, 7 * scale, 0)
    fallback.lineBetween(0, -7 * scale, 0, 7 * scale)
  }
  root.add(fallback)
  return root
}
