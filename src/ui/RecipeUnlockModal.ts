import Phaser from 'phaser'
import type { Recipe } from '../game/recipes'
import { audioManager } from '../audio/AudioManager'
import { createIngredientSequence } from './IngredientIcon'
import { BODY_FONT, CYBER, CYBER_FONT, DISPLAY_FONT, UI_RADIUS, UI_STROKE } from './cyberTheme'
import { createCocktailIcon } from './CocktailIcon'

export class RecipeUnlockModal {
  readonly root: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene, recipes: Recipe[], onRecipes: () => void, onContinue: () => void) {
    const recipe = recipes[0]!
    this.root = scene.add.container(0, 0).setDepth(300)
    const blocker = scene.add.rectangle(480, 270, 960, 540, CYBER.void, 0.84).setInteractive()
    const glow = scene.add.circle(480, 250, 210, CYBER.magenta, 0.12)
    const panel = scene.add.graphics()
    panel.fillStyle(CYBER.panel, 1).fillRoundedRect(250, 88, 460, 364, UI_RADIUS.large)
    panel.lineStyle(1.5, CYBER.cyan, UI_STROKE.strong).strokeRoundedRect(250, 88, 460, 364, UI_RADIUS.large)
    const title = scene.add.text(480, 126, 'НОВЫЙ РЕЦЕПТ!', {
      fontFamily: DISPLAY_FONT, fontSize: '22px', color: '#72f1ff',
    }).setOrigin(0.5)
    const iconPlate = scene.add.circle(480, 196, 45, CYBER.panelBright, 0.7).setStrokeStyle(1, CYBER.cyan, 0.55)
    const icon = createCocktailIcon(scene, recipe, 480, 196, 78)
    const name = scene.add.text(480, 247, recipe.name, {
      fontFamily: BODY_FONT, fontSize: '23px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    const line = createIngredientSequence(scene, recipe.ingredients, 285, 291, {
      iconSize: 18, showNames: true, color: '#ddcfae', maxWidth: 390,
    })
    const view = this.button(scene, 370, 397, 200, 'ПОСМОТРЕТЬ РЕЦЕПТЫ', 0x3a2b40, onRecipes)
    const next = this.button(scene, 590, 397, 190, 'ПРОДОЛЖИТЬ  →', 0xc74f4f, onContinue)
    this.root.add([blocker, glow, panel, title, iconPlate, icon, name, line, ...view, ...next])
    scene.tweens.add({ targets: [panel, title, icon, name, line], scaleX: { from: 0.86, to: 1 }, scaleY: { from: 0.86, to: 1 }, duration: 220, ease: 'Back.easeOut' })
    scene.tweens.add({ targets: icon, angle: { from: -6, to: 6 }, y: 188, duration: 260, yoyo: true, repeat: 1 })
    for (let index = 0; index < 18; index += 1) {
      const particle = scene.add.circle(480, 190, Phaser.Math.Between(2, 5), index % 2 ? CYBER.cyan : CYBER.magenta, 0.9).setDepth(301)
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const distance = Phaser.Math.Between(70, 170)
      scene.tweens.add({
        targets: particle,
        x: 480 + Math.cos(angle) * distance,
        y: 210 + Math.sin(angle) * distance,
        alpha: 0,
        duration: 650,
        onComplete: () => particle.destroy(),
      })
    }
  }

  private button(
    scene: Phaser.Scene, x: number, y: number, width: number, label: string, color: number, onClick: () => void,
  ): Phaser.GameObjects.GameObject[] {
    const bg = scene.add.rectangle(x, y, width, 46, color).setStrokeStyle(1, 0xf0c975, 0.35)
      .setInteractive({ useHandCursor: true })
    const text = scene.add.text(x, y, label, {
      fontFamily: CYBER_FONT, fontSize: '11px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    bg.on('pointerover', () => bg.setAlpha(0.82))
    bg.on('pointerout', () => bg.setAlpha(1))
    bg.on('pointerdown', () => {
      audioManager.notify('button')
      onClick()
    })
    return [bg, text]
  }
}
