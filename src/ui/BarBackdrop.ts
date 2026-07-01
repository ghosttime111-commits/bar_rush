import Phaser from 'phaser'
import type { ShiftModeId } from '../game/shiftModes'
import { preloadIngredientIcons } from './IngredientIcon'
import { preloadCyberUiIcons } from './IconFactory'
import { preloadCocktailIcons } from './CocktailIcon'
import { getLayout } from './LayoutManager'

export const BAR_CYBER_KEY = 'bar-interior-cyberpunk'
const BAR_CYBER_PATH = 'assets/backgrounds/cyberpunk/night-bar.png'
export const BAR_RASTER_KEY = 'bar-interior-raster'
const BAR_RASTER_PATH = 'assets/backgrounds/bar-interior.png'
const BAR_SVG_KEY = 'bar-interior'
const BAR_SVG_PATH = 'assets/backgrounds/bar-interior.svg'

type BackdropOptions = {
  modeId?: ShiftModeId
}

export function preloadBarVisuals(scene: Phaser.Scene): void {
  if (!scene.textures.exists(BAR_CYBER_KEY)) scene.load.image(BAR_CYBER_KEY, BAR_CYBER_PATH)
  if (!scene.textures.exists(BAR_RASTER_KEY)) scene.load.image(BAR_RASTER_KEY, BAR_RASTER_PATH)
  if (!scene.textures.exists(BAR_SVG_KEY)) scene.load.svg(BAR_SVG_KEY, BAR_SVG_PATH)
  preloadIngredientIcons(scene)
  preloadCyberUiIcons(scene)
  preloadCocktailIcons(scene)
  scene.load.on('loaderror', (file: Phaser.Loader.File) => {
    if (import.meta.env.DEV && file.key === BAR_CYBER_KEY) {
      console.warn('[Bar Rush] Киберпанк-фон не загрузился, используется старый raster/SVG fallback.')
    }
    if (import.meta.env.DEV && String(file.key).startsWith('ingredient-')) {
      console.warn(`[Bar Rush] Иконка ${file.key} не загрузилась, используется Graphics fallback.`)
    }
  })
}

export function drawBarBackdrop(scene: Phaser.Scene, options: BackdropOptions = {}): void {
  const background = scene.textures.exists(BAR_CYBER_KEY)
    ? scene.add.image(480, 270, BAR_CYBER_KEY).setDepth(-30)
    : scene.textures.exists(BAR_RASTER_KEY)
      ? scene.add.image(480, 270, BAR_RASTER_KEY).setDepth(-30)
    : scene.textures.exists(BAR_SVG_KEY)
      ? scene.add.image(480, 270, BAR_SVG_KEY).setDepth(-30)
      : undefined

  const procedural = background ? undefined : drawProceduralFallback(scene)
  const dimming = drawDimming(scene)
  const modeTint = drawModeTint(scene, options.modeId)
  const resizeBackground = (): void => {
    const layout = getLayout(scene)
    if (background?.active) {
      const imageWidth = Math.max(1, background.width)
      const imageHeight = Math.max(1, background.height)
      const coverScale = Math.max(layout.viewWidth / imageWidth, layout.viewHeight / imageHeight)
      background.setPosition(layout.viewCenterX, layout.viewCenterY).setScale(coverScale)
    }
    if (procedural?.active) redrawProceduralFallback(procedural, layout.viewCenterX, layout.viewCenterY, layout.viewWidth, layout.viewHeight)
    dimming.full.setPosition(layout.viewCenterX, layout.viewCenterY).setDisplaySize(layout.viewWidth, layout.viewHeight)
    modeTint?.setPosition(layout.viewCenterX, layout.viewCenterY).setDisplaySize(layout.viewWidth, layout.viewHeight)
  }
  resizeBackground()

  const effectTweens = drawLocalLighting(scene, options.modeId)
  if (scene.scene.key === 'GameScene') drawIngredientReadabilityLayer(scene)
  registerBackdropLifecycle(scene, resizeBackground, effectTweens)
}

