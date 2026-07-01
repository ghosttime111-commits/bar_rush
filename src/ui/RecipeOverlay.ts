import Phaser from 'phaser'
import type { Recipe } from '../game/recipes'
import { audioManager } from '../audio/AudioManager'
import { createIngredientSequence } from './IngredientIcon'
import { preparationLabel } from '../game/preparationMethods'
import { BODY_FONT, CYBER, CYBER_FONT, DISPLAY_FONT, hex, UI_RADIUS, UI_STROKE } from './cyberTheme'
import { createCocktailIcon } from './CocktailIcon'
import { createPreparationMethodIcon } from './PreparationMethodIcon'

type ScrollViewport = {
  x: number
  y: number
  width: number
  height: number
}

const CARD_HEIGHT = 56
const CARD_GAP = 10
const ROW_STEP = CARD_HEIGHT + CARD_GAP

export class RecipeOverlay {
  readonly root: Phaser.GameObjects.Container
  private readonly scene: Phaser.Scene
  private readonly recipes: Recipe[]
  private readonly onClose: () => void
  private readonly blocker: Phaser.GameObjects.Rectangle
  private readonly panel: Phaser.GameObjects.Graphics
  private readonly title: Phaser.GameObjects.Text
  private readonly closeBg: Phaser.GameObjects.Rectangle
  private readonly closeText: Phaser.GameObjects.Text
  private readonly scrollContainer: Phaser.GameObjects.Container
  private readonly scrollHitArea: Phaser.GameObjects.Rectangle
  private readonly scrollbarTrack: Phaser.GameObjects.Rectangle
  private readonly scrollbarThumb: Phaser.GameObjects.Rectangle
  private viewport: ScrollViewport = { x: 116, y: 116, width: 718, height: 350 }
  private maskGraphics?: Phaser.GameObjects.Graphics
  private geometryMask?: Phaser.Display.Masks.GeometryMask
  private scrollY = 0
  private maxScroll = 0
  private activePointerId: number | null = null
  private lastPointerY = 0
  private destroyed = false

