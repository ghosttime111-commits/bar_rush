export type SynthOutput = {
  context: AudioContext
  destination: AudioNode
}

export type SoundName =
  | 'button' | 'customerSelect' | 'pour' | 'ice' | 'garnish' | 'clear'
  | 'success' | 'error' | 'customerLeft' | 'coin' | 'combo' | 'comboHigh'
  | 'upgrade' | 'denied' | 'recipeUnlock' | 'shiftStart' | 'shiftEnd'
  | 'shakerStart' | 'shakerLoop' | 'shakerIce' | 'shakerComplete' | 'wrongPreparation'
  | 'specialShiftOffer' | 'fridayRushStart' | 'vipNightStart' | 'shakerNightStart'
  | 'specialShiftComplete' | 'specialShiftRecord'

export function playSynth(name: SoundName, output: SynthOutput): number {
  switch (name) {
    case 'button': return tone(output, 440, 0.035, 0.045, 'sine', 0.32)
    case 'customerSelect': return sequence(output, [360, 520], 0.045, 0.035, 'triangle', 0.38)
    case 'pour': return noiseSweep(output, 0.22, 1200, 430, 0.2)
    case 'ice': return noiseSweep(output, 0.105, 4200, 1600, 0.34)
    case 'garnish': return sequence(output, [760, 980], 0.035, 0.03, 'sine', 0.25)
    case 'clear': return noiseSweep(output, 0.14, 800, 180, 0.18)
    case 'success': return sequence(output, [523, 659, 784], 0.075, 0.045, 'sine', 0.42)
    case 'error': return tone(output, 150, 0.16, 0.08, 'triangle', 0.3, 105)
    case 'customerLeft': return sequence(output, [280, 210, 155], 0.07, 0.055, 'triangle', 0.24)
    case 'coin': return sequence(output, [1180, 1580], 0.04, 0.025, 'sine', 0.28)
    case 'combo': return sequence(output, [620, 780], 0.05, 0.035, 'square', 0.16)
    case 'comboHigh': return sequence(output, [660, 880, 1100], 0.065, 0.035, 'triangle', 0.28)
    case 'upgrade': return sequence(output, [392, 523, 659], 0.075, 0.045, 'sine', 0.35)
    case 'denied': return sequence(output, [190, 150], 0.085, 0.04, 'triangle', 0.26)
    case 'recipeUnlock': return sequence(output, [440, 554, 659, 880], 0.09, 0.055, 'sine', 0.4)
    case 'shiftStart': return sequence(output, [330, 440, 660], 0.08, 0.04, 'triangle', 0.3)
    case 'shiftEnd': return sequence(output, [660, 494, 392], 0.1, 0.055, 'sine', 0.32)
    case 'shakerStart': return noiseSweep(output, 0.14, 900, 1600, 0.2)
    case 'shakerLoop': return noiseSweep(output, 0.12, 1400, 620, 0.18)
    case 'shakerIce': return noiseSweep(output, 0.08, 4300, 1800, 0.26)
    case 'shakerComplete': return sequence(output, [520, 720, 920], 0.055, 0.025, 'triangle', 0.3)
    case 'wrongPreparation': return sequence(output, [240, 170], 0.11, 0.035, 'triangle', 0.25)
    case 'specialShiftOffer': return sequence(output, [392, 523, 784], 0.08, 0.04, 'sine', 0.34)
    case 'fridayRushStart': return sequence(output, [440, 587, 740, 880], 0.055, 0.025, 'square', 0.18)
    case 'vipNightStart': return sequence(output, [330, 494, 659], 0.12, 0.055, 'sine', 0.35)
    case 'shakerNightStart': return sequence(output, [420, 630, 840], 0.07, 0.035, 'triangle', 0.3)
    case 'specialShiftComplete': return sequence(output, [523, 659, 784, 1046], 0.09, 0.04, 'sine', 0.38)
    case 'specialShiftRecord': return sequence(output, [660, 880, 1100, 1320], 0.07, 0.025, 'triangle', 0.32)
  }
}

function tone(
  output: SynthOutput,
  frequency: number,
  duration: number,
  attack: number,
  type: OscillatorType,
  volume: number,
  endFrequency = frequency,
  delay = 0,
): number {
  const { context, destination } = output
  const start = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(attack, duration * 0.35))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
  oscillator.onended = () => {
    oscillator.disconnect()
    gain.disconnect()
  }
  return duration + delay
}

function sequence(
  output: SynthOutput,
  frequencies: number[],
  noteDuration: number,
  gap: number,
  type: OscillatorType,
  volume: number,
): number {
  frequencies.forEach((frequency, index) => {
    tone(output, frequency, noteDuration, 0.012, type, volume, frequency * 1.015, index * (noteDuration + gap))
  })
  return frequencies.length * (noteDuration + gap)
}

function noiseSweep(
  output: SynthOutput,
  duration: number,
  startFrequency: number,
  endFrequency: number,
  volume: number,
): number {
  const { context, destination } = output
  const sampleCount = Math.ceil(context.sampleRate * duration)
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < sampleCount; index += 1) data[index] = Math.random() * 2 - 1
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  const now = context.currentTime
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.Q.value = 1.1
  filter.frequency.setValueAtTime(startFrequency, now)
  filter.frequency.exponentialRampToValueAtTime(endFrequency, now + duration)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.025)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  source.connect(filter).connect(gain).connect(destination)
  source.start()
  source.stop(now + duration + 0.02)
  source.onended = () => {
    source.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
  return duration
}
