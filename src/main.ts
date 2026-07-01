import Phaser from 'phaser'
import './style.css'
import { GameScene } from './scenes/GameScene'
import { ResultScene } from './scenes/ResultScene'
import { UpgradeScene } from './scenes/UpgradeScene'
import { RecipeBookScene } from './scenes/RecipeBookScene'
import { audioManager } from './audio/AudioManager'

audioManager.initialize()

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#100d16',
  scene: [UpgradeScene, RecipeBookScene, GameScene, ResultScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
    expandParent: true,
  },
  render: { antialias: true },
})

const refreshScale = (): void => {
  game.scale.refresh()
}
window.addEventListener('resize', refreshScale)
window.addEventListener('orientationchange', refreshScale)
window.visualViewport?.addEventListener('resize', refreshScale)
