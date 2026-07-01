import Phaser from 'phaser'
import { CYBER } from './cyberTheme'
import { createCyberUiIcon } from './IconFactory'

export class Shaker {
  readonly root: Phaser.GameObjects.Container
  private glow: Phaser.GameObjects.Ellipse
  private scene: Phaser.Scene
  private destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.root = scene.add.container(x, y).setDepth(14)
    this.glow = scene.add.ellipse(0, 3, 86, 68, CYBER.cyan, 0)
    const icon = createCyberUiIcon(scene, 'shaker', 0, -1, 72)
    this.root.add([this.glow, icon])
  }

  setReady(ready: boolean): void {
    if (!this.isUsable()) return
    this.glow.setAlpha(ready ? 0.28 : 0)
  }

  shake(scene: Phaser.Scene, duration: number, onComplete: () => void): void {
    if (!this.isUsable()) return
    scene.tweens.add({
      targets: this.root,
      x: { from: this.root.x - 13, to: this.root.x + 13 },
      angle: { from: -9, to: 9 },
      duration: 70,
      yoyo: true,
      repeat: Math.max(3, Math.round(duration / 140)),
      onComplete: () => {
        if (!this.isUsable()) return
        this.root.setAngle(0)
        this.glow.setAlpha(0.34)
        scene.tweens.add({ targets: this.glow, alpha: 0, scale: 1.45, duration: 260 })
        onComplete()
      },
    })
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.scene.tweens.killTweensOf([this.root, this.glow])
    if (this.root.active) this.root.destroy(true)
  }

  private isUsable(): boolean {
    return !this.destroyed && this.root.active && this.root.scene !== null
  }
}
