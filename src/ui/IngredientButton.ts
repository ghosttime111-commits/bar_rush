import Phaser from 'phaser'
import { ingredientColor, ingredientDefinition } from '../game/ingredients'
import type { Ingredient } from '../game/ingredients'
import { responsiveFont } from './responsive'
import { audioManager } from '../audio/AudioManager'
import { createIngredientIcon } from './IngredientIcon'
import { BODY_FONT, CYBER, hex } from './cyberTheme'

export class IngredientButton {
  readonly root: Phaser.GameObjects.Container
  private background: Phaser.GameObjects.Rectangle
  private selectedGlow: Phaser.GameObjects.Rectangle
  private baseY: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    ingredient: Ingredient,
    onPick: (ingredient: Ingredient, x: number, y: number) => void,
  ) {
    this.baseY = y
    this.root = scene.add.container(x, y)
    const shadow = scene.add.rectangle(0, 4, width, height, 0x01020a, 0.7)
    this.selectedGlow = scene.add.rectangle(0, 0, width + 4, height + 4, CYBER.magenta, 0)
      .setStrokeStyle(2, CYBER.cyan, 0)
    this.background = scene.add.rectangle(0, 0, width, height, CYBER.panel, 0.76)
      .setStrokeStyle(1, CYBER.cyanSoft, 0.42)
      .setInteractive({ useHandCursor: true })
    const definition = ingredientDefinition(ingredient)
    const iconZoneWidth = Math.min(width * 0.38, height * 1.02)
    const iconX = -width / 2 + iconZoneWidth / 2 + 3
    const textX = -width / 2 + iconZoneWidth + 7
    const textWidth = Math.max(38, width - iconZoneWidth - 13)
    const iconCircle = scene.add.circle(iconX, 0, height * 0.34, ingredientColor(ingredient), 0.3)
      .setStrokeStyle(1, CYBER.cyan, 0.42)
    const icon = createIngredientIcon(scene, ingredient, iconX, -1, Math.round(height * 0.58))
    const label = scene.add.text(textX, 0, definition.shortName, {
      fontFamily: BODY_FONT,
      fontSize: responsiveFont(Math.max(12, Math.round(height * 0.21)), 1.06),
      fontStyle: 'bold',
      color: hex(CYBER.white),
      align: 'left',
      lineSpacing: -3,
      wordWrap: { width: textWidth, useAdvancedWrap: true },
    }).setOrigin(0, 0.5)
    this.root.add([shadow, this.selectedGlow, this.background, iconCircle, icon, label])

    this.background.on('pointerover', () => {
      audioManager.notify('button')
      this.background.setFillStyle(CYBER.panelBright, 0.88).setStrokeStyle(1, CYBER.cyan, 0.9)
      scene.tweens.add({ targets: this.root, y: this.baseY - 2, scale: 1.025, duration: 80 })
    })
    this.background.on('pointerout', () => {
      this.background.setFillStyle(CYBER.panel, 0.76).setStrokeStyle(1, CYBER.cyanSoft, 0.52)
      scene.tweens.add({ targets: this.root, y: this.baseY, scale: 1, duration: 80 })
    })
    this.background.on('pointerdown', () => {
      audioManager.notify('button')
      scene.tweens.add({ targets: this.root, scale: 0.92, duration: 60, yoyo: true })
      onPick(ingredient, x, y)
    })
  }

  setSelected(selected: boolean): void {
    this.selectedGlow
      .setFillStyle(CYBER.magenta, selected ? 0.12 : 0)
      .setStrokeStyle(2, CYBER.cyan, selected ? 0.9 : 0)
  }

  destroy(): void {
    this.background.removeAllListeners()
    if (this.root.active) this.root.destroy(true)
  }
}
