import Phaser from 'phaser'
import type { CustomerType } from '../game/customers'
import type { Recipe } from '../game/recipes'
import type { CustomerArchetype, CustomerSpriteDefinition } from '../game/customerSprites'
import { responsiveFont } from './responsive'
import { audioManager } from '../audio/AudioManager'
import { BODY_FONT, CYBER, CYBER_FONT, hex } from './cyberTheme'
import { createCocktailIcon } from './CocktailIcon'

export class CustomerCard {
  private scene: Phaser.Scene
  readonly root: Phaser.GameObjects.Container
  private frame: Phaser.GameObjects.Rectangle
  private glow: Phaser.GameObjects.Rectangle
  private selectionLight: Phaser.GameObjects.Ellipse
  private avatarFallback: Phaser.GameObjects.Graphics
  private avatarImage: Phaser.GameObjects.Image
  private successFlash: Phaser.GameObjects.Rectangle
  private orderIcon?: Phaser.GameObjects.Container
  private orderName: Phaser.GameObjects.Text
  private typeText: Phaser.GameObjects.Text
  private patienceBar: Phaser.GameObjects.Rectangle
  private patienceGlow: Phaser.GameObjects.Rectangle
  private spriteKey: string
  private look: CustomerArchetype
  private spriteDisplay: Pick<CustomerSpriteDefinition, 'scaleMultiplier' | 'offsetX' | 'offsetY'>
  private selected = false
  private lowPatience = false
  private vip = false
  private destroyed = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sprite: CustomerSpriteDefinition,
    onSelect: () => void,
  ) {
    this.scene = scene
    this.spriteKey = sprite.key
    this.look = sprite.archetype
    this.spriteDisplay = sprite
    this.root = scene.add.container(x, y)
    this.selectionLight = scene.add.ellipse(0, -24, 236, 210, CYBER.cyan, 0)
    this.glow = scene.add.rectangle(0, 0, 216, 240, CYBER.magenta, 0)
      .setStrokeStyle(2, CYBER.cyan, 0)
    const shadow = scene.add.rectangle(0, 7, 208, 232, 0x02030b, 0.68)
    this.frame = scene.add.rectangle(0, 0, 208, 232, CYBER.panel, 0.74)
      .setStrokeStyle(1, CYBER.cyanSoft, 0.6)
      .setInteractive({ useHandCursor: true })
    this.avatarFallback = scene.add.graphics()
    this.avatarImage = scene.add.image(0, 28, this.resolveSpriteTexture(sprite)).setOrigin(0.5, 1)
    this.fitAvatarImage()
    this.successFlash = scene.add.rectangle(0, -36, 184, 132, CYBER.success, 0)
      .setStrokeStyle(2, CYBER.success, 0)
    const orderShadow = scene.add.graphics()
    orderShadow.fillStyle(0x02030b, 0.58).fillRect(-91, 50, 182, 57)
    const orderPanel = scene.add.graphics()
    orderPanel.fillStyle(0x0a0e23, 0.78).fillRoundedRect(-91, 46, 182, 57, 4)
    orderPanel.lineStyle(1, CYBER.cyan, 0.72).strokeRoundedRect(-91, 46, 182, 57, 4)
    orderPanel.fillStyle(CYBER.magenta, 0.9).fillRect(-91, 52, 3, 45)
    const orderIconPlate = scene.add.rectangle(-63, 74, 45, 45, CYBER.panelBright, 0.62)
      .setStrokeStyle(1, CYBER.cyanSoft, 0.42)
    this.orderName = scene.add.text(-32, 74, '', {
      fontFamily: BODY_FONT, fontSize: responsiveFont(14, 1.04), fontStyle: 'bold', color: hex(CYBER.white),
      wordWrap: { width: 116, useAdvancedWrap: true }, align: 'left', lineSpacing: -2,
    }).setOrigin(0, 0.5)
    const typePlate = scene.add.rectangle(0, 32, 142, 22, 0x060817, 0.72)
      .setStrokeStyle(1, CYBER.magenta, 0.42)
    this.typeText = scene.add.text(0, 32, '', {
      fontFamily: CYBER_FONT, fontSize: responsiveFont(10, 1.06), fontStyle: 'bold', color: hex(CYBER.white),
    }).setOrigin(0.5)

    const patienceBg = scene.add.rectangle(0, 111, 174, 12, 0x252943).setOrigin(0.5)
    this.patienceGlow = scene.add.rectangle(-87, 111, 174, 12, CYBER.danger, 0)
      .setOrigin(0, 0.5)
    this.patienceBar = scene.add.rectangle(-87, 111, 174, 12, CYBER.success)
      .setOrigin(0, 0.5)

    this.root.add([
      this.selectionLight, shadow, this.glow, this.frame, this.successFlash,
      this.avatarFallback, this.avatarImage, typePlate, this.typeText,
      orderShadow, orderPanel, orderIconPlate, this.orderName,
      patienceBg, this.patienceGlow, this.patienceBar,
    ])
    this.drawFallbackAvatar(false)
    this.syncAvatarVisibility()
    this.scene.tweens.add({
      targets: [this.avatarImage, this.avatarFallback],
      y: '+=2',
      duration: 1450 + Phaser.Math.Between(0, 350),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    this.frame.on('pointerdown', () => {
      audioManager.notify('customerSelected')
      onSelect()
    })
    this.frame.on('pointerover', () => {
      if (!this.selected) scene.tweens.add({ targets: this.root, scale: 1.025, duration: 90 })
    })
    this.frame.on('pointerout', () => {
      if (!this.selected) scene.tweens.add({ targets: this.root, scale: 0.97, duration: 90 })
    })
  }

  setOrder(recipe: Recipe, type: CustomerType): void {
    if (!this.isUsable()) return
    this.orderIcon?.destroy(true)
    this.orderIcon = createCocktailIcon(this.scene, recipe, -63, 74, 39)
    this.root.add(this.orderIcon)
    this.orderName.setText(recipe.name)
    this.typeText.setText(`${this.vip ? 'VIP  ·  ' : ''}${type.badge}  ${type.name}`)
  }

  setVip(enabled: boolean): void {
    if (!this.isUsable()) return
    this.vip = enabled
    this.frame.setFillStyle(enabled ? 0x211c2e : CYBER.panel, 0.76)
    if (enabled) this.glow.setFillStyle(CYBER.amber, 0.07).setStrokeStyle(2, CYBER.amber, 0.5)
  }

  setSprite(sprite: CustomerSpriteDefinition): void {
    if (!this.isUsable()) return
    this.spriteKey = sprite.key
    this.look = sprite.archetype
    this.spriteDisplay = sprite
    const textureKey = this.resolveSpriteTexture(sprite)
    if (this.scene.textures.exists(textureKey)) {
      this.avatarImage.setTexture(textureKey)
      this.fitAvatarImage()
    }
    this.syncAvatarVisibility()
  }

  getSpriteKey(): string {
    return this.spriteKey
  }

  setSelected(selected: boolean): void {
    if (!this.isUsable()) return
    this.selected = selected
    this.frame.setStrokeStyle(selected ? 2 : 1, selected ? CYBER.cyan : CYBER.cyanSoft, selected ? 1 : 0.5)
    this.glow.setFillStyle(CYBER.magenta, selected ? 0.075 : 0).setStrokeStyle(2, CYBER.magenta, selected ? 0.58 : 0)
    this.selectionLight.setAlpha(selected ? 0.07 : 0)
    this.avatarImage.setAlpha(selected ? 1 : 0.88)
    this.avatarFallback.setAlpha(selected ? 1 : 0.88)
    this.root.setScale(selected ? 1.035 : 0.97).setDepth(selected ? 12 : 8)
  }

  setPatience(ratio: number): void {
    if (!this.isUsable()) return
    this.patienceBar.setScale(ratio, 1)
    this.patienceBar.setFillStyle(patienceColor(ratio))
    const nowLow = ratio <= 0.25
    if (nowLow !== this.lowPatience) {
      this.lowPatience = nowLow
      this.scene.tweens.killTweensOf([this.patienceBar, this.patienceGlow])
      this.patienceGlow.setAlpha(0)
      this.patienceBar.setAlpha(1)
      if (nowLow) {
        this.scene.tweens.add({
          targets: [this.patienceBar, this.patienceGlow],
          alpha: { from: 1, to: 0.28 },
          duration: 260,
          yoyo: true,
          repeat: -1,
        })
      }
    }
  }

  celebrate(onComplete: () => void): void {
    if (!this.isUsable()) return
    this.drawFallbackAvatar(true)
    this.successFlash.setFillStyle(0x78e99a, 0.22).setStrokeStyle(3, 0x8cffac, 0.7)
      .setAlpha(1).setScale(1)
    this.scene.tweens.add({ targets: this.successFlash, alpha: 0, scale: 1.12, duration: 380 })
    this.scene.tweens.add({
      targets: [this.avatarImage, this.avatarFallback],
      scale: 1.08,
      duration: 110,
      yoyo: true,
    })
    this.scene.tweens.add({
      targets: this.root,
      y: this.root.y - 15,
      angle: 2,
      duration: 130,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.isUsable()) return
        this.root.setAngle(0)
        this.drawFallbackAvatar(false)
        onComplete()
      },
    })
  }

  reactError(): void {
    if (!this.isUsable()) return
    const originalX = this.root.x
    const flash = this.scene.add.rectangle(this.root.x, this.root.y - 30, 208, 164, 0xff5362, 0.24)
      .setStrokeStyle(3, 0xff6c78, 0.65).setDepth(30)
    this.scene.tweens.add({
      targets: this.root,
      x: this.root.x + 8,
      duration: 55,
      yoyo: true,
      repeat: 3,
      onComplete: () => { if (this.isUsable()) this.root.setX(originalX) },
    })
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.08,
      duration: 300,
      onComplete: () => { if (flash.active) flash.destroy() },
    })
  }

  leave(baseX: number, onComplete: () => void): void {
    if (!this.isUsable()) return
    this.scene.tweens.add({
      targets: this.root,
      x: baseX < 480 ? baseX - 118 : baseX + 118,
      alpha: 0,
      duration: 560,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!this.isUsable()) return
        this.root.setPosition(baseX - 120, this.root.y).setAlpha(0)
        onComplete()
        this.scene.tweens.add({
          targets: this.root, x: baseX, alpha: 1, duration: 300, ease: 'Back.easeOut',
        })
      },
    })
  }

  pulseSelection(): void {
    if (!this.isUsable()) return
    this.scene.tweens.add({ targets: this.root, scale: 1.08, duration: 90, yoyo: true })
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.scene.tweens.killTweensOf(this.root)
    this.scene.tweens.killTweensOf(this.root.list)
    this.frame.removeAllListeners()
    if (this.root.active) this.root.destroy(true)
  }

  private isUsable(): boolean {
    return !this.destroyed && this.root.active && this.root.scene !== null
  }

  private fitAvatarImage(): void {
    const width = Math.max(1, this.avatarImage.width)
    const height = Math.max(1, this.avatarImage.height)
    const scale = Math.min(188 / width, 190 / height) * this.spriteDisplay.scaleMultiplier
    this.avatarImage
      .setScale(scale)
      .setPosition(this.spriteDisplay.offsetX, 29 + this.spriteDisplay.offsetY)
  }

  private syncAvatarVisibility(): void {
    const hasTexture = this.avatarImage.texture.key !== '__MISSING'
    this.avatarImage.setVisible(hasTexture)
    this.avatarFallback.setVisible(!hasTexture)
  }

  private resolveSpriteTexture(sprite: CustomerSpriteDefinition): string {
    if (this.scene.textures.exists(sprite.key)) return sprite.key
    if (sprite.fallbackKey && this.scene.textures.exists(sprite.fallbackKey)) return sprite.fallbackKey
    return sprite.key
  }

  private drawFallbackAvatar(smiling: boolean): void {
    const g = this.avatarFallback.clear()
    const configs = {
      manager: { skin: 0xe7b38f, hair: 0x392a25, shirt: 0x3d5d8a },
      biker: { skin: 0xb97a60, hair: 0x201d20, shirt: 0x252327 },
      afterWork: { skin: 0xf0c5a2, hair: 0xa75e3d, shirt: 0xb84f6b },
      regular: { skin: 0xd69d78, hair: 0x765139, shirt: 0x378476 },
      stranger: { skin: 0xb9c3aa, hair: 0x694d7c, shirt: 0x684d78 },
    }
    const c = configs[this.look]
    g.fillStyle(c.shirt).fillRoundedRect(-56, -15, 112, 65, 18)
    g.fillStyle(0x171319, 0.18).fillEllipse(0, 45, 104, 16)
    g.fillStyle(c.skin).fillCircle(0, -49, 35)

    if (this.look === 'manager') {
      g.fillStyle(c.hair).fillRoundedRect(-35, -75, 70, 24, 10)
      g.fillStyle(0xffffff).fillTriangle(-12, -10, 12, -10, 0, 20)
      g.fillStyle(0xd65858).fillTriangle(-5, -4, 5, -4, 0, 22)
    } else if (this.look === 'biker') {
      g.fillStyle(c.hair).fillEllipse(0, -72, 74, 28)
      g.fillStyle(0x343138).fillTriangle(-22, 10, -2, -8, 5, 28)
      g.fillStyle(0xc6c0c8).fillCircle(25, 17, 5)
    } else if (this.look === 'afterWork') {
      g.fillStyle(c.hair).fillCircle(28, -62, 17).fillEllipse(0, -72, 67, 27)
      g.fillStyle(0xe2bb54).fillCircle(-28, -42, 5).fillCircle(28, -42, 5)
      g.fillStyle(0xffffff, 0.65).fillRoundedRect(25, 4, 17, 27, 3)
    } else if (this.look === 'regular') {
      g.fillStyle(c.hair).fillEllipse(0, -70, 68, 25)
      g.lineStyle(3, 0x4a352d).strokeCircle(0, -38, 16)
      g.fillStyle(0xd7a650).fillCircle(40, 16, 7)
    } else {
      g.fillStyle(c.hair).fillTriangle(-40, -63, 40, -63, 0, -103)
      g.fillStyle(0x82d2cf).fillCircle(-36, -20, 6).fillCircle(36, -20, 6)
      g.lineStyle(2, 0xc9ed85).lineBetween(42, 5, 54, -8)
    }

    g.fillStyle(0x251b21).fillCircle(-12, -49, 3).fillCircle(12, -49, 3)
    if (smiling) {
      g.lineStyle(3, 0x8f4f56)
      g.beginPath().arc(0, -36, 10, 0.2, Math.PI - 0.2).strokePath()
    } else {
      g.lineStyle(2, 0x8f5555).lineBetween(-7, -34, 7, -34)
    }
  }
}

function patienceColor(ratio: number): number {
  if (ratio >= 0.5) return mixColor(0xf0c14f, 0x67cf86, (ratio - 0.5) * 2)
  return mixColor(0xef5967, 0xf0c14f, ratio * 2)
}

function mixColor(from: number, to: number, amount: number): number {
  const a = Phaser.Display.Color.IntegerToColor(from)
  const b = Phaser.Display.Color.IntegerToColor(to)
  return Phaser.Display.Color.GetColor(
    Phaser.Math.Linear(a.red, b.red, amount),
    Phaser.Math.Linear(a.green, b.green, amount),
    Phaser.Math.Linear(a.blue, b.blue, amount),
  )
}