function drawDimming(scene: Phaser.Scene): { full: Phaser.GameObjects.Rectangle; center: Phaser.GameObjects.Rectangle } {
  const alpha = scene.scene.key === 'GameScene'
    ? 0.23
    : scene.scene.key === 'ResultScene'
      ? 0.32
      : 0.36
  return {
    full: scene.add.rectangle(480, 270, 960, 540, 0x060817, alpha).setDepth(-26),
    center: scene.add.rectangle(480, 178, 690, 230, 0x080b20, 0.12).setDepth(-25),
  }
}

function drawModeTint(scene: Phaser.Scene, modeId: ShiftModeId | undefined): Phaser.GameObjects.Rectangle | undefined {
  if (!modeId || modeId === 'normal') return undefined
  const tint = modeId === 'fridayRush'
    ? 0xf05c32
    : modeId === 'vipNight'
      ? 0xe8ba55
      : 0x6659dd
  const alpha = modeId === 'vipNight' ? 0.075 : 0.085
  return scene.add.rectangle(480, 270, 960, 540, tint, alpha).setDepth(-24)
}

function drawLocalLighting(scene: Phaser.Scene, modeId: ShiftModeId | undefined): Phaser.Tweens.Tween[] {
  const color = modeId === 'fridayRush'
    ? 0xff7a42
    : modeId === 'shakerNight'
      ? 0x8175ff
      : 0x34e7f5
  const lights = [235, 480, 725].map((x) =>
    scene.add.ellipse(x, 174, 220, 230, color, modeId === 'vipNight' ? 0.07 : 0.045).setDepth(-23),
  )
  return [scene.tweens.add({
    targets: lights,
    alpha: { from: 0.68, to: 1 },
    duration: modeId === 'fridayRush' ? 1800 : 3200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })]
}

function drawIngredientReadabilityLayer(scene: Phaser.Scene): void {
  const layer = scene.add.graphics().setDepth(-14)
  layer.fillStyle(0x070918, 0.68).fillRoundedRect(22, 306, 916, 124, 6)
  layer.lineStyle(1, 0x34e7f5, 0.24).strokeRoundedRect(22, 306, 916, 124, 6)
}

function registerBackdropLifecycle(
  scene: Phaser.Scene,
  resize: () => void,
  tweens: Phaser.Tweens.Tween[],
): void {
  const pause = (): void => tweens.forEach((tween) => tween.pause())
  const resume = (): void => tweens.forEach((tween) => tween.resume())
  const cleanup = (): void => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, resize)
    window.removeEventListener('bar-rush-hidden', pause)
    window.removeEventListener('bar-rush-visible', resume)
    tweens.forEach((tween) => { if (tween.isPlaying()) tween.stop() })
  }
  scene.scale.on(Phaser.Scale.Events.RESIZE, resize)
  window.addEventListener('bar-rush-hidden', pause)
  window.addEventListener('bar-rush-visible', resume)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup)
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup)
}

function drawProceduralFallback(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(-30)
  redrawProceduralFallback(g, 480, 270, 960, 540)
  return g
}

function redrawProceduralFallback(
  g: Phaser.GameObjects.Graphics,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): void {
  g.clear()
  g.fillGradientStyle(0x100d15, 0x100d15, 0x2e1c2d, 0x21131f)
    .fillRect(centerX - width / 2, centerY - height / 2, width, height)
  g.fillStyle(0x211522, 0.86).fillRoundedRect(30, 64, 900, 245, 20)
  const bottleColors = [0x4d9472, 0xc26b54, 0xd3a14e, 0x5f75a5, 0x925e9d]
  for (const shelfY of [111, 171]) {
    g.fillStyle(0x120d13).fillRoundedRect(65, shelfY, 830, 9, 4)
    for (let index = 0; index < 15; index += 1) {
      const x = 82 + index * 55
      const bottleHeight = 22 + (index % 4) * 5
      const color = bottleColors[(index + shelfY) % bottleColors.length]!
      g.fillStyle(color, 0.48).fillRoundedRect(x, shelfY - bottleHeight, 15, bottleHeight, 3)
    }
  }
  g.fillStyle(0x43241f).fillRoundedRect(-15, 294, 990, 23, 7)
  g.fillStyle(0x1a1016).fillRect(0, 317, 960, 223)
}
