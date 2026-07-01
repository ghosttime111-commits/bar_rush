import Phaser from 'phaser'
import { ingredientColor } from '../game/ingredients'
import type { Ingredient } from '../game/ingredients'
import type { DrinkState } from '../game/drinkState'
import { canServe, canShake } from '../game/drinkState'
import type { Recipe } from '../game/recipes'
import { audioManager } from '../audio/AudioManager'
import { createIngredientIcon } from './IngredientIcon'
import { Shaker } from './Shaker'
import { CYBER, CYBER_FONT, hex } from './cyberTheme'
import { isMobileViewport } from './responsive'

const FONT = CYBER_FONT

export class DrinkBuilder {
  private scene: Phaser.Scene
  readonly root: Phaser.GameObjects.Container
  private onClear: () => void
  private onServe: () => void
  private onShake: () => void
  private iconObjects: Phaser.GameObjects.GameObject[] = []
  private drinkVisuals: Phaser.GameObjects.GameObject[] = []
  private glass: Phaser.GameObjects.Graphics
  private shaker: Shaker
  private serveButton: Phaser.GameObjects.Rectangle
  private serveLabel: Phaser.GameObjects.Text
  private shakeButton: Phaser.GameObjects.Rectangle
  private shakeLabel: Phaser.GameObjects.Text
  private statusText: Phaser.GameObjects.Text
  private currentRecipe?: Recipe
  private specialAccent = false
  private destroyed = false
  private clearButton: Phaser.GameObjects.Arc

