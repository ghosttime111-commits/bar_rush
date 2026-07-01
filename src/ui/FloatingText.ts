import Phaser from 'phaser'
import { CYBER_FONT } from './cyberTheme'

export function floatingText(scene: Phaser.Scene, x: number, y: number, label: string, color: string): void {
  const shadow = scene.add.text(x + 2, y + 4, label, {
    fontFamily: CYBER_FONT, fontSize: '22px', fontStyle: 'bold', color: '#080609',
  }).setOrigin(0.5).setAlpha(0.7).setDepth(89)
  const text = scene.add.text(x, y, label, {
    fontFamily: CYBER_FONT, fontSize: '22px', fontStyle: 'bold', color,
    stroke: '#07131e', strokeThickness: 5,
  }).setOrigin(0.5).setDepth(90)

  scene.tweens.add({
    targets: [shadow, text],
    y: y - 58,
    alpha: 0,
    scale: { from: 0.78, to: 1.2 },
    duration: 900,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      shadow.destroy()
      text.destroy()
    },
  })
}
