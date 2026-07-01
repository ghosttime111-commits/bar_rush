import Phaser from 'phaser'
import { markShakeTutorialSeen } from '../game/progress'
import { BODY_FONT, CYBER, DISPLAY_FONT } from './cyberTheme'

export class ShakeTutorialModal {
  constructor(scene: Phaser.Scene) {
    const root = scene.add.container(0, 0).setDepth(700)
    const blocker = scene.add.rectangle(480, 270, 960, 540, CYBER.void, 0.82).setInteractive()
    const panel = scene.add.graphics().fillStyle(CYBER.panel).fillRoundedRect(260, 140, 440, 260, 8)
    panel.lineStyle(2, CYBER.cyan).strokeRoundedRect(260, 140, 440, 260, 8)
    const title = scene.add.text(480, 188, '🧋  КОКТЕЙЛИ В ШЕЙКЕРЕ', { fontFamily: DISPLAY_FONT, fontSize: '20px', color: '#f3c96b' }).setOrigin(0.5)
    const text = scene.add.text(480, 260, 'Если в рецепте указан шейкер:\n1. Добавьте ингредиенты по порядку.\n2. Нажмите «Взболтать».\n3. Подайте готовый коктейль.', {
      fontFamily: BODY_FONT, fontSize: '14px', color: '#eee3e9', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5)
    const button = scene.add.rectangle(480, 350, 190, 44, CYBER.magenta).setStrokeStyle(1, CYBER.cyan, 0.8).setInteractive({ useHandCursor: true })
    const label = scene.add.text(480, 350, 'ПОНЯТНО', { fontFamily: BODY_FONT, fontSize: '13px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5)
    button.on('pointerdown', () => { markShakeTutorialSeen(); root.destroy(true) })
    root.add([blocker, panel, title, text, button, label])
  }
}
