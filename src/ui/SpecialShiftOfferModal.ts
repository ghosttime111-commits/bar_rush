import Phaser from 'phaser'
import { declineSpecialShift, markSpecialShiftTutorialSeen } from '../game/specialShiftProgress'
import { SHIFT_MODES, modeModifierLines } from '../game/shiftModes'
import type { SpecialShiftModeId } from '../game/shiftModes'
import type { PlayerProgress } from '../game/progress'
import { audioManager } from '../audio/AudioManager'
import { BODY_FONT, CYBER, DISPLAY_FONT } from './cyberTheme'

export class SpecialShiftOfferModal {
  constructor(
    scene: Phaser.Scene,
    modeId: SpecialShiftModeId,
    progress: PlayerProgress,
    onLater: () => void,
    onStart?: () => void,
  ) {
    let transitionStarted = false
    const mode = SHIFT_MODES[modeId]
    const root = scene.add.container(0, 0).setDepth(1200)
    const blocker = scene.add.rectangle(480, 270, 960, 540, CYBER.void, 0.9).setInteractive()
    const panel = scene.add.rectangle(480, 270, 560, 430, CYBER.panel, 1)
      .setStrokeStyle(2, mode.accentColor, 0.88)
    const title = scene.add.text(480, 96, 'ОСОБАЯ СМЕНА ДОСТУПНА', {
      fontFamily: DISPLAY_FONT, fontSize: '18px', color: '#f3c96b',
    }).setOrigin(0.5)
    const icon = scene.add.text(480, 145, mode.icon, { fontSize: '50px' }).setOrigin(0.5)
    const name = scene.add.text(480, 190, mode.name, {
      fontFamily: DISPLAY_FONT, fontSize: '25px', color: '#ffffff',
    }).setOrigin(0.5)
    const description = scene.add.text(480, 228, mode.fullDescription, {
      fontFamily: BODY_FONT, fontSize: '13px', color: '#ddd0df', align: 'center', wordWrap: { width: 470 },
    }).setOrigin(0.5)
    const modifiers = scene.add.text(480, 282, modeModifierLines(mode).join('\n'), {
      fontFamily: BODY_FONT, fontSize: '14px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(mode.accentColor).rgba,
      align: 'center', lineSpacing: 5,
    }).setOrigin(0.5)
    const stat = progress.specialShiftStats[modeId]
    const best = scene.add.text(480, 340, stat.attempts
      ? `Лучшее: $${stat.bestMoney}  •  комбо x${stat.bestCombo}  •  ${stat.bestGrade ?? '—'}`
      : 'Первое прохождение — поставьте рекорд!', {
      fontFamily: BODY_FONT, fontSize: '11px', color: '#b9aebe',
    }).setOrigin(0.5)
    root.add([blocker, panel, title, icon, name, description, modifiers, best])
    if (!progress.specialShiftTutorialSeen) {
      root.add(scene.add.text(480, 375, 'Особые смены меняют правила и дают больше денег. Изучите модификаторы перед стартом.', {
        fontFamily: BODY_FONT, fontSize: '11px', color: '#f5d995', align: 'center', wordWrap: { width: 480 },
      }).setOrigin(0.5))
      markSpecialShiftTutorialSeen()
    }
    this.button(scene, root, 480, 414, 300, 44, mode.accentColor, 'НАЧАТЬ ОСОБУЮ СМЕНУ', () => {
      if (transitionStarted) return
      transitionStarted = true
      audioManager.notify('button')
      if (onStart) onStart()
      else scene.scene.start('GameScene', { modeId })
    })
    this.button(scene, root, 370, 463, 180, 34, 0x493345, 'ПОЗЖЕ', onLater)
    this.button(scene, root, 590, 463, 180, 34, 0x392934, 'ОТКАЗАТЬСЯ', () => this.confirmDecline(scene, root, onLater))
    audioManager.notify('specialShiftOffer')
  }

  private confirmDecline(scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: () => void): void {
    const confirm = scene.add.container(0, 0).setDepth(2)
    const bg = scene.add.rectangle(480, 270, 430, 150, CYBER.panel, 1).setStrokeStyle(2, CYBER.danger)
    const text = scene.add.text(480, 235, 'Отказаться от этой особой смены?', {
      fontFamily: BODY_FONT, fontSize: '16px', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0.5)
    confirm.add([bg, text]); root.add(confirm)
    this.button(scene, confirm, 405, 305, 120, 36, 0x493345, 'НЕТ', () => confirm.destroy(true))
    this.button(scene, confirm, 555, 305, 120, 36, 0xb94750, 'ДА', () => { declineSpecialShift(); done() })
  }

  private button(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, color: number, label: string, action: () => void): void {
    const bg = scene.add.rectangle(x, y, w, h, color).setInteractive({ useHandCursor: true })
    const text = scene.add.text(x, y, label, { fontFamily: BODY_FONT, fontSize: '11px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5)
    bg.on('pointerdown', action); root.add([bg, text])
  }
}
