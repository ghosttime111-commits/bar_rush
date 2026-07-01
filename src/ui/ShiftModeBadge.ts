import Phaser from 'phaser'
import type { ShiftModeDefinition } from '../game/shiftModes'
import { modeModifierLines } from '../game/shiftModes'
import { CYBER, CYBER_FONT, hex } from './cyberTheme'

export class ShiftModeBadge {
  readonly root: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene, mode: ShiftModeDefinition) {
    this.root = scene.add.container(480, 20).setDepth(55)
    const width = Math.min(190, 76 + mode.name.length * 6)
    const bg = scene.add.rectangle(0, 0, width, 18, CYBER.panel, 0.96)
      .setStrokeStyle(1, mode.accentColor, 0.9).setInteractive({ useHandCursor: true })
    const label = scene.add.text(0, 0, `${mode.icon}  ${mode.name}`, {
      fontFamily: CYBER_FONT, fontSize: '9px', fontStyle: 'bold', color: hex(CYBER.white),
    }).setOrigin(0.5)
    this.root.add([bg, label])
    const detail = scene.add.container(0, 42).setVisible(false).setDepth(70)
    const panel = scene.add.rectangle(0, 0, 330, 56, CYBER.panel, 0.98).setStrokeStyle(1, mode.accentColor, 0.7)
    const text = scene.add.text(0, 0, modeModifierLines(mode).join('  •  '), {
      fontFamily: CYBER_FONT, fontSize: '9px', color: hex(CYBER.white), wordWrap: { width: 304 }, align: 'center',
    }).setOrigin(0.5)
    detail.add([panel, text]); this.root.add(detail)
    bg.on('pointerdown', () => detail.setVisible(!detail.visible))
  }

  destroy(): void {
    if (this.root.active) this.root.destroy(true)
  }
}
