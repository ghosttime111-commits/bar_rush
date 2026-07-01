import Phaser from 'phaser'
import { BAR_CYBER_HD_KEY, BAR_CYBER_KEY } from './BarBackdrop'
import { CYBER, CYBER_FONT, hex } from './cyberTheme'
import { loadRenderQuality, renderScale } from './RenderQualityManager'

export function attachRenderDiagnostics(scene: Phaser.Scene): () => void {
  const root = scene.add.container(0, 0).setDepth(12000).setVisible(false)
  const blocker = scene.add.rectangle(480, 270, 960, 540, 0x02030a, 0.86).setInteractive()
  const panel = scene.add.rectangle(480, 270, 760, 430, CYBER.panel, 0.98).setStrokeStyle(2, CYBER.cyan, 0.85)
  const title = scene.add.text(480, 78, 'HIGH DPI // ДИАГНОСТИКА РЕНДЕРА', {
    fontFamily: CYBER_FONT, fontSize: '17px', fontStyle: 'bold', color: hex(CYBER.cyan),
  }).setOrigin(0.5)
  const output = scene.add.text(135, 112, '', {
    fontFamily: CYBER_FONT, fontSize: '12px', color: hex(CYBER.white), lineSpacing: 5,
  })
  const copyButton = scene.add.rectangle(480, 452, 310, 40, CYBER.magenta, 0.9)
    .setStrokeStyle(1, CYBER.cyan, 0.8).setInteractive({ useHandCursor: true })
  const copyLabel = scene.add.text(480, 452, 'СКОПИРОВАТЬ ПАРАМЕТРЫ РЕНДЕРА', {
    fontFamily: CYBER_FONT, fontSize: '10px', fontStyle: 'bold', color: '#ffffff',
  }).setOrigin(0.5)
  const hint = scene.add.text(480, 488, 'F3 — закрыть', {
    fontFamily: CYBER_FONT, fontSize: '10px', color: hex(CYBER.muted),
  }).setOrigin(0.5)
  root.add([blocker, panel, title, output, copyButton, copyLabel, hint])

  const report = (): string => {
    const canvas = scene.game.canvas
    const renderer = scene.game.renderer
    const visual = window.visualViewport
    const backgroundKey = scene.textures.exists(BAR_CYBER_HD_KEY)
      ? BAR_CYBER_HD_KEY
      : scene.textures.exists(BAR_CYBER_KEY)
        ? BAR_CYBER_KEY
        : undefined
    const background = backgroundKey
      ? scene.textures.get(backgroundKey).getSourceImage() as HTMLImageElement
      : undefined
    const customerKey = scene.textures.exists('cyber-customer-01') ? 'cyber-customer-01' : undefined
    const customer = customerKey ? scene.textures.get(customerKey).getSourceImage() as HTMLImageElement : undefined
    const rendererName = renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'
    const actualScaleX = canvas.width / Math.max(1, canvas.clientWidth)
    const actualScaleY = canvas.height / Math.max(1, canvas.clientHeight)
    return [
      `Viewport CSS: ${window.innerWidth}×${window.innerHeight}`,
      `DPR: ${window.devicePixelRatio || 1}`,
      `Visual viewport: ${Math.round(visual?.width ?? 0)}×${Math.round(visual?.height ?? 0)}`,
      `Canvas CSS: ${canvas.clientWidth}×${canvas.clientHeight}`,
      `Canvas buffer: ${canvas.width}×${canvas.height}`,
      `Renderer: ${rendererName} ${renderer.width}×${renderer.height}`,
      `Scale gameSize: ${Math.round(scene.scale.gameSize.width)}×${Math.round(scene.scale.gameSize.height)}`,
      `Scale displaySize: ${Math.round(scene.scale.displaySize.width)}×${Math.round(scene.scale.displaySize.height)}`,
      `Render scale: ${actualScaleX.toFixed(2)}×${actualScaleY.toFixed(2)} actual; ${renderScale()} selected (${loadRenderQuality()})`,
      `Background: ${background ? `${background.width}×${background.height} (${backgroundKey})` : 'fallback'}`,
      `Customer sprite: ${customer ? `${customer.width}×${customer.height}` : 'не загружен'}`,
      `FPS: ${Math.round(scene.game.loop.actualFps)}`,
    ].join('\n')
  }

  const refresh = (): void => {
    const value = report()
    output.setText(value)
    scene.game.canvas.dataset.renderDiagnostics = value
  }
  const toggle = (): void => {
    root.setVisible(!root.visible)
    if (root.visible) refresh()
  }
  const onF3 = (): void => toggle()
  const onLongPress = (): void => toggle()
  scene.input.keyboard?.on('keydown-F3', onF3)
  window.addEventListener('bar-rush-toggle-render-diagnostics', onLongPress)
  const updateEvent = scene.time.addEvent({ delay: 300, loop: true, callback: () => { if (root.visible) refresh() } })
  copyButton.on('pointerup', () => {
    void copyText(report()).then(
      () => hint.setText('Параметры скопированы'),
      () => hint.setText('Не удалось скопировать'),
    )
  })

  let cleanedUp = false
  const cleanup = (): void => {
    if (cleanedUp) return
    cleanedUp = true
    scene.input.keyboard?.off('keydown-F3', onF3)
    window.removeEventListener('bar-rush-toggle-render-diagnostics', onLongPress)
    updateEvent.destroy()
    delete scene.game.canvas.dataset.renderDiagnostics
    if (root.active) root.destroy(true)
  }
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup)
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup)
  return cleanup
}

async function copyText(value: string): Promise<void> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value)
      return
    }
  } catch {
    // Older mobile browsers may expose Clipboard API but reject it without a permission prompt.
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Clipboard is unavailable')
}
