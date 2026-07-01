import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'
import { ResultScene } from './scenes/ResultScene'
import { UpgradeScene } from './scenes/UpgradeScene'
import { RecipeBookScene } from './scenes/RecipeBookScene'
import { audioManager } from './audio/AudioManager'
import { initialRenderSize, renderSizeForViewport } from './ui/RenderQualityManager'
import { loadUiFonts } from './ui/typography'

audioManager.initialize()
await loadUiFonts()
const renderSize = initialRenderSize()

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: renderSize.width,
  height: renderSize.height,
  backgroundColor: '#100d16',
  scene: [UpgradeScene, RecipeBookScene, GameScene, ResultScene],
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: renderSize.width,
    height: renderSize.height,
    expandParent: true,
    fullscreenTarget: 'game-container',
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
})

let resizeFrame = 0
const refreshScale = (): void => {
  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    const next = renderSizeForViewport(window.innerWidth, window.innerHeight)
    if (game.scale.gameSize.width !== next.width || game.scale.gameSize.height !== next.height) {
      // EXPAND reads these base dimensions on every refresh. Keep them in sync so an
      // orientation change does not retain the previous landscape minimum.
      const mutableConfig = game.config as unknown as { width: number; height: number }
      mutableConfig.width = next.width
      mutableConfig.height = next.height
      game.scale.setGameSize(next.width, next.height)
    } else {
      game.scale.refresh()
    }
  })
}
window.addEventListener('resize', refreshScale)
window.addEventListener('orientationchange', refreshScale)
window.visualViewport?.addEventListener('resize', refreshScale)
