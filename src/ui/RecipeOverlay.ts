import Phaser from 'phaser'
import type { Recipe } from '../game/recipes'
import { audioManager } from '../audio/AudioManager'
import { createIngredientSequence } from './IngredientIcon'
import { preparationIcon, preparationLabel } from '../game/preparationMethods'
import { BODY_FONT, CYBER, CYBER_FONT, hex } from './cyberTheme'
import { createCocktailIcon } from './CocktailIcon'

export class RecipeOverlay {
  readonly root: Phaser.GameObjects.Container
  private destroyed = false

  constructor(scene: Phaser.Scene, recipes: Recipe[], onClose: () => void) {
    this.root = scene.add.container(0, 0).setDepth(300)
    const blocker = scene.add.rectangle(480, 270, 960, 540, 0x030510, 0.88)
      .setInteractive()
    const panel = scene.add.graphics()
    panel.fillStyle(CYBER.panel, 0.88).fillRoundedRect(92, 48, 776, 444, 8)
    panel.lineStyle(2, CYBER.cyan, 0.75).strokeRoundedRect(92, 48, 776, 444, 8)
    panel.lineStyle(1, CYBER.magenta, 0.65).lineBetween(116, 105, 844, 105)
    const title = scene.add.text(480, 82, 'АРХИВ РЕЦЕПТОВ // ОТКРЫТ', {
      fontFamily: CYBER_FONT, fontSize: '21px', fontStyle: 'bold', color: hex(CYBER.cyan),
    }).setOrigin(0.5)
    const closeBg = scene.add.rectangle(830, 82, 42, 34, CYBER.panelBright).setStrokeStyle(1, CYBER.magenta, 0.7)
      .setInteractive({ useHandCursor: true })
    const closeText = scene.add.text(830, 82, '×', {
      fontFamily: CYBER_FONT, fontSize: '22px', color: hex(CYBER.white),
    }).setOrigin(0.5)
    this.root.add([blocker, panel, title, closeBg, closeText])

    recipes.forEach((recipe, index) => {
      const column = index % 2
      const row = Math.floor(index / 2)
      const x = column === 0 ? 122 : 492
      const y = 125 + row * 66
      const card = scene.add.rectangle(x + 168, y + 25, 342, 56, CYBER.panelSoft, 0.7)
        .setStrokeStyle(1, CYBER.cyanSoft, 0.55)
      const iconPlate = scene.add.rectangle(x + 27, y + 25, 44, 44, CYBER.panelBright, 0.55)
        .setStrokeStyle(1, CYBER.cyanSoft, 0.38)
      const icon = createCocktailIcon(scene, recipe, x + 27, y + 25, 38)
      const name = scene.add.text(x + 56, y + 12, recipe.name, {
        fontFamily: CYBER_FONT, fontSize: '13px', fontStyle: 'bold', color: hex(CYBER.white),
        wordWrap: { width: 205 },
      }).setOrigin(0, 0.5)
      const ingredients = createIngredientSequence(scene, recipe.ingredients, x + 56, y + 36, {
        iconSize: 18, color: hex(CYBER.muted), maxWidth: 258,
      })
      const method = scene.add.text(x + 320, y + 12, `${preparationIcon(recipe.preparationMethod)} ${preparationLabel(recipe.preparationMethod)}`, {
        fontFamily: BODY_FONT, fontSize: '10px', fontStyle: 'bold', color: hex(CYBER.magenta),
      }).setOrigin(1, 0.5)
      this.root.add([card, iconPlate, icon, name, ingredients, method])
    })

    closeBg.on('pointerover', () => closeBg.setFillStyle(CYBER.magenta))
    closeBg.on('pointerout', () => closeBg.setFillStyle(CYBER.panelBright))
    closeBg.on('pointerdown', () => {
      audioManager.notify('button')
      this.destroy()
      onClose()
    })
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.root.active) this.root.destroy(true)
  }
}
