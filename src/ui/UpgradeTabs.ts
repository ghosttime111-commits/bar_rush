import Phaser from 'phaser'
import type { UpgradeCategory } from '../game/upgrades'
import { CYBER, CYBER_FONT, hex } from './cyberTheme'

const TABS: Array<{ id: UpgradeCategory; label: string }> = [
  { id: 'service', label: 'СЕРВИС' },
  { id: 'income', label: 'ДОХОД' },
  { id: 'equipment', label: 'ОБОРУДОВАНИЕ' },
]

export class UpgradeTabs {
  readonly objects: Phaser.GameObjects.GameObject[] = []

  constructor(scene: Phaser.Scene, active: UpgradeCategory, onSelect: (category: UpgradeCategory) => void) {
    TABS.forEach((tab, index) => {
      const x = 286 + index * 194
      const background = scene.add.rectangle(x, 104, 180, 32, tab.id === active ? CYBER.cyan : CYBER.panel, tab.id === active ? 0.92 : 0.68)
        .setStrokeStyle(1, tab.id === active ? CYBER.white : CYBER.magenta, 0.62).setInteractive({ useHandCursor: true })
      const label = scene.add.text(x, 104, tab.label, {
        fontFamily: CYBER_FONT, fontSize: '11px', fontStyle: 'bold',
        color: tab.id === active ? '#061018' : hex(CYBER.white),
      }).setOrigin(0.5)
      background.on('pointerdown', () => onSelect(tab.id))
      this.objects.push(background, label)
    })
  }

  destroy(): void { this.objects.forEach((object) => object.destroy()) }
}
