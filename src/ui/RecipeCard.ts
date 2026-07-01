import Phaser from 'phaser'
import type { Recipe } from '../game/recipes'
import { createIngredientSequence } from './IngredientIcon'
import { preparationLabel } from '../game/preparationMethods'
import { BODY_FONT, CYBER, CYBER_FONT, hex, UI_RADIUS, UI_STROKE } from './cyberTheme'
import { createCocktailIcon } from './CocktailIcon'
import { createPreparationMethodIcon } from './PreparationMethodIcon'

export class RecipeCard {
  readonly root: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene, x: number, y: number, recipe: Recipe, unlocked: boolean) {
    this.root = scene.add.container(x, y)
    const graphics = scene.add.graphics()
    graphics.fillStyle(unlocked ? CYBER.panel : 0x0b0c1a, unlocked ? 0.76 : 0.8)
    graphics.fillRoundedRect(-207, -72, 414, 144, UI_RADIUS.normal)
    graphics.lineStyle(1.5, unlocked ? CYBER.cyan : CYBER.muted, unlocked ? UI_STROKE.normal : UI_STROKE.subtle)
    graphics.strokeRoundedRect(-207, -72, 414, 144, UI_RADIUS.normal)
    graphics.fillStyle(unlocked ? CYBER.magenta : CYBER.muted, 0.65).fillRect(-207, -58, 3, 116)
    const shadow = scene.add.rectangle(0, 5, 414, 144, 0x01020a, 0.5).setOrigin(0.5)
    this.root.add([shadow, graphics])

    const textColor = unlocked ? hex(CYBER.white) : hex(CYBER.muted)
    const iconPlate = scene.add.rectangle(-166, -28, 66, 76, CYBER.panelBright, 0.55)
      .setStrokeStyle(1, CYBER.cyanSoft, unlocked ? 0.48 : 0.22)
    const icon = unlocked
      ? createCocktailIcon(scene, recipe, -166, -28, 58)
      : scene.add.text(-166, -28, '🔒', { fontSize: '35px' }).setOrigin(0.5).setAlpha(0.55)
    const name = scene.add.text(-124, -48, recipe.name, {
      fontFamily: CYBER_FONT, fontSize: '16px', fontStyle: 'bold', color: textColor,
    }).setOrigin(0, 0.5)
    const difficulty = scene.add.text(175, -48, '★'.repeat(recipe.difficulty), {
      fontFamily: CYBER_FONT, fontSize: '12px', color: unlocked ? hex(CYBER.magenta) : hex(CYBER.muted),
    }).setOrigin(1, 0.5)
    const ingredients = unlocked
      ? createIngredientSequence(scene, recipe.ingredients, -124, -10, {
        iconSize: 16, showNames: true, color: hex(CYBER.cyanSoft), maxWidth: 294,
      })
      : scene.add.text(-124, -10, `Откроется после смены ${recipe.unlockAfterShift}`, {
        fontFamily: CYBER_FONT, fontSize: '12px', fontStyle: 'bold', color: hex(CYBER.amber),
      }).setOrigin(0, 0.5)
    const footer = scene.add.text(-124, 43, unlocked ? `${recipe.description}   •   $${recipe.reward}` : 'Ингредиенты пока скрыты', {
      fontFamily: BODY_FONT, fontSize: '11px', color: unlocked ? '#aebad0' : hex(CYBER.muted),
      wordWrap: { width: 300 },
    }).setOrigin(0, 0.5)
    const method = scene.add.text(177, 43, unlocked ? preparationLabel(recipe.preparationMethod) : '', {
      fontFamily: CYBER_FONT, fontSize: '10px', fontStyle: 'bold', color: recipe.preparationMethod === 'shake' ? hex(CYBER.magenta) : hex(CYBER.cyan),
    }).setOrigin(1, 0.5)
    const methodIcon = unlocked
      ? createPreparationMethodIcon(scene, recipe.preparationMethod, 177 - method.width - 15, 43, 18)
      : undefined
    this.root.add([iconPlate, icon, name, difficulty, ingredients, footer, method])
    if (methodIcon) this.root.add(methodIcon)
  }
}
