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
import { BODY_FONT, CYBER, CYBER_FONT } from '../ui/cyberTheme'
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
    const g = this.add.graphics()
    g.fillStyle(CYBER.cyan, 0.08).fillCircle(480, 260, 300)
    g.fillStyle(CYBER.panel, 0.98).fillRoundedRect(220, 68, 520, 410, 8)
    g.lineStyle(2, CYBER.cyan, 0.72).strokeRoundedRect(220, 68, 520, 410, 8)
    g.fillStyle(CYBER.magenta, 0.75).fillRect(222, 70, 516, 3)
    g.fillStyle(CYBER.void).fillCircle(480, 180, 64)
    g.lineStyle(3, Phaser.Display.Color.HexStringToColor(gradeColors[grade]!).color).strokeCircle(480, 180, 64)

    this.add.text(480, 98, data.reachedTimerEnd ? 'СМЕНА ОКОНЧЕНА' : 'РЕПУТАЦИЯ ИСЧЕРПАНА', { fontFamily: 'Trebuchet MS', fontSize: '22px', fontStyle: 'bold', color: '#f3c96b' }).setOrigin(0.5)
    this.add.text(480, 230, `${mode.icon}  ${mode.name}${result.isNewRecord ? '  ·  НОВЫЙ РЕКОРД!' : ''}`, {
      fontFamily: 'Trebuchet MS', fontSize: '14px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(mode.accentColor).rgba,
    }).setOrigin(0.5)
    this.add.text(480, 180, grade, { fontFamily: CYBER_FONT, fontSize: '70px', fontStyle: 'bold', color: gradeColors[grade] }).setOrigin(0.5)
    this.add.text(480, 258, `Базовый заработок: $${data.baseMoney}`, this.statStyle()).setOrigin(0.5)
    this.add.text(480, 283, `Бонус режима: +${Math.round((mode.rewardMultiplier - 1) * 100)}%  ·  Итого: $${data.money}`, this.statStyle()).setOrigin(0.5)
    this.add.text(480, 308, `Комбо x${data.maxCombo}   •   Обслужено ${data.served}`, this.statStyle()).setOrigin(0.5)
    this.add.text(480, 333, `Ошибки ${data.errors}   •   Ушли ${data.customersLeft}   •   Репутация ${data.reputation}`, this.statStyle()).setOrigin(0.5)
    this.add.text(480, 358, `Баланс: $${progress.balance}   •   Смен завершено: ${progress.shiftsCompleted}`, this.statStyle()).setOrigin(0.5)

    const button = this.add.rectangle(480, 429, 240, 46, CYBER.magenta).setStrokeStyle(1, CYBER.cyan, 0.8).setInteractive({ useHandCursor: true })
    this.add.text(480, 429, 'ДАЛЕЕ  →', { fontFamily: 'Trebuchet MS', fontSize: '14px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5)
    button.on('pointerover', () => button.setFillStyle(CYBER.violet))
    button.on('pointerout', () => button.setFillStyle(CYBER.magenta))
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

  private statStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: BODY_FONT, fontSize: '15px', color: '#d8f8ff' }
  }
}
