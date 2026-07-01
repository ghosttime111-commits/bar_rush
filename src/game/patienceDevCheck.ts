import type Phaser from 'phaser'
import type { PatienceVisualState } from '../ui/CustomerCard'

export type PatienceDevTarget = {
  slotId: string
  setRatio: (ratio: number) => void
  read: () => PatienceVisualState
}

export type PatienceDevResult = {
  passed: boolean
  snapshots: Array<PatienceVisualState & { expectedRatio: number; passed: boolean }>
}

export const FIRST_SLOT_SEQUENCE = [1, 0.8, 0.6, 0.4, 0.2, 0] as const

export function runPatienceDevCheck(
  scene: Phaser.Scene,
  targets: PatienceDevTarget[],
  onComplete: (result: PatienceDevResult) => void,
): void {
  const snapshots: Array<PatienceVisualState & { expectedRatio: number; passed: boolean }> = []
  let allPassed = true
  let previousFirstWidth = Number.POSITIVE_INFINITY

  const applyAndVerify = (ratios: number[]): void => {
    targets.forEach((target, index) => target.setRatio(ratios[index] ?? 0))
    targets.forEach((target, index) => {
      const expectedRatio = ratios[index] ?? 0
      const state = target.read()
      const expectedWidth = state.fullWidth * expectedRatio
      const passed = Math.abs(state.ratio - expectedRatio) < 0.001
        && Math.abs(state.fillWidth - expectedWidth) < 0.25
        && Math.abs(state.glowWidth - expectedWidth) < 0.25
      snapshots.push({ ...state, expectedRatio, passed })
      allPassed = allPassed && passed
    })
  }

  applyAndVerify([0.75, 0.5, 0.25])
  let step = 0
  const advanceFirstSlot = (): void => {
    const firstRatio = FIRST_SLOT_SEQUENCE[step]!
    applyAndVerify([firstRatio, 0.5, 0.25])
    const firstWidth = targets[0]!.read().fillWidth
    if (step > 0 && firstWidth >= previousFirstWidth) allPassed = false
    previousFirstWidth = firstWidth
    step += 1
    if (step < FIRST_SLOT_SEQUENCE.length) {
      scene.time.delayedCall(420, advanceFirstSlot)
      return
    }
    console.table(snapshots)
    console.log(`[Bar Rush] Patience slot test: ${allPassed ? 'PASS' : 'FAIL'}`)
    onComplete({ passed: allPassed, snapshots })
  }
  scene.time.delayedCall(850, advanceFirstSlot)
}
