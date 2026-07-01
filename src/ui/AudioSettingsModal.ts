import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import type { AudioSettings } from '../game/audioSettings'
import { CYBER } from './cyberTheme'

export class AudioSettingsModal {
  readonly root: Phaser.GameObjects.Container
  private settings: AudioSettings
  private musicToggle!: Phaser.GameObjects.Text
  private effectsToggle!: Phaser.GameObjects.Text
  private musicFill!: Phaser.GameObjects.Rectangle
  private effectsFill!: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, onClose: () => void) {
    this.settings = audioManager.getSettings()
    this.root = scene.add.container(0, 0).setDepth(500)
    const blocker = scene.add.rectangle(480, 270, 960, 540, CYBER.void, 0.8).setInteractive()
    const panel = scene.add.graphics()
    panel.fillStyle(CYBER.panel, 1).fillRoundedRect(275, 82, 410, 376, 8)
    panel.lineStyle(2, CYBER.cyan, 0.75).strokeRoundedRect(275, 82, 410, 376, 8)
    const title = scene.add.text(480, 119, '🔊  НАСТРОЙКИ ЗВУКА', {
      fontFamily: 'Montserrat', fontSize: '21px', fontStyle: 'bold', color: '#f3c96b',
    }).setOrigin(0.5)
    this.root.add([blocker, panel, title])

    this.musicToggle = this.createToggle(scene, 480, 178, 'Музыка', this.settings.musicEnabled, () => {
      this.settings = audioManager.updateSettings({ musicEnabled: !this.settings.musicEnabled })
      this.refresh()
    })
    this.effectsToggle = this.createToggle(scene, 480, 230, 'Эффекты', this.settings.effectsEnabled, () => {
      this.settings = audioManager.updateSettings({ effectsEnabled: !this.settings.effectsEnabled })
      this.refresh()
    })
    this.musicFill = this.createSlider(scene, 480, 298, 'Громкость музыки', this.settings.musicVolume, (value) => {
      this.settings = audioManager.updateSettings({ musicVolume: value })
    })
    this.effectsFill = this.createSlider(scene, 480, 356, 'Громкость эффектов', this.settings.effectsVolume, (value) => {
      this.settings = audioManager.updateSettings({ effectsVolume: value })
    })
    const close = scene.add.rectangle(480, 420, 190, 42, CYBER.magenta).setStrokeStyle(1, CYBER.cyan, 0.7).setInteractive({ useHandCursor: true })
    const closeText = scene.add.text(480, 420, 'ЗАКРЫТЬ', {
      fontFamily: 'Montserrat', fontSize: '13px', fontStyle: 'bold', color: '#fff6e8',
    }).setOrigin(0.5)
    close.on('pointerover', () => close.setFillStyle(CYBER.violet))
    close.on('pointerout', () => close.setFillStyle(CYBER.magenta))
    close.on('pointerdown', () => {
      audioManager.notify('button')
      this.root.destroy(true)
      onClose()
    })
    this.root.add([close, closeText])
    this.refresh()
  }

  private createToggle(
    scene: Phaser.Scene, x: number, y: number, label: string, enabled: boolean, onToggle: () => void,
  ): Phaser.GameObjects.Text {
    const background = scene.add.rectangle(x, y, 330, 42, CYBER.panelSoft).setStrokeStyle(1, CYBER.cyan, 0.3)
      .setInteractive({ useHandCursor: true })
    const labelText = scene.add.text(x - 145, y, label, {
      fontFamily: 'Montserrat', fontSize: '14px', fontStyle: 'bold', color: '#eee2ed',
    }).setOrigin(0, 0.5)
    const valueText = scene.add.text(x + 142, y, enabled ? 'ВКЛ.' : 'ВЫКЛ.', {
      fontFamily: 'Montserrat', fontSize: '12px', fontStyle: 'bold', color: '#77e0a0',
    }).setOrigin(1, 0.5)
    background.on('pointerdown', () => {
      audioManager.notify('button')
      onToggle()
    })
    this.root.add([background, labelText, valueText])
    return valueText
  }

  private createSlider(
    scene: Phaser.Scene, x: number, y: number, label: string, value: number, onChange: (value: number) => void,
  ): Phaser.GameObjects.Rectangle {
    const labelText = scene.add.text(x - 165, y - 20, label, {
      fontFamily: 'Montserrat', fontSize: '12px', color: '#cfc1d2',
    }).setOrigin(0, 0.5)
    const track = scene.add.rectangle(x, y + 7, 330, 12, CYBER.panelBright).setInteractive({ useHandCursor: true })
    const fill = scene.add.rectangle(x - 165, y + 7, 330 * value, 12, CYBER.cyan).setOrigin(0, 0.5)
    const applyPointer = (pointer: Phaser.Input.Pointer): void => {
      const next = Phaser.Math.Clamp((pointer.worldX - (x - 165)) / 330, 0, 1)
      fill.setDisplaySize(330 * next, 12)
      onChange(next)
    }
    track.on('pointerdown', applyPointer)
    track.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) applyPointer(pointer)
    })
    this.root.add([labelText, track, fill])
    return fill
  }

  private refresh(): void {
    this.musicToggle.setText(this.settings.musicEnabled ? 'ВКЛ.' : 'ВЫКЛ.')
      .setColor(this.settings.musicEnabled ? '#77e0a0' : '#d77a83')
    this.effectsToggle.setText(this.settings.effectsEnabled ? 'ВКЛ.' : 'ВЫКЛ.')
      .setColor(this.settings.effectsEnabled ? '#77e0a0' : '#d77a83')
    this.musicFill.setDisplaySize(330 * this.settings.musicVolume, 12)
    this.effectsFill.setDisplaySize(330 * this.settings.effectsVolume, 12)
  }
}
