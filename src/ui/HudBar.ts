import Phaser from 'phaser'
import { responsiveFont } from './responsive'
import { audioManager } from '../audio/AudioManager'
import { CYBER, CYBER_FONT, hex, UI_RADIUS, UI_STROKE } from './cyberTheme'
import { createCyberUiIcon } from './IconFactory'

export type HudState = {
  money: number
  combo: number
  reputation: number
  maxReputation: number
  timeLeft: number
}

export class HudBar {
  private scene: Phaser.Scene
  private moneyText: Phaser.GameObjects.Text
  private comboText: Phaser.GameObjects.Text
  private reputationText: Phaser.GameObjects.Text
  private timerText: Phaser.GameObjects.Text
  private muteIcon: Phaser.GameObjects.Container
  private objects: Phaser.GameObjects.GameObject[] = []
  private muteButton: Phaser.GameObjects.Rectangle
  private destroyed = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const shadow = scene.add.graphics().setDepth(30)
    shadow.fillStyle(0x000000, 0.55).fillRoundedRect(17, 6, 926, 40, UI_RADIUS.normal)
    const panel = scene.add.graphics().setDepth(31)
    panel.fillStyle(CYBER.panel, 0.86).fillRoundedRect(17, 0, 926, 40, UI_RADIUS.normal)
    panel.lineStyle(1, CYBER.cyan, UI_STROKE.strong).strokeRoundedRect(17, 0, 926, 40, UI_RADIUS.normal)
    const line = scene.add.rectangle(480, 39, 880, 1, CYBER.magenta, 0.58).setDepth(32)
    const dividers = scene.add.graphics().setDepth(32)
    dividers.lineStyle(1, CYBER.cyanSoft, 0.2)
    for (const x of [245, 485, 720]) dividers.lineBetween(x, 9, x, 31)

    this.moneyText = this.text(125, 'КР 0000')
    this.comboText = this.text(365, 'СЕРИЯ —')
    this.reputationText = this.text(610, 'РЕП ▫▫▫▫▫')
    this.timerText = this.text(838, 'ВРЕМЯ 01:30')
    this.muteButton = scene.add.rectangle(42, 20, 28, 24, CYBER.panelBright, 0.78).setStrokeStyle(1, CYBER.magenta, 0.75)
      .setInteractive({ useHandCursor: true }).setDepth(34)
    this.muteIcon = createCyberUiIcon(scene, 'sound', 42, 20, 21).setDepth(35)
      .setAlpha(audioManager.isMuted() ? 0.38 : 1)
    this.objects.push(shadow, panel, line, dividers, this.moneyText, this.comboText, this.reputationText, this.timerText, this.muteButton, this.muteIcon)
    this.muteButton.on('pointerdown', () => {
      if (this.destroyed) return
      this.muteIcon.setAlpha(audioManager.toggleMasterMute() ? 0.38 : 1)
    })
  }

  update(state: HudState): void {
    if (this.destroyed || !this.moneyText.active) return
    this.moneyText.setText(`КР ${String(state.money).padStart(4, '0')}`)
    this.comboText
      .setText(state.combo ? `СЕРИЯ x${state.combo}${state.combo >= 3 ? ' +25%' : ''}` : 'СЕРИЯ —')
      .setColor(state.combo >= 3 ? hex(CYBER.magenta) : state.combo ? hex(CYBER.cyan) : hex(CYBER.muted))

    const compactMax = Math.min(5, state.maxReputation)
    const filled = Math.min(compactMax, Math.max(0, state.reputation))
    const extra = state.maxReputation > 5 ? ` ${state.reputation}/${state.maxReputation}` : ''
    this.reputationText.setText(`РЕП ${'■'.repeat(filled)}${'▫'.repeat(compactMax - filled)}${extra}`)

    const minutes = Math.floor(state.timeLeft / 60)
    const seconds = Math.max(0, state.timeLeft % 60).toString().padStart(2, '0')
    this.timerText.setText(`ВРЕМЯ ${minutes.toString().padStart(2, '0')}:${seconds}`)
      .setColor(state.timeLeft <= 15 ? hex(CYBER.danger) : hex(CYBER.white))
  }

  celebrateMoney(): void {
    if (this.destroyed || !this.moneyText.active) return
    this.scene.tweens.add({
      targets: this.moneyText,
      scale: 1.14,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut',
    })
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.muteButton.removeAllListeners()
    this.scene.tweens.killTweensOf(this.objects)
    this.objects.forEach((object) => { if (object.active) object.destroy() })
    this.objects = []
  }

  private text(x: number, label: string): Phaser.GameObjects.Text {
    return this.scene.add.text(x, 20, label, {
      fontFamily: CYBER_FONT,
      fontSize: responsiveFont(15, 1.04),
      fontStyle: 'bold',
      color: hex(CYBER.white),
    }).setOrigin(0.5).setDepth(33).setShadow(0, 1, '#000000', 2, true, true)
  }
}
