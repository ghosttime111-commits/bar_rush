import Phaser from 'phaser'
import type { Ingredient, IngredientCategory } from '../game/ingredients'
import { ingredientDefinition } from '../game/ingredients'
import { CYBER, CYBER_FONT, hex } from './cyberTheme'

const TABS: Array<{ id: IngredientCategory; label: string }> = [
  { id: 'alcohol', label: 'АЛКОГОЛЬ' },
  { id: 'mixer', label: 'НАПОЛНИТЕЛИ' },
  { id: 'garnish', label: 'ДОБАВКИ' },
]

export class IngredientTabs {
  readonly objects: Phaser.GameObjects.GameObject[] = []
  private backgrounds = new Map<IngredientCategory, Phaser.GameObjects.Rectangle>()

  constructor(
    scene: Phaser.Scene,
    ingredients: Ingredient[],
    active: IngredientCategory,
    onSelect: (category: IngredientCategory) => void,
  ) {
    TABS.forEach((tab, index) => {
      const count = ingredients.filter((ingredient) => ingredientDefinition(ingredient).category === tab.id).length
      const x = 286 + index * 194
      const background = scene.add.rectangle(x, 318, 180, 25, tab.id === active ? CYBER.cyan : CYBER.panel, tab.id === active ? 0.92 : 0.68)
        .setStrokeStyle(1, tab.id === active ? CYBER.white : CYBER.cyanSoft, 0.7)
        .setInteractive({ useHandCursor: true }).setDepth(45)
      const label = scene.add.text(x, 318, `${tab.label}  ${count}`, {
        fontFamily: CYBER_FONT,
        fontSize: '10px', fontStyle: 'bold', color: tab.id === active ? '#07101a' : hex(CYBER.white),
      }).setOrigin(0.5).setDepth(46)
      background.on('pointerdown', () => onSelect(tab.id))
      this.backgrounds.set(tab.id, background)
      this.objects.push(background, label)
    })
  }

  destroy(): void {
    this.backgrounds.forEach((background) => background.removeAllListeners())
    this.objects.forEach((object) => { if (object.active) object.destroy() })
    this.objects.length = 0
    this.backgrounds.clear()
  }
}
