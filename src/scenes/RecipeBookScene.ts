import Phaser from 'phaser'
import { loadProgress, markRecipeTutorialSeen, recipeUnlockShift } from '../game/progress'
import { RECIPES } from '../game/recipes'
import { drawBarBackdrop, preloadBarVisuals } from '../ui/BarBackdrop'
import { RecipeCard } from '../ui/RecipeCard'
import { audioManager } from '../audio/AudioManager'
import { ShakeTutorialModal } from '../ui/ShakeTutorialModal'
import { BODY_FONT, CYBER, DISPLAY_FONT } from '../ui/cyberTheme'
import { installResponsiveLayout } from '../ui/LayoutManager'

type RecipeBookData = {
  tutorial?: boolean
  returnScene?: string
}

export class RecipeBookScene extends Phaser.Scene {
  private page = 0
  private pageObjects: Phaser.GameObjects.GameObject[] = []
  private returnScene = 'UpgradeScene'
  private tutorial = false

  constructor() { super('RecipeBookScene') }

  preload(): void {
    preloadBarVisuals(this)
  }

  create(data: RecipeBookData): void {
    this.page = 0
    this.returnScene = data.returnScene ?? 'UpgradeScene'
    this.tutorial = data.tutorial === true
    installResponsiveLayout(this)
    audioManager.setMood('calm')
    drawBarBackdrop(this)
    this.add.rectangle(480, 270, 960, 540, CYBER.void, 0.22)
    this.add.rectangle(480, 48, 650, 70, CYBER.panel, 0.93).setStrokeStyle(1, CYBER.cyan, 0.68)
    this.add.rectangle(480, 82, 648, 2, CYBER.magenta, 0.75)
    this.add.text(480, 36, '📖  КНИГА РЕЦЕПТОВ', {
      fontFamily: DISPLAY_FONT, fontSize: '25px', color: '#eafcff',
    }).setOrigin(0.5)
    this.add.text(480, 70, this.tutorial
      ? 'Новые рецепты открываются после смен. Значок шейкера означает: добавить ингредиенты, взболтать, подать.'
      : 'Открывайте новые коктейли и запоминайте состав.', {
      fontFamily: BODY_FONT, fontSize: '13px', color: '#d7cad9',
    }).setOrigin(0.5)

    this.createButton(120, 510, 178, this.tutorial ? 'ПОНЯТНО' : '←  НАЗАД', () => this.close())
    this.createButton(730, 510, 72, '‹', () => this.changePage(-1))
    this.createButton(840, 510, 72, '›', () => this.changePage(1))
    this.renderPage()
    const progress = loadProgress()
    if (!this.tutorial && !progress.shakeTutorialSeen && RECIPES.some((recipe) => recipe.preparationMethod === 'shake' && recipe.unlockAfterShift <= recipeUnlockShift(progress))) {
      new ShakeTutorialModal(this)
    }
  }

  private renderPage(): void {
    this.pageObjects.forEach((object) => object.destroy())
    this.pageObjects = []
    const progress = loadProgress()
    const pageCount = Math.ceil(RECIPES.length / 4)
    this.page = Phaser.Math.Wrap(this.page, 0, pageCount)
    RECIPES.slice(this.page * 4, this.page * 4 + 4).forEach((recipe, index) => {
      const card = new RecipeCard(
        this,
        index % 2 === 0 ? 258 : 702,
        index < 2 ? 174 : 344,
        recipe,
        recipe.unlockAfterShift <= recipeUnlockShift(progress),
      )
      this.pageObjects.push(card.root)
    })
    const counter = this.add.text(785, 510, `${this.page + 1}/${pageCount}`, {
      fontFamily: BODY_FONT, fontSize: '13px', fontStyle: 'bold', color: '#d7cad9',
    }).setOrigin(0.5)
    this.pageObjects.push(counter)
  }

  private changePage(delta: number): void {
    this.page += delta
    this.renderPage()
  }

  private close(): void {
    if (this.tutorial) markRecipeTutorialSeen()
    this.scene.start(this.returnScene)
  }

  private createButton(x: number, y: number, width: number, label: string, onClick: () => void): void {
    const button = this.add.rectangle(x, y, width, 40, CYBER.panel).setStrokeStyle(1, CYBER.cyan, 0.65)
      .setInteractive({ useHandCursor: true })
    this.add.text(x, y, label, {
      fontFamily: BODY_FONT, fontSize: '12px', fontStyle: 'bold', color: '#f7e6bd',
    }).setOrigin(0.5)
    button.on('pointerover', () => button.setFillStyle(CYBER.panelBright).setStrokeStyle(2, CYBER.magenta, 0.9))
    button.on('pointerout', () => button.setFillStyle(CYBER.panel).setStrokeStyle(1, CYBER.cyan, 0.65))
    button.on('pointerdown', () => {
      audioManager.notify('button')
      onClick()
    })
  }
}
