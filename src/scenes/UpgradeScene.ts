import Phaser from 'phaser'
import { buyUpgrade, loadProgress, resetProgress } from '../game/progress'
import type { PlayerProgress } from '../game/progress'
import { UPGRADES, upgradePrice, upgradeUnlocked, upgradeUnlockText } from '../game/upgrades'
import type { UpgradeCategory, UpgradeDefinition } from '../game/upgrades'
import { drawBarBackdrop, preloadBarVisuals } from '../ui/BarBackdrop'
import { isMobileViewport } from '../ui/responsive'
import { audioManager } from '../audio/AudioManager'
import { AudioSettingsModal } from '../ui/AudioSettingsModal'
import { UpgradeTabs } from '../ui/UpgradeTabs'
import { SHIFT_MODES, modeModifierLines } from '../game/shiftModes'
import { SpecialShiftOfferModal } from '../ui/SpecialShiftOfferModal'
import { createUpgradeIcon, preloadUpgradeIcons } from '../ui/UpgradeIcon'
import type { ShiftModeId } from '../game/shiftModes'
import { BODY_FONT, CYBER, CYBER_FONT } from '../ui/cyberTheme'

type UpgradeCard = { root: Phaser.GameObjects.Container; priceText: Phaser.GameObjects.Text; levelText: Phaser.GameObjects.Text; effectText: Phaser.GameObjects.Text; button: Phaser.GameObjects.Rectangle; buttonText: Phaser.GameObjects.Text }

export class UpgradeScene extends Phaser.Scene {
  private progress!: PlayerProgress
  private balanceText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text
  private cards = new Map<string, UpgradeCard>()
  private category: UpgradeCategory = 'service'
  private page = 0
  private tabs?: UpgradeTabs
  private pageObjects: Phaser.GameObjects.GameObject[] = []
  private transitionInProgress = false

  constructor() { super('UpgradeScene') }
  preload(): void { preloadBarVisuals(this); preloadUpgradeIcons(this) }

