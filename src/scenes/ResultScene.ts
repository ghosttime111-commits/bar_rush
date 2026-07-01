import Phaser from 'phaser'
import { shiftGrade } from '../game/scoring'
import { markRecipeUnlocksShown } from '../game/progress'
import { RecipeUnlockModal } from '../ui/RecipeUnlockModal'
import { audioManager } from '../audio/AudioManager'
import { completeShiftProgress } from '../game/specialShiftProgress'
import { getShiftMode } from '../game/shiftModes'
import type { ShiftModeId } from '../game/shiftModes'
import { SpecialShiftOfferModal } from '../ui/SpecialShiftOfferModal'
import { drawBarBackdrop, preloadBarVisuals } from '../ui/BarBackdrop'
import { BODY_FONT, CYBER, DISPLAY_FONT, UI_RADIUS, UI_STROKE } from '../ui/cyberTheme'
import { installResponsiveLayout } from '../ui/LayoutManager'

type ResultData = {
  money: number; baseMoney: number; reputation: number; served: number; missed: number
  errors: number; customersLeft: number; maxCombo: number; modeId: ShiftModeId; reachedTimerEnd: boolean
}

const gradeColors: Record<string, string> = {
  S: '#ffe177', A: '#7ee5a2', B: '#7dc9f5', C: '#d4a5ee', D: '#ef7d83',
}

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene') }

  preload(): void { preloadBarVisuals(this) }

  create(data: ResultData): void {
    installResponsiveLayout(this)
    this.cameras.main.setBackgroundColor('#100d16')
    audioManager.setMood('calm')
    audioManager.setMusicIntensity(1)
    const grade = shiftGrade(data.money, data.maxCombo)
    const mode = getShiftMode(data.modeId)
    drawBarBackdrop(this, { modeId: mode.id })
    const result = completeShiftProgress({
      modeId: mode.id, money: data.money, maxCombo: data.maxCombo, grade, reachedTimerEnd: data.reachedTimerEnd,
    })
    const progress = result.progress
    audioManager.notify(mode.id === 'normal' ? 'shiftEnded' : result.isNewRecord ? 'specialShiftRecord' : 'specialShiftComplete')
    const gradeColor = Phaser.Display.Color.HexStringToColor(gradeColors[grade]!).color
    const modeColor = Phaser.Display.Color.IntegerToColor(mode.accentColor).rgba
    const bonusMoney = Math.max(0, data.money - data.baseMoney)
    const g = this.add.graphics()
    g.fillStyle(CYBER.cyan, 0.055).fillCircle(480, 245, 320)
    g.fillStyle(0x01020a, 0.62).fillRoundedRect(184, 34, 592, 484, UI_RADIUS.large)
    g.fillStyle(CYBER.panel, 0.97).fillRoundedRect(190, 28, 580, 484, UI_RADIUS.large)
    g.lineStyle(1.5, CYBER.cyan, UI_STROKE.strong).strokeRoundedRect(190, 28, 580, 484, UI_RADIUS.large)
    g.fillStyle(CYBER.magenta, 0.8).fillRoundedRect(216, 30, 528, 3, 2)
    g.lineStyle(1, CYBER.cyanSoft, UI_STROKE.subtle).lineBetween(224, 91, 736, 91)

    g.fillStyle(gradeColor, 0.055).fillCircle(480, 141, 67)
    g.fillStyle(CYBER.void, 0.98).fillCircle(480, 141, 52)
    g.lineStyle(7, gradeColor, 0.08).strokeCircle(480, 141, 58)
    g.lineStyle(2, gradeColor, 0.95).strokeCircle(480, 141, 52)

    g.fillStyle(CYBER.panelBright, 0.72).fillRoundedRect(260, 198, 440, 32, UI_RADIUS.small)
    g.lineStyle(1, mode.accentColor, UI_STROKE.normal).strokeRoundedRect(260, 198, 440, 32, UI_RADIUS.small)

    g.fillStyle(0x090c20, 0.82).fillRoundedRect(224, 239, 512, 72, UI_RADIUS.normal)
    g.lineStyle(1, CYBER.cyanSoft, UI_STROKE.subtle).strokeRoundedRect(224, 239, 512, 72, UI_RADIUS.normal)
    g.fillStyle(CYBER.magenta, 0.08).fillRoundedRect(230, 286, 500, 20, UI_RADIUS.small)
    g.lineStyle(1, CYBER.magenta, 0.24).lineBetween(245, 283, 715, 283)

    g.fillStyle(0x090c20, 0.72).fillRoundedRect(224, 321, 512, 116, UI_RADIUS.normal)
    g.lineStyle(1, CYBER.cyanSoft, UI_STROKE.subtle).strokeRoundedRect(224, 321, 512, 116, UI_RADIUS.normal)
    g.lineStyle(1, CYBER.cyanSoft, 0.16)
    g.lineBetween(394, 329, 394, 397).lineBetween(566, 329, 566, 397)
    g.lineBetween(238, 366, 722, 366).lineBetween(238, 400, 722, 400)

    this.add.text(480, 62, data.reachedTimerEnd ? 'СМЕНА ЗАВЕРШЕНА' : 'РЕПУТАЦИЯ ИСЧЕРПАНА', {
      fontFamily: DISPLAY_FONT, fontSize: '22px', color: '#f3c96b',
    }).setOrigin(0.5)
    this.add.text(480, 141, grade, {
      fontFamily: DISPLAY_FONT, fontSize: '62px', color: gradeColors[grade],
    }).setOrigin(0.5)
    this.add.text(480, 214, `${mode.icon}  ${mode.name}${result.isNewRecord ? '  ·  НОВЫЙ РЕКОРД' : ''}`, {
      fontFamily: BODY_FONT, fontSize: '14px', fontStyle: 'bold', color: modeColor,
    }).setOrigin(0.5)

    this.addFinanceRow('БАЗОВЫЙ ЗАРАБОТОК', `$${data.baseMoney}`, 250)
    this.addFinanceRow('БОНУС РЕЖИМА', `+$${bonusMoney}  ·  +${Math.round((mode.rewardMultiplier - 1) * 100)}%`, 272)
    this.addFinanceRow('ИТОГО ЗА СМЕНУ', `$${data.money}`, 296, true)

    const stats: Array<[string, string | number]> = [
      ['МАКС. КОМБО', `×${data.maxCombo}`],
      ['ОБСЛУЖЕНО', data.served],
      ['ОШИБКИ', data.errors],
      ['УШЛИ', data.customersLeft],
      ['РЕПУТАЦИЯ', data.reputation],
      ['ПРОПУЩЕНО', data.missed],
    ]
    const statX = [310, 480, 650]
    stats.forEach(([label, value], index) => {
      const x = statX[index % 3]!
      const y = index < 3 ? 339 : 376
      this.add.text(x, y - 7, label, {
        fontFamily: BODY_FONT, fontSize: '9px', fontStyle: 'bold', color: '#7f91ad',
      }).setOrigin(0.5)
      this.add.text(x, y + 10, String(value), {
        fontFamily: BODY_FONT, fontSize: '18px', fontStyle: 'bold', color: '#eafcff',
      }).setOrigin(0.5)
    })
    this.add.text(480, 418, `БАЛАНС  $${progress.balance}     ·     СМЕН ЗАВЕРШЕНО  ${progress.shiftsCompleted}`, {
      fontFamily: BODY_FONT, fontSize: '12px', fontStyle: 'bold', color: '#a9dfe7',
    }).setOrigin(0.5)

    this.add.rectangle(480, 482, 268, 48, 0x01020a, 0.58)
    const button = this.add.rectangle(480, 476, 268, 48, CYBER.magenta)
      .setStrokeStyle(1, CYBER.cyan, UI_STROKE.strong).setInteractive({ useHandCursor: true })
    const buttonLabel = this.add.text(480, 476, 'ПРОДОЛЖИТЬ  →', {
      fontFamily: DISPLAY_FONT, fontSize: '13px', color: '#ffffff',
    }).setOrigin(0.5)
    button.on('pointerover', () => button.setFillStyle(CYBER.violet))
    button.on('pointerout', () => button.setFillStyle(CYBER.magenta))
    button.on('pointerdown', () => this.tweens.add({ targets: [button, buttonLabel], scale: 0.97, duration: 55, yoyo: true }))
    button.on('pointerdown', () => {
      audioManager.notify('button')
      const next = (): void => this.showOfferOrUpgrade(result.offeredModeId, progress)
      if (result.newlyUnlocked.length === 0) { next(); return }
      button.disableInteractive()
      markRecipeUnlocksShown(result.newlyUnlocked.map((recipe) => recipe.id))
      audioManager.notify('recipeUnlocked')
      new RecipeUnlockModal(
        this,
        result.newlyUnlocked,
        () => this.scene.start('RecipeBookScene', { returnScene: 'UpgradeScene' }),
        next,
      )
    })
  }

  private showOfferOrUpgrade(modeId: import('../game/shiftModes').SpecialShiftModeId | null, progress: import('../game/progress').PlayerProgress): void {
    if (!modeId) { this.scene.start('UpgradeScene'); return }
    new SpecialShiftOfferModal(this, modeId, progress, () => this.scene.start('UpgradeScene'))
  }

  private addFinanceRow(label: string, value: string, y: number, emphasized = false): void {
    this.add.text(250, y, label, {
      fontFamily: BODY_FONT,
      fontSize: emphasized ? '12px' : '10px',
      fontStyle: 'bold',
      color: emphasized ? '#f1c968' : '#8ca4bd',
    }).setOrigin(0, 0.5)
    this.add.text(710, y, value, {
      fontFamily: BODY_FONT,
      fontSize: emphasized ? '17px' : '12px',
      fontStyle: 'bold',
      color: emphasized ? '#f7e7b1' : '#d8f8ff',
    }).setOrigin(1, 0.5)
  }
}
