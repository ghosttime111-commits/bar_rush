import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import { CYBER } from './cyberTheme'

export class ResumeModal {
  readonly root: Phaser.GameObjects.Container
  private destroyed = false

  constructor(scene: Phaser.Scene, onResume: () => void) {
    this.root = scene.add.container(0, 0).setDepth(800)
    const blocker = scene.add.rectangle(480, 270, 960, 540, CYBER.void, 0.84).setInteractive()
    const panel = scene.add.graphics()
    panel.fillStyle(CYBER.panel, 1).fillRoundedRect(292, 165, 376, 210, 8)
    panel.lineStyle(2, CYBER.cyan, 0.78).strokeRoundedRect(292, 165, 376, 210, 8)
    const title = scene.add.text(480, 216, 'СМЕНА НА ПАУЗЕ', {
      fontFamily: 'Montserrat', fontSize: '22px', fontStyle: 'bold', color: '#f3c96b',
    }).setOrigin(0.5)
    const note = scene.add.text(480, 258, 'Вернитесь за стойку, когда будете готовы.', {
      fontFamily: 'Montserrat', fontSize: '12px', color: '#d9cadb',
    }).setOrigin(0.5)
    const button = scene.add.rectangle(480, 321, 240, 48, CYBER.magenta).setStrokeStyle(1, CYBER.cyan, 0.75).setInteractive({ useHandCursor: true })
    const label = scene.add.text(480, 321, 'ПРОДОЛЖИТЬ СМЕНУ', {
      fontFamily: 'Montserrat', fontSize: '13px', fontStyle: 'bold', color: '#fff7e8',
    }).setOrigin(0.5)
    button.on('pointerdown', () => {
      void audioManager.resume()
      audioManager.notify('button')
      this.destroy()
      onResume()
    })
    this.root.add([blocker, panel, title, note, button, label])
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.root.active) this.root.destroy(true)
  }
}