  create(): void {
    this.transitionInProgress = false
    this.progress = loadProgress()
    if (!this.progress.recipeTutorialSeen) { this.scene.start('RecipeBookScene', { tutorial: true, returnScene: 'UpgradeScene' }); return }
    audioManager.setMood('calm')
    audioManager.setMusicIntensity(1)
    drawBarBackdrop(this)
    this.add.rectangle(480, 270, 960, 540, CYBER.void, 0.18)
    this.add.rectangle(480, 37, 520, 48, CYBER.panel, 0.78).setStrokeStyle(1, CYBER.cyan, 0.7)
    this.add.rectangle(480, 60, 518, 2, CYBER.magenta, 0.72)
    this.add.text(480, 35, 'BAR RUSH · УЛУЧШЕНИЯ', { fontFamily: 'Trebuchet MS', fontSize: '24px', fontStyle: 'bold', color: '#f3c96b' }).setOrigin(0.5)
    this.balanceText = this.add.text(480, 68, '', { fontFamily: 'Trebuchet MS', fontSize: '16px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5)
    this.statusText = this.add.text(480, 454, '', { fontFamily: 'Trebuchet MS', fontSize: '12px', fontStyle: 'bold', color: '#7ee5a2' }).setOrigin(0.5)
    this.createFooterButtons()
    this.createAudioSettingsButton()
    this.createSpecialShiftBanner()
    this.renderCategory()
    this.attachDevPanel()
  }

  private renderCategory(): void {
    this.cards.forEach((card) => card.root.destroy(true)); this.cards.clear()
    this.pageObjects.forEach((object) => object.destroy()); this.pageObjects = []
    this.tabs?.destroy()
    this.tabs = new UpgradeTabs(this, this.category, (category) => { this.category = category; this.page = 0; this.renderCategory() })
    const upgrades = UPGRADES.filter((upgrade) => upgrade.category === this.category)
    const mobile = isMobileViewport()
    const pageSize = mobile ? 2 : 4
    const pageCount = Math.max(1, Math.ceil(upgrades.length / pageSize))
    this.page = Phaser.Math.Wrap(this.page, 0, pageCount)
    upgrades.slice(this.page * pageSize, this.page * pageSize + pageSize).forEach((upgrade, index) => {
      this.createUpgradeCard(upgrade, mobile ? 480 : index % 2 === 0 ? 263 : 697, mobile ? 205 + index * 150 : index < 2 ? 198 : 354)
    })
    if (pageCount > 1) {
      const prev = this.pageButton(420, 448, '‹', -1, pageCount)
      const count = this.add.text(480, 448, `${this.page + 1}/${pageCount}`, { fontFamily: 'Trebuchet MS', fontSize: '12px', color: '#d8cadb' }).setOrigin(0.5)
      const next = this.pageButton(540, 448, '›', 1, pageCount)
      this.pageObjects.push(prev, count, next)
    }
    this.refresh()
  }

  private createUpgradeCard(upgrade: UpgradeDefinition, x: number, y: number): void {
    const root = this.add.container(x, y)
    const panel = this.add.rectangle(0, 0, 398, 138, CYBER.panel, 0.76).setStrokeStyle(1, CYBER.cyan, 0.68)
    const accent = this.add.rectangle(0, -67, 396, 3, CYBER.magenta, 0.8)
    const icon = createUpgradeIcon(this, upgrade, -172, -45, 30)
    const name = this.add.text(-140, -50, upgrade.name, { fontFamily: 'Trebuchet MS', fontSize: '15px', fontStyle: 'bold', color: '#fff' }).setOrigin(0, 0.5)
    const levelText = this.add.text(177, -50, '', { fontFamily: 'Trebuchet MS', fontSize: '11px', fontStyle: 'bold', color: '#f3c96b' }).setOrigin(1, 0.5)
    const description = this.add.text(-178, -17, upgrade.description, { fontFamily: BODY_FONT, fontSize: '10px', color: '#a5c8d7', wordWrap: { width: 350 } }).setOrigin(0, 0.5)
    const effectText = this.add.text(-178, 15, '', { fontFamily: 'Trebuchet MS', fontSize: '10px', color: '#8edfa9' }).setOrigin(0, 0.5)
    const priceText = this.add.text(-178, 49, '', { fontFamily: 'Trebuchet MS', fontSize: '11px', fontStyle: 'bold', color: '#ddd1df' }).setOrigin(0, 0.5)
    const button = this.add.rectangle(118, 47, 130, 34, CYBER.magenta).setStrokeStyle(1, CYBER.cyan, 0.8).setInteractive({ useHandCursor: true })
    const buttonText = this.add.text(118, 47, 'КУПИТЬ', { fontFamily: 'Trebuchet MS', fontSize: '11px', fontStyle: 'bold', color: '#171019' }).setOrigin(0.5)
    button.on('pointerdown', () => this.purchase(upgrade))
    root.add([panel, accent, icon, name, levelText, description, effectText, priceText, button, buttonText])
    this.cards.set(upgrade.id, { root, priceText, levelText, effectText, button, buttonText })
  }

  private refresh(): void {
    this.balanceText.setText(`НАКОПЛЕННЫЕ ДЕНЬГИ:  $${this.progress.balance}`)
    UPGRADES.forEach((upgrade) => {
      const card = this.cards.get(upgrade.id); if (!card) return
      const level = this.progress.upgrades[upgrade.id]
      const unlocked = upgradeUnlocked(upgrade, this.progress.shiftsCompleted, this.progress.maxComboEver, this.progress.devUnlockShop)
      const maxed = level >= upgrade.maxLevel
      const price = upgradePrice(upgrade, level)
      card.levelText.setText(`УР. ${level}/${upgrade.maxLevel}`)
      card.effectText.setText(unlocked ? `${upgrade.effectText(level)}  →  ${upgrade.effectText(Math.min(upgrade.maxLevel, level + 1))}` : upgradeUnlockText(upgrade))
      card.priceText.setText(maxed ? 'МАКСИМАЛЬНЫЙ УРОВЕНЬ' : unlocked ? `Цена: $${price}` : 'ЗАБЛОКИРОВАНО')
      card.buttonText.setText(maxed ? 'МАКС.' : unlocked ? 'КУПИТЬ' : '🔒')
      card.button.setFillStyle(maxed || !unlocked ? CYBER.panelBright : CYBER.magenta).disableInteractive()
      if (!maxed && unlocked) card.button.setInteractive({ useHandCursor: true })
      card.button.setAlpha(unlocked && !maxed && this.progress.balance < price ? 0.55 : 1)
    })
  }

  private purchase(upgrade: UpgradeDefinition): void {
    const result = buyUpgrade(upgrade.id); this.progress = result.progress
    audioManager.notify(result.success ? 'upgradePurchased' : 'upgradeDenied')
    this.showStatus(result.success ? `${upgrade.name}: уровень повышен!` : result.reason === 'locked' ? 'Улучшение пока закрыто' : 'Недостаточно денег', result.success ? '#7ee5a2' : '#ef7d83')
    this.refresh()
  }

  private createFooterButtons(): void {
    this.button(725, 505, 250, 48, 0xc0434b, 'НАЧАТЬ СМЕНУ  →', () => this.startShift('normal'))
    this.button(443, 505, 190, 42, 0x493345, '📖  РЕЦЕПТЫ', () => this.scene.start('RecipeBookScene', { returnScene: 'UpgradeScene' }))
    this.button(150, 505, 210, 40, 0x261d2a, 'СБРОСИТЬ ПРОГРЕСС', () => { this.progress = resetProgress(); this.scene.start('RecipeBookScene', { tutorial: true, returnScene: 'UpgradeScene' }) })
  }

  private createSpecialShiftBanner(): void {
    const modeId = this.progress.pendingSpecialShiftId
    if (!modeId) return
    const mode = SHIFT_MODES[modeId]
    const panel = this.add.rectangle(150, 52, 260, 42, CYBER.panel, 0.76).setStrokeStyle(1, mode.accentColor, 0.85).setDepth(3)
    const title = this.add.text(32, 45, `${mode.icon}  ${mode.name}`, {
      fontFamily: 'Trebuchet MS', fontSize: '9px', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0, 0.5).setDepth(4)
    const details = this.add.text(32, 61, modeModifierLines(mode).slice(0, 2).join('  •  '), {
      fontFamily: 'Trebuchet MS', fontSize: '7px', color: '#d8cadb',
    }).setOrigin(0, 0.5).setDepth(4)
    const start = this.add.rectangle(248, 52, 56, 28, mode.accentColor).setInteractive({ useHandCursor: true }).setDepth(4)
    const startText = this.add.text(248, 52, 'ОТКРЫТЬ', { fontFamily: 'Trebuchet MS', fontSize: '7px', fontStyle: 'bold', color: '#171019' }).setOrigin(0.5).setDepth(5)
    start.on('pointerdown', () => {
      if (this.transitionInProgress) return
      new SpecialShiftOfferModal(this, modeId, this.progress, () => undefined, () => this.startShift(modeId))
    })
    void panel; void title; void details; void startText
  }

  private createAudioSettingsButton(): void {
    const button = this.add.rectangle(920, 45, 38, 38, CYBER.panel).setStrokeStyle(1, CYBER.cyan, 0.7).setInteractive({ useHandCursor: true })
    this.add.text(920, 45, '⚙', { fontFamily: 'Arial', fontSize: '20px', color: '#f4d58b' }).setOrigin(0.5)
    button.on('pointerdown', () => new AudioSettingsModal(this, () => undefined))
  }

  private button(x: number, y: number, width: number, height: number, color: number, label: string, action: () => void): void {
    const background = this.add.rectangle(x, y, width, height, color).setInteractive({ useHandCursor: true })
    background.setStrokeStyle(1, color === 0xc0434b ? CYBER.magenta : CYBER.cyan, 0.65)
    this.add.text(x, y, label, { fontFamily: 'Trebuchet MS', fontSize: '12px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5)
    background.on('pointerdown', action)
  }

  private pageButton(x: number, y: number, label: string, direction: number, count: number): Phaser.GameObjects.Container {
    const root = this.add.container(x, y); const bg = this.add.rectangle(0, 0, 34, 34, CYBER.panel).setStrokeStyle(1, CYBER.cyan, 0.65).setInteractive({ useHandCursor: true }); const text = this.add.text(0, 0, label, { fontFamily: CYBER_FONT, fontSize: '20px', color: '#fff' }).setOrigin(0.5)
    root.add([bg, text]); bg.on('pointerdown', () => { this.page = Phaser.Math.Wrap(this.page + direction, 0, count); this.renderCategory() }); return root
  }

  private showStatus(message: string, color: string): void { this.statusText.setText(message).setColor(color).setAlpha(1); this.tweens.add({ targets: this.statusText, alpha: 0, delay: 1400, duration: 300 }) }
  private startShift(modeId: ShiftModeId): void {
    if (this.transitionInProgress) return
    this.transitionInProgress = true
    this.input.enabled = false
    void audioManager.activate()
    this.scene.start('GameScene', { modeId })
  }
  private attachDevPanel(): void {
    if (!import.meta.env.DEV || isMobileViewport()) return
    void import('../ui/DevPanel').then(({ DevPanel }) => { if (this.sys.isActive()) new DevPanel(this, (progress) => { this.progress = progress; this.renderCategory() }) })
  }
}
