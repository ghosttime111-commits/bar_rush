import Phaser from 'phaser'
import { CYBER, CYBER_FONT, hex } from './cyberTheme'
import { renderDensity } from './responsive'

export const DESIGN_WIDTH = 960
export const DESIGN_HEIGHT = 540

export type LayoutMetrics = {
  viewportWidth: number
  viewportHeight: number
  safeWidth: number
  safeHeight: number
  centerX: number
  centerY: number
  safeLeft: number
  safeRight: number
  safeTop: number
  safeBottom: number
  zoom: number
  viewWidth: number
  viewHeight: number
  viewCenterX: number
  viewCenterY: number
}

type SafeInsets = { top: number; right: number; bottom: number; left: number }

export function getLayout(scene: Phaser.Scene): LayoutMetrics {
  const viewportWidth = Math.max(1, scene.scale.width)
  const viewportHeight = Math.max(1, scene.scale.height)
  const insets = readSafeInsets()
  const availableWidth = Math.max(1, viewportWidth - insets.left - insets.right)
  const availableHeight = Math.max(1, viewportHeight - insets.top - insets.bottom)
  const zoom = Math.max(0.01, Math.min(availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT))
  const viewWidth = viewportWidth / zoom
  const viewHeight = viewportHeight / zoom
  const viewCenterX = DESIGN_WIDTH / 2 - (insets.left - insets.right) / (2 * zoom)
  const viewCenterY = DESIGN_HEIGHT / 2 - (insets.top - insets.bottom) / (2 * zoom)
  return {
    viewportWidth,
    viewportHeight,
    safeWidth: DESIGN_WIDTH,
    safeHeight: DESIGN_HEIGHT,
    centerX: DESIGN_WIDTH / 2,
    centerY: DESIGN_HEIGHT / 2,
    safeLeft: 0,
    safeRight: DESIGN_WIDTH,
    safeTop: 0,
    safeBottom: DESIGN_HEIGHT,
    zoom,
    viewWidth,
    viewHeight,
    viewCenterX,
    viewCenterY,
  }
}

export function installResponsiveLayout(scene: Phaser.Scene): () => void {
  let destroyed = false
  const blocker = scene.add.rectangle(480, 270, 960, 540, CYBER.void, 0.94)
    .setScrollFactor(1).setDepth(9000).setInteractive().setVisible(false)
  const panel = scene.add.rectangle(480, 270, 650, 92, CYBER.panel, 0.95)
    .setStrokeStyle(2, CYBER.cyan, 0.78).setDepth(9001).setVisible(false)
  const label = scene.add.text(480, 270, '↻  ПОВЕРНИТЕ ТЕЛЕФОН ДЛЯ УДОБНОЙ ИГРЫ', {
    fontFamily: CYBER_FONT,
    fontSize: '18px',
    fontStyle: 'bold',
    color: hex(CYBER.white),
    align: 'center',
  }).setOrigin(0.5).setDepth(9002).setVisible(false)
  const sharpenText = (gameObject: Phaser.GameObjects.GameObject): void => {
    if (gameObject instanceof Phaser.GameObjects.Text) gameObject.setResolution(renderDensity())
  }
  scene.children.list.forEach(sharpenText)
  scene.sys.displayList.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, sharpenText)

  const apply = (): void => {
    if (destroyed || !scene.cameras.main) return
    const layout = getLayout(scene)
    scene.cameras.main
      .setViewport(0, 0, layout.viewportWidth, layout.viewportHeight)
      .setZoom(layout.zoom)
      .centerOn(layout.viewCenterX, layout.viewCenterY)

    const portrait = layout.viewportHeight > layout.viewportWidth && Math.min(window.innerWidth, window.innerHeight) <= 700
    blocker.setPosition(layout.viewCenterX, layout.viewCenterY).setDisplaySize(layout.viewWidth, layout.viewHeight).setVisible(portrait)
    panel.setVisible(portrait)
    label.setVisible(portrait)
  }

  const onOrientationChange = (): void => apply()
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply)
  window.addEventListener('orientationchange', onOrientationChange)
  window.visualViewport?.addEventListener('resize', apply)
  apply()

  const cleanup = (): void => {
    if (destroyed) return
    destroyed = true
    scene.scale.off(Phaser.Scale.Events.RESIZE, apply)
    window.removeEventListener('orientationchange', onOrientationChange)
    window.visualViewport?.removeEventListener('resize', apply)
    scene.sys.displayList.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, sharpenText)
  }
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup)
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup)
  return cleanup
}

function readSafeInsets(): SafeInsets {
  const styles = getComputedStyle(document.documentElement)
  return {
    top: parseFloat(styles.getPropertyValue('--safe-area-top')) || 0,
    right: parseFloat(styles.getPropertyValue('--safe-area-right')) || 0,
    bottom: parseFloat(styles.getPropertyValue('--safe-area-bottom')) || 0,
    left: parseFloat(styles.getPropertyValue('--safe-area-left')) || 0,
  }
}