  private readonly handleWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void => {
    if (!this.contains(pointer.worldX, pointer.worldY) || this.maxScroll <= 0) return
    pointer.event?.preventDefault()
    pointer.event?.stopPropagation()
    this.setScroll(this.scrollY + deltaY * 0.65)
  }

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id !== this.activePointerId || !pointer.isDown) return
    const delta = pointer.worldY - this.lastPointerY
    this.lastPointerY = pointer.worldY
    if (Math.abs(delta) < 0.1) return
    pointer.event?.preventDefault()
    pointer.event?.stopPropagation()
    this.setScroll(this.scrollY - delta)
  }

  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id === this.activePointerId) this.activePointerId = null
  }

  private readonly handleResize = (): void => {
    if (!this.destroyed) this.layout()
  }

  private readonly handleSceneShutdown = (): void => this.destroy()

  constructor(scene: Phaser.Scene, recipes: Recipe[], onClose: () => void) {
    this.scene = scene
    this.recipes = recipes
    this.onClose = onClose
    this.root = scene.add.container(0, 0).setDepth(300)

    this.blocker = scene.add.rectangle(480, 270, 960, 540, 0x030510, 0.88)
      .setInteractive()
    this.panel = scene.add.graphics()
    this.scrollContainer = scene.add.container(0, 0)
    this.scrollHitArea = scene.add.rectangle(480, 290, 720, 350, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
    this.scrollbarTrack = scene.add.rectangle(844, 291, 4, 350, CYBER.void, 0.72)
    this.scrollbarThumb = scene.add.rectangle(844, 150, 6, 60, CYBER.cyan, 0.72)
    this.title = scene.add.text(480, 82, 'АРХИВ РЕЦЕПТОВ // ОТКРЫТ', {
      fontFamily: DISPLAY_FONT,
      fontSize: '19px',
      color: hex(CYBER.cyan),
    }).setOrigin(0.5)
    this.closeBg = scene.add.rectangle(830, 82, 42, 34, CYBER.panelBright)
      .setStrokeStyle(1, CYBER.magenta, 0.7)
      .setInteractive({ useHandCursor: true })
    this.closeText = scene.add.text(830, 82, '×', {
      fontFamily: CYBER_FONT,
      fontSize: '22px',
      color: hex(CYBER.white),
    }).setOrigin(0.5)

    this.root.add([
      this.blocker,
      this.panel,
      this.scrollContainer,
      this.scrollHitArea,
      this.scrollbarTrack,
      this.scrollbarThumb,
      this.title,
      this.closeBg,
      this.closeText,
    ])

    this.scrollHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.activePointerId = pointer.id
      this.lastPointerY = pointer.worldY
      pointer.event?.stopPropagation()
    })
    this.closeBg.on('pointerover', () => this.closeBg.setFillStyle(CYBER.magenta))
    this.closeBg.on('pointerout', () => this.closeBg.setFillStyle(CYBER.panelBright))
    this.closeBg.on('pointerdown', () => this.close())

    scene.input.on('wheel', this.handleWheel)
    scene.input.on('pointermove', this.handlePointerMove)
    scene.input.on('pointerup', this.handlePointerUp)
    scene.input.on('pointerupoutside', this.handlePointerUp)
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize)
    window.addEventListener('orientationchange', this.handleResize)
    window.visualViewport?.addEventListener('resize', this.handleResize)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown)
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.handleSceneShutdown)

    this.layout()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.scene.input.off('wheel', this.handleWheel)
    this.scene.input.off('pointermove', this.handlePointerMove)
    this.scene.input.off('pointerup', this.handlePointerUp)
    this.scene.input.off('pointerupoutside', this.handlePointerUp)
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize)
    window.removeEventListener('orientationchange', this.handleResize)
    window.visualViewport?.removeEventListener('resize', this.handleResize)
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown)
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.handleSceneShutdown)
    this.activePointerId = null
    this.scrollContainer.clearMask(false)
    this.geometryMask?.destroy()
    this.geometryMask = undefined
    this.maskGraphics?.destroy()
    this.maskGraphics = undefined
    if (this.root.active) this.root.destroy(true)
  }

  private close(): void {
    if (this.destroyed) return
    audioManager.notify('button')
    this.destroy()
    this.onClose()
  }

  private layout(): void {
    const portrait = window.innerHeight > window.innerWidth
    const columns = portrait ? 1 : 2
    const panelX = portrait ? 64 : 92
    const panelWidth = portrait ? 832 : 776
    const panelY = 48
    const panelHeight = 444
    const panelRight = panelX + panelWidth
    const centerX = panelX + panelWidth / 2

    this.panel.clear()
    this.panel.fillStyle(CYBER.panel, 0.92).fillRoundedRect(panelX, panelY, panelWidth, panelHeight, UI_RADIUS.large)
    this.panel.lineStyle(1.5, CYBER.cyan, UI_STROKE.strong)
      .strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, UI_RADIUS.large)
    this.panel.lineStyle(1, CYBER.magenta, 0.65).lineBetween(panelX + 24, 105, panelRight - 24, 105)

    this.title.setPosition(centerX, 82)
    this.closeBg.setPosition(panelRight - 38, 82)
    this.closeText.setPosition(panelRight - 38, 82)
    this.viewport = {
      x: panelX + 24,
      y: 116,
      width: panelWidth - 58,
      height: 350,
    }
    this.scrollHitArea
      .setPosition(this.viewport.x + this.viewport.width / 2, this.viewport.y + this.viewport.height / 2)
      .setDisplaySize(this.viewport.width, this.viewport.height)
    this.scrollbarTrack
      .setPosition(panelRight - 18, this.viewport.y + this.viewport.height / 2)
      .setDisplaySize(4, this.viewport.height)

    this.rebuildCards(columns)
    this.rebuildMask()
    this.setScroll(this.scrollY)
  }

  private rebuildCards(columns: number): void {
    this.scrollContainer.removeAll(true)
    const horizontalGap = columns === 1 ? 0 : 14
    const usableWidth = this.viewport.width - 12
    const cardWidth = (usableWidth - horizontalGap * (columns - 1)) / columns
    const rowCount = Math.ceil(this.recipes.length / columns)

    this.recipes.forEach((recipe, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = this.viewport.x + cardWidth / 2 + column * (cardWidth + horizontalGap)
      const y = row * ROW_STEP + CARD_HEIGHT / 2
      this.createCard(recipe, x, y, cardWidth)
    })

    const contentHeight = rowCount > 0 ? (rowCount - 1) * ROW_STEP + CARD_HEIGHT : 0
    this.maxScroll = Math.max(0, contentHeight - this.viewport.height)
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll)
  }

  private createCard(recipe: Recipe, x: number, y: number, width: number): void {
    const left = x - width / 2
    const right = x + width / 2
    const card = this.scene.add.rectangle(x, y, width, CARD_HEIGHT, CYBER.panelSoft, 0.7)
      .setStrokeStyle(1, CYBER.cyanSoft, 0.55)
    const iconPlate = this.scene.add.rectangle(left + 27, y, 44, 44, CYBER.panelBright, 0.55)
      .setStrokeStyle(1, CYBER.cyanSoft, 0.38)
    const icon = createCocktailIcon(this.scene, recipe, left + 27, y, 38)
    const methodText = this.scene.add.text(right - 12, y - 13, preparationLabel(recipe.preparationMethod), {
      fontFamily: BODY_FONT,
      fontSize: '10px',
      fontStyle: 'bold',
      color: recipe.preparationMethod === 'shake' ? hex(CYBER.magenta) : hex(CYBER.cyan),
    }).setOrigin(1, 0.5)
    const methodIcon = createPreparationMethodIcon(
      this.scene,
      recipe.preparationMethod,
      right - 12 - methodText.width - 14,
      y - 13,
      17,
    )
    const name = this.scene.add.text(left + 56, y - 13, recipe.name, {
      fontFamily: CYBER_FONT,
      fontSize: '13px',
      fontStyle: 'bold',
      color: hex(CYBER.white),
      wordWrap: { width: Math.max(100, width - methodText.width - 110) },
    }).setOrigin(0, 0.5)
    const ingredients = createIngredientSequence(this.scene, recipe.ingredients, left + 56, y + 13, {
      iconSize: 18,
      color: hex(CYBER.muted),
      maxWidth: Math.max(120, width - 72),
    })
    this.scrollContainer.add([card, iconPlate, icon, name, ingredients, methodIcon, methodText])
  }

  private rebuildMask(): void {
    this.scrollContainer.clearMask(false)
    this.geometryMask?.destroy()
    this.maskGraphics?.destroy()
    this.maskGraphics = this.scene.add.graphics()
      .fillStyle(0xffffff)
      .fillRect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height)
      .setVisible(false)
    this.geometryMask = this.maskGraphics.createGeometryMask()
    this.scrollContainer.setMask(this.geometryMask)
  }

  private setScroll(value: number): void {
    this.scrollY = Phaser.Math.Clamp(value, 0, this.maxScroll)
    this.scrollContainer.setY(this.viewport.y - this.scrollY)
    const scrollable = this.maxScroll > 0
    this.scrollbarTrack.setVisible(scrollable)
    this.scrollbarThumb.setVisible(scrollable)
    if (!scrollable) return

    const contentHeight = this.viewport.height + this.maxScroll
    const thumbHeight = Math.max(34, this.viewport.height * (this.viewport.height / contentHeight))
    const travel = this.viewport.height - thumbHeight
    const progress = this.maxScroll > 0 ? this.scrollY / this.maxScroll : 0
    this.scrollbarThumb
      .setPosition(this.scrollbarTrack.x, this.viewport.y + thumbHeight / 2 + travel * progress)
      .setDisplaySize(6, thumbHeight)
  }

  private contains(x: number, y: number): boolean {
    return x >= this.viewport.x
      && x <= this.viewport.x + this.viewport.width
      && y >= this.viewport.y
      && y <= this.viewport.y + this.viewport.height
  }
}
