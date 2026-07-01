import Phaser from 'phaser'
import {
  devAddMoney,
  devClearAllStorage,
  devCloseRecipesToCurrentShift,
  devIncrementShift,
  devOpenAllRecipes,
  devProgressSummary,
  devResetShownUnlocks,
  devResetTutorial,
  devSetShift,
  devUnlockFirstShake,
  devResetShakeTutorial,
  devUnlockAllShop,
  devSetNewUpgradesMax,
  devSetDrinkPreset,
  devOfferSpecialShift,
  devClearSpecialOffer,
  devSetNormalShiftCounter,
  devResetSpecialStats,
  devResetSpecialTutorial,
} from '../game/devProgress'
import { loadProgress } from '../game/progress'
import type { PlayerProgress } from '../game/progress'
import { audioManager } from '../audio/AudioManager'

type ProgressAction = () => PlayerProgress
type DevAction = ProgressAction | 'reload' | 'test:recipe-overlay' | `start:${'fridayRush' | 'vipNight' | 'shakerNight'}`

export class DevPanel {
  private scene: Phaser.Scene
  private root: Phaser.GameObjects.Container
  private stateText: Phaser.GameObjects.Text
  private onProgress: (progress: PlayerProgress) => void
  private keyHandler: () => void

  constructor(scene: Phaser.Scene, onProgress: (progress: PlayerProgress) => void) {
    this.scene = scene
    this.onProgress = onProgress
    this.root = scene.add.container(0, 0).setDepth(1000).setVisible(false)

    const blocker = scene.add.rectangle(480, 270, 960, 540, 0x07050a, 0.86).setInteractive()
    const panel = scene.add.graphics()
    panel.fillStyle(0x1d1521, 1).fillRoundedRect(15, 15, 930, 510, 18)
    panel.lineStyle(2, 0x65d6b0, 0.8).strokeRoundedRect(15, 15, 930, 510, 18)
    const title = scene.add.text(38, 34, 'DEV PANEL · F2', {
      fontFamily: 'Consolas', fontSize: '19px', fontStyle: 'bold', color: '#77e4be',
    }).setOrigin(0, 0.5)
    const hint = scene.add.text(920, 34, 'Только npm run dev', {
      fontFamily: 'Consolas', fontSize: '11px', color: '#9e91a4',
    }).setOrigin(1, 0.5)
    this.stateText = scene.add.text(38, 62, '', {
      fontFamily: 'Consolas', fontSize: '11px', color: '#eee6ef',
      lineSpacing: 4, wordWrap: { width: 880 },
    })
    this.root.add([blocker, panel, title, hint, this.stateText])

    const audioTests: Array<{ label: string; run: () => void }> = [
      { label: 'SFX: НАЖАТИЕ', run: () => audioManager.play('button') },
      { label: 'SFX: НАЛИВАНИЕ', run: () => audioManager.play('pour') },
      { label: 'SFX: ЛЁД', run: () => audioManager.play('ice') },
      { label: 'SFX: УСПЕХ', run: () => audioManager.play('success') },
      { label: 'SFX: ОШИБКА', run: () => audioManager.play('error') },
      { label: 'SFX: МОНЕТА', run: () => audioManager.play('coin') },
      { label: 'SFX: КОМБО', run: () => audioManager.play('comboHigh') },
      { label: 'SFX: НОВЫЙ РЕЦЕПТ', run: () => audioManager.play('recipeUnlock') },
      { label: 'SFX: ШЕЙКЕР', run: () => { audioManager.play('shakerStart'); window.setTimeout(() => audioManager.play('shakerIce'), 140); window.setTimeout(() => audioManager.play('shakerComplete'), 320) } },
      {
        label: 'АТМОСФЕРА ВКЛ/ВЫКЛ',
        run: () => {
          const settings = audioManager.getSettings()
          audioManager.updateSettings({ musicEnabled: !settings.musicEnabled })
        },
      },
    ]
    audioTests.forEach((item, index) => {
      const row = Math.floor(index / 5)
      const column = index % 5
      this.createButton(112 + column * 184, 205 + row * 39, 168, item.label, item.run, 30)
    })

    const actions: Array<{ label: string; action: DevAction }> = [
      { label: '+1 СМЕНА', action: devIncrementShift },
      { label: 'СМЕНА 0', action: () => devSetShift(0) },
      { label: 'СМЕНА 1', action: () => devSetShift(1) },
      { label: 'СМЕНА 2', action: () => devSetShift(2) },
      { label: 'СМЕНА 3', action: () => devSetShift(3) },
      { label: 'СМЕНА 5', action: () => devSetShift(5) },
      { label: 'СМЕНА 7', action: () => devSetShift(7) },
      { label: 'СМЕНА 10', action: () => devSetShift(10) },
      { label: '+$1000', action: () => devAddMoney(1000) },
      { label: '+$10000', action: () => devAddMoney(10000) },
      { label: 'СБРОСИТЬ ОБУЧЕНИЕ', action: devResetTutorial },
      { label: 'СБРОСИТЬ УВЕДОМЛЕНИЯ', action: devResetShownUnlocks },
      { label: 'ОТКРЫТЬ ВСЕ РЕЦЕПТЫ', action: devOpenAllRecipes },
      { label: 'РЕЦЕПТЫ ПО ТЕКУЩЕЙ СМЕНЕ', action: devCloseRecipesToCurrentShift },
      { label: 'ОЧИСТИТЬ localStorage', action: devClearAllStorage },
      { label: 'ПЕРЕЗАГРУЗИТЬ СЦЕНУ', action: 'reload' },
      { label: 'ЗАКРЫТЬ ПАНЕЛЬ', action: () => loadProgress() },
      { label: 'ОТКРЫТЬ 1-Й SHAKE', action: devUnlockFirstShake },
      { label: 'ШЕЙКЕР: ВЕРНО', action: () => devSetDrinkPreset('correct') },
      { label: 'ШЕЙКЕР: ОШИБКА', action: () => devSetDrinkPreset('wrong') },
      { label: 'ШЕЙКЕР: SHAKEN', action: () => devSetDrinkPreset('shaken') },
      { label: 'ШЕЙКЕР: СБРОС', action: () => devSetDrinkPreset('none') },
      { label: 'СБРОС SHAKE-ПОДСКАЗКИ', action: devResetShakeTutorial },
      { label: 'ОТКРЫТЬ ВЕСЬ МАГАЗИН', action: devUnlockAllShop },
      { label: 'НОВЫЕ УЛУЧШЕНИЯ МАКС.', action: devSetNewUpgradesMax },
      { label: 'ПРЕДЛОЖИТЬ: ЗАПАРА', action: () => devOfferSpecialShift('fridayRush') },
      { label: 'ПРЕДЛОЖИТЬ: VIP', action: () => devOfferSpecialShift('vipNight') },
      { label: 'ПРЕДЛОЖИТЬ: ШЕЙКЕРЫ', action: () => devOfferSpecialShift('shakerNight') },
      { label: 'УБРАТЬ ОСОБОЕ', action: devClearSpecialOffer },
      { label: 'СЧЁТЧИК ОСОБЫХ: 0', action: () => devSetNormalShiftCounter(0) },
      { label: 'СЧЁТЧИК ОСОБЫХ: 2', action: () => devSetNormalShiftCounter(2) },
      { label: 'СЧЁТЧИК ОСОБЫХ: 3', action: () => devSetNormalShiftCounter(3) },
      { label: 'СТАРТ: ЗАПАРА', action: 'start:fridayRush' },
      { label: 'СТАРТ: VIP', action: 'start:vipNight' },
      { label: 'СТАРТ: ШЕЙКЕРЫ', action: 'start:shakerNight' },
      { label: 'СБРОС СТАТ. ОСОБЫХ', action: devResetSpecialStats },
      { label: 'СБРОС ОБУЧ. ОСОБЫХ', action: devResetSpecialTutorial },
      { label: 'ТЕСТ: 20 РЕЦЕПТОВ', action: 'test:recipe-overlay' },
    ]

    actions.forEach((item, index) => {
      const column = index % 7
      const row = Math.floor(index / 7)
      const x = 84 + column * 132
      const y = 282 + row * 38
      this.createButton(x, y, 122, item.label, () => {
        if (typeof item.action === 'string') {
          if (item.action === 'reload') this.scene.scene.restart()
          else if (item.action === 'test:recipe-overlay') this.scene.scene.start('GameScene', { devRecipeOverlayCount: 20 })
          else this.scene.scene.start('GameScene', { modeId: item.action.slice(6) })
          return
        }
        const progress = item.action()
        this.onProgress(progress)
        this.refresh(progress)
        if (item.label === 'ЗАКРЫТЬ ПАНЕЛЬ') this.toggle()
      })
    })

    this.keyHandler = () => this.toggle()
    scene.input.keyboard?.on('keydown-F2', this.keyHandler)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy())
    this.refresh(loadProgress())
  }

  toggle(): void {
    this.root.setVisible(!this.root.visible)
    if (this.root.visible) this.refresh(loadProgress())
  }

  destroy(): void {
    this.scene.input.keyboard?.off('keydown-F2', this.keyHandler)
    this.root.destroy(true)
  }

  private refresh(progress: PlayerProgress): void {
    const summary = devProgressSummary(progress)
    const upgrades = Object.entries(progress.upgrades).map(([id, level]) => `${id}:${level}`).join(' · ')
    const shown = progress.shownRecipeUnlocks.length ? progress.shownRecipeUnlocks.join(', ') : '—'
    this.stateText.setText([
      `shiftsCompleted: ${progress.shiftsCompleted}   unlock stage: ${summary.unlockShift}${progress.devRecipeUnlockShift !== null ? ' (override)' : ''}   balance: $${progress.balance}`,
      `tutorial seen: ${progress.recipeTutorialSeen ? 'YES' : 'NO'}`,
      `unlocked: ${summary.unlockedRecipes.join(', ')}`,
      `shown unlock notifications: ${shown}`,
      `upgrades: ${upgrades}`,
      `special counter: ${progress.normalShiftsSinceSpecial}   pending: ${progress.pendingSpecialShiftId ?? '—'}   last: ${progress.lastSpecialShiftId ?? '—'}   tutorial: ${progress.specialShiftTutorialSeen ? 'YES' : 'NO'}`,
      `special stats: ${JSON.stringify(progress.specialShiftStats)}`,
    ])
  }

  private createButton(
    x: number, y: number, width: number, label: string, onClick: () => void, height = 40,
  ): void {
    const background = this.scene.add.rectangle(x, y, width, height, 0x2b2330)
      .setStrokeStyle(1, 0x65d6b0, 0.48)
      .setInteractive({ useHandCursor: true })
    const text = this.scene.add.text(x, y, label, {
      fontFamily: 'Consolas', fontSize: '10px', fontStyle: 'bold', color: '#e9fff7',
    }).setOrigin(0.5)
    background.on('pointerover', () => background.setFillStyle(0x3a3441))
    background.on('pointerout', () => background.setFillStyle(0x2b2330))
    background.on('pointerdown', onClick)
    this.root.add([background, text])
  }
}