  constructor(scene: Phaser.Scene, onClear: () => void, onServe: () => void, onShake: () => void) {
    this.scene = scene
    this.onClear = onClear
    this.onServe = onServe
    this.onShake = onShake
    this.root = scene.add.container(0, 0)
    const mobile = isMobileViewport()
    const panel = scene.add.rectangle(480, 495, 914, mobile ? 88 : 72, CYBER.panel, 0.76).setStrokeStyle(1, CYBER.cyan, 0.58)
    const topLine = scene.add.rectangle(480, mobile ? 452 : 460, 860, 2, CYBER.magenta, 0.6)

    this.glass = scene.add.graphics().setDepth(12)
    this.drawGlass(105, 495, CYBER.cyan)
    this.shaker = new Shaker(scene, 105, 497)
    this.shaker.root.setVisible(false)
    this.statusText = scene.add.text(164, 475, 'СБОРКА:// ПУСТО', { fontFamily: FONT, fontSize: '11px', color: hex(CYBER.muted) })

    this.clearButton = scene.add.circle(370, 496, mobile ? 23 : 19, CYBER.panelBright).setStrokeStyle(1, CYBER.magenta, 0.6)
      .setInteractive({ useHandCursor: true })
    const clearLabel = scene.add.text(370, 496, 'СБРОС', { fontFamily: FONT, fontSize: '8px', color: hex(CYBER.white) }).setOrigin(0.5)
    this.clearButton.on('pointerdown', () => {
      if (!this.isUsable()) return
      audioManager.notify('glassCleared'); this.onClear()
    })

    this.shakeButton = scene.add.rectangle(535, 496, 250, mobile ? 60 : 50, CYBER.panelBright).setStrokeStyle(1, CYBER.cyanSoft, 0.5)
    this.shakeLabel = scene.add.text(535, 496, '[ ВЗБОЛТАТЬ ]', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: hex(CYBER.muted) }).setOrigin(0.5)
    this.serveButton = scene.add.rectangle(790, 496, 240, mobile ? 60 : 50, CYBER.panelBright).setStrokeStyle(1, CYBER.magenta, 0.45)
    this.serveLabel = scene.add.text(790, 496, 'ПОДАТЬ НАПИТОК  ▶', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: hex(CYBER.muted) }).setOrigin(0.5)
    this.root.add([
      panel, topLine, this.glass, this.shaker.root, this.statusText, this.clearButton, clearLabel,
      this.shakeButton, this.shakeLabel, this.serveButton, this.serveLabel,
    ])
  }

  setRecipe(recipe: Recipe): void {
    if (!this.isUsable()) return
    this.currentRecipe = recipe
    const shake = recipe.preparationMethod === 'shake'
    this.glass.setVisible(!shake)
    this.shaker.root.setVisible(shake)
    this.shakeButton.setVisible(shake)
    this.shakeLabel.setVisible(shake)
  }

  setState(state: DrinkState): void {
    if (!this.isUsable() || !this.currentRecipe) return
    this.iconObjects.forEach((item) => item.destroy())
    this.drinkVisuals.forEach((item) => item.destroy())
    this.iconObjects = []; this.drinkVisuals = []
    const shakeMode = this.currentRecipe.preparationMethod === 'shake'
    this.statusText.setText(state.phase === 'shaken' ? 'ШЕЙКЕР:// ГОТОВО ✓' : state.ingredients.length ? (shakeMode ? 'ШЕЙКЕР:// ЗАГРУЖЕН' : 'СБОРКА:// СМЕШИВАЕМ') : (shakeMode ? 'ШЕЙКЕР:// ПУСТО' : 'СБОРКА:// ПУСТО'))
      .setColor(state.phase === 'shaken' ? hex(CYBER.success) : hex(CYBER.muted))
    this.shaker.setReady(state.phase === 'shaken')
    state.ingredients.forEach((ingredient, index) => {
      if (!shakeMode) this.addGlassDetail(ingredient, index, state.ingredients.length)
      const chip = this.scene.add.container(170 + index * 38, 502).setDepth(20)
      const bg = this.scene.add.circle(0, 0, 15, ingredientColor(ingredient), 0.3).setStrokeStyle(1, CYBER.cyan, 0.58)
      chip.add([bg, createIngredientIcon(this.scene, ingredient, 0, 0, 17)])
      this.root.add(chip)
      this.iconObjects.push(chip)
    })
    this.setShakeEnabled(canShake(state) && shakeMode)
    this.setServeEnabled(canServe(state, this.currentRecipe.preparationMethod))
  }

  animateIngredientFrom(x: number, y: number, ingredient: Ingredient): void {
    if (!this.isUsable()) return
    const icon = createIngredientIcon(this.scene, ingredient, x, y, 27).setDepth(80)
    this.scene.tweens.add({ targets: icon, x: 105, y: 490, scale: 0.45, duration: 280, onComplete: () => {
      if (icon.active) icon.destroy()
    } })
  }

  animateShake(duration: number, onComplete: () => void): void {
    if (!this.isUsable()) return
    this.shaker.shake(this.scene, duration, () => { if (this.isUsable()) onComplete() })
  }

  setShakerNightAccent(enabled: boolean): void {
    if (!this.isUsable()) return
    this.specialAccent = enabled
    this.shakeButton.setStrokeStyle(enabled ? 2 : 1, enabled ? CYBER.violet : CYBER.cyanSoft, enabled ? 0.9 : 0.35)
  }

  flashError(): void {
    if (!this.isUsable()) return
    this.scene.cameras.main.shake(80, 0.003)
    const flash = this.scene.add.circle(105, 495, 50, 0xff4f61, 0.28).setDepth(15)
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.3, duration: 260, onComplete: () => {
      if (flash.active) flash.destroy()
    } })
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.clearButton.removeAllListeners()
    this.shakeButton.removeAllListeners()
    this.serveButton.removeAllListeners()
    this.scene.tweens.killTweensOf(this.root.list)
    this.iconObjects = []
    this.drinkVisuals = []
    this.currentRecipe = undefined
    this.shaker.destroy()
    if (this.root.active) this.root.destroy(true)
  }

  private setShakeEnabled(enabled: boolean): void {
    if (!this.isUsable()) return
    this.shakeButton.removeAllListeners()
    if (!enabled) { this.shakeButton.disableInteractive().setFillStyle(CYBER.panelBright); this.shakeLabel.setColor(hex(CYBER.muted)); return }
    this.shakeButton.setInteractive({ useHandCursor: true }).setFillStyle(this.specialAccent ? CYBER.violet : 0x176477); this.shakeLabel.setColor(hex(CYBER.white))
    this.shakeButton.on('pointerdown', this.onShake)
  }

  private setServeEnabled(enabled: boolean): void {
    if (!this.isUsable()) return
    this.serveButton.removeAllListeners()
    if (!enabled) { this.serveButton.disableInteractive().setFillStyle(CYBER.panelBright); this.serveLabel.setColor(hex(CYBER.muted)); return }
    this.serveButton.setInteractive({ useHandCursor: true }).setFillStyle(CYBER.magenta).setStrokeStyle(1, CYBER.white, 0.8); this.serveLabel.setColor('#100716')
    this.serveButton.on('pointerdown', this.onServe)
  }

  private addGlassDetail(ingredient: Ingredient, index: number, total: number): void {
    if (!this.isUsable()) return
    const height = Math.min(10, 42 / Math.max(1, total))
    const layer = this.scene.add.rectangle(105, 520 - index * height, 52, height + 1, ingredientColor(ingredient), 0.78).setOrigin(0.5, 1).setDepth(10)
    this.drinkVisuals.push(layer)
    this.root.add(layer)
  }

  private drawGlass(x: number, y: number, color: number): void {
    this.glass.lineStyle(4, color, 0.95).beginPath().moveTo(x - 31, y - 29).lineTo(x - 25, y + 27).lineTo(x + 25, y + 27).lineTo(x + 31, y - 29).closePath().strokePath()
  }

  private isUsable(): boolean {
    return !this.destroyed && this.root.active && this.root.scene !== null
  }
}
