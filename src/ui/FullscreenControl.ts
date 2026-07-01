import Phaser from 'phaser'
import { CYBER, CYBER_FONT, hex } from './cyberTheme'
import { isMobileViewport } from './responsive'

type FullscreenControlOptions = {
  x: number
  y: number
  compact?: boolean
  mobileX?: number
  mobileY?: number
}

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
  unlock?: () => void
}

export class FullscreenControl {
  readonly root: Phaser.GameObjects.Container
  private scene: Phaser.Scene
  private button: Phaser.GameObjects.Rectangle
  private label?: Phaser.GameObjects.Text
  private destroyed = false
  private options: FullscreenControlOptions
  private longPress?: Phaser.Time.TimerEvent
  private longPressTriggered = false

  constructor(scene: Phaser.Scene, options: FullscreenControlOptions) {
    this.scene = scene
    this.options = options
    const compact = options.compact === true
    this.root = scene.add.container(options.x, options.y).setDepth(200)
    this.button = scene.add.rectangle(0, 0, compact ? 34 : 188, compact ? 30 : 38, CYBER.panel, 0.82)
      .setStrokeStyle(1, CYBER.cyan, 0.72)
      .setInteractive({ useHandCursor: true })
    const icon = scene.add.graphics()
    drawFullscreenIcon(icon, compact ? 18 : 20)
    icon.setPosition(compact ? 0 : -70, 0)
    this.root.add([this.button, icon])
    if (!compact) {
      this.label = scene.add.text(12, 0, 'НА ВЕСЬ ЭКРАН', {
        fontFamily: CYBER_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
        color: hex(CYBER.white),
      }).setOrigin(0.5)
      this.root.add(this.label)
    }

    this.button.on('pointerdown', this.startLongPress, this)
    this.button.on('pointerup', this.finishPress, this)
    this.button.on('pointerout', this.cancelLongPress, this)
    scene.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.onEnter, this)
    scene.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.onLeave, this)
    scene.scale.on(Phaser.Scale.Events.FULLSCREEN_FAILED, this.onFailed, this)
    scene.scale.on(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, this.onUnsupported, this)
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.updatePosition, this)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this)
    this.refresh()
    this.updatePosition()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.button.removeAllListeners()
    this.cancelLongPress()
    this.scene.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.onEnter, this)
    this.scene.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.onLeave, this)
    this.scene.scale.off(Phaser.Scale.Events.FULLSCREEN_FAILED, this.onFailed, this)
    this.scene.scale.off(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, this.onUnsupported, this)
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updatePosition, this)
    if (this.root.active) this.root.destroy(true)
  }

  private readonly toggle = (): void => {
    if (this.scene.scale.isFullscreen) this.scene.scale.stopFullscreen()
    else this.scene.scale.startFullscreen({ navigationUI: 'hide' })
  }

  private startLongPress(): void {
    this.longPressTriggered = false
    if (!import.meta.env.DEV || !isMobileViewport()) return
    this.longPress?.destroy()
    this.longPress = this.scene.time.delayedCall(1900, () => {
      this.longPressTriggered = true
      window.dispatchEvent(new Event('bar-rush-toggle-render-diagnostics'))
    })
  }

  private finishPress(): void {
    this.cancelLongPress()
    if (this.longPressTriggered) {
      this.longPressTriggered = false
      return
    }
    this.toggle()
  }

  private cancelLongPress(): void {
    this.longPress?.destroy()
    this.longPress = undefined
  }

  private onEnter(): void {
    this.refresh()
    this.scene.scale.refresh()
    const orientation = screen.orientation as LockableOrientation | undefined
    void orientation?.lock?.('landscape').catch(() => undefined)
  }

  private onLeave(): void {
    this.refresh()
    const orientation = screen.orientation as LockableOrientation | undefined
    orientation?.unlock?.()
    this.scene.scale.refresh()
  }

  private onFailed(error?: unknown): void {
    if (import.meta.env.DEV) console.warn('[Bar Rush] Не удалось включить fullscreen.', error)
    this.refresh()
  }

  private onUnsupported(): void {
    if (import.meta.env.DEV) console.warn('[Bar Rush] Fullscreen API не поддерживается браузером.')
    this.refresh()
  }

  private refresh(): void {
    this.label?.setText(this.scene.scale.isFullscreen ? 'ВЫЙТИ ИЗ ЭКРАНА' : 'НА ВЕСЬ ЭКРАН')
    this.button.setStrokeStyle(1, this.scene.scale.isFullscreen ? CYBER.magenta : CYBER.cyan, 0.82)
  }

  private updatePosition(): void {
    const mobile = isMobileViewport()
    this.root.setPosition(
      mobile ? (this.options.mobileX ?? this.options.x) : this.options.x,
      mobile ? (this.options.mobileY ?? this.options.y) : this.options.y,
    )
  }
}

function drawFullscreenIcon(graphics: Phaser.GameObjects.Graphics, size: number): void {
  const half = size / 2
  const arm = size * 0.35
  graphics.lineStyle(2, CYBER.cyan, 1)
  graphics.beginPath()
  graphics.moveTo(-half + arm, -half).lineTo(-half, -half).lineTo(-half, -half + arm)
  graphics.moveTo(half - arm, -half).lineTo(half, -half).lineTo(half, -half + arm)
  graphics.moveTo(-half, half - arm).lineTo(-half, half).lineTo(-half + arm, half)
  graphics.moveTo(half, half - arm).lineTo(half, half).lineTo(half - arm, half)
  graphics.strokePath()
}
