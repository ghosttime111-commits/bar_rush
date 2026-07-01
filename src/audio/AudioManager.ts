import type { Ingredient } from '../game/ingredients'
import { loadAudioSettings, saveAudioSettings } from '../game/audioSettings'
import type { AudioSettings } from '../game/audioSettings'
import { playSynth } from './SynthSounds'
import type { SoundName } from './SynthSounds'

export type AudioEvent =
  | 'button' | 'customerSelected' | 'glassCleared'
  | 'orderFailed' | 'customerLeft' | 'upgradePurchased' | 'upgradeDenied'
  | 'recipeUnlocked' | 'shiftStarted' | 'shiftEnded'
  | 'shakerStart' | 'shakerLoop' | 'shakerIce' | 'shakerComplete' | 'wrongPreparation'
  | 'specialShiftOffer' | 'fridayRushStart' | 'vipNightStart' | 'shakerNightStart'
  | 'specialShiftComplete' | 'specialShiftRecord'

type Mood = 'calm' | 'game'

class BarRushAudioManager {
  private context?: AudioContext
  private masterGain?: GainNode
  private musicGain?: GainNode
  private effectsGain?: GainNode
  private ambientOscillators: OscillatorNode[] = []
  private dishTimer?: number
  private settings = loadAudioSettings()
  private activated = false
  private mood: Mood = 'calm'
  private musicIntensity = 1
  private activeEffects = 0
  private readonly maxEffects = 8
  private cooldowns = new Map<SoundName, number>()
  private initialized = false

  initialize(): void {
    if (this.initialized) return
    this.initialized = true
    const unlock = (): void => { void this.activate() }
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.suspend()
        window.dispatchEvent(new Event('bar-rush-hidden'))
      } else {
        window.dispatchEvent(new Event('bar-rush-visible'))
      }
    })
  }

  async activate(): Promise<void> {
    try {
      this.ensureContext()
      if (!this.context) return
      if (this.context.state !== 'running') await this.context.resume()
      if (!this.activated) {
        this.activated = true
        this.startAtmosphere()
      }
    } catch {
      // Browsers may reject activation until a later user gesture.
    }
  }

  suspend(): void {
    if (this.context?.state === 'running') void this.context.suspend()
  }

  async resume(): Promise<void> {
    if (!this.activated) return
    try {
      await this.context?.resume()
    } catch {
      // A later explicit tap will retry activation.
    }
  }

  setMood(mood: Mood): void {
    this.mood = mood
    this.applyVolumes(0.35)
  }

  setMusicIntensity(intensity = 1): void {
    this.musicIntensity = PhaserMathClamp(intensity, 0.65, 1.25)
    this.applyVolumes(0.35)
  }

  notify(event: AudioEvent): void {
    const sounds: Record<AudioEvent, SoundName> = {
      button: 'button',
      customerSelected: 'customerSelect',
      glassCleared: 'clear',
      orderFailed: 'error',
      customerLeft: 'customerLeft',
      upgradePurchased: 'upgrade',
      upgradeDenied: 'denied',
      recipeUnlocked: 'recipeUnlock',
      shiftStarted: 'shiftStart',
      shiftEnded: 'shiftEnd',
      shakerStart: 'shakerStart',
      shakerLoop: 'shakerLoop',
      shakerIce: 'shakerIce',
      shakerComplete: 'shakerComplete',
      wrongPreparation: 'wrongPreparation',
      specialShiftOffer: 'specialShiftOffer',
      fridayRushStart: 'fridayRushStart',
      vipNightStart: 'vipNightStart',
      shakerNightStart: 'shakerNightStart',
      specialShiftComplete: 'specialShiftComplete',
      specialShiftRecord: 'specialShiftRecord',
    }
    this.play(sounds[event])
  }

  ingredientAdded(ingredient: Ingredient): void {
    if (ingredient === 'Лёд') this.play('ice')
    else if (ingredient === 'Лайм' || ingredient === 'Мята') this.play('garnish')
    else this.play('pour')
  }

  orderSuccess(combo: number): void {
    this.play('success')
    window.setTimeout(() => this.play('coin'), 90)
    if (combo >= 3) window.setTimeout(() => this.play('comboHigh'), 160)
    else if (combo > 1) window.setTimeout(() => this.play('combo'), 150)
  }

  play(name: SoundName): void {
    if (!this.activated || !this.context || !this.effectsGain) return
    if (this.settings.masterMuted || !this.settings.effectsEnabled || this.activeEffects >= this.maxEffects) return
    const now = performance.now()
    const cooldown = name === 'pour' ? 75 : name === 'button' ? 45 : 25
    if ((this.cooldowns.get(name) ?? 0) > now) return
    this.cooldowns.set(name, now + cooldown)
    this.activeEffects += 1
    const duration = playSynth(name, { context: this.context, destination: this.effectsGain })
    window.setTimeout(() => { this.activeEffects = Math.max(0, this.activeEffects - 1) }, duration * 1000 + 80)
  }

  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  updateSettings(update: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...update }
    saveAudioSettings(this.settings)
    this.applyVolumes()
    return this.getSettings()
  }

  toggleMasterMute(): boolean {
    this.updateSettings({ masterMuted: !this.settings.masterMuted })
    return this.settings.masterMuted
  }

  isMuted(): boolean {
    return this.settings.masterMuted
  }

  private ensureContext(): void {
    if (this.context) return
    const AudioContextClass = window.AudioContext
    this.context = new AudioContextClass()
    this.masterGain = this.context.createGain()
    this.musicGain = this.context.createGain()
    this.effectsGain = this.context.createGain()
    this.musicGain.connect(this.masterGain)
    this.effectsGain.connect(this.masterGain)
    this.masterGain.connect(this.context.destination)
    this.applyVolumes()
  }

  private applyVolumes(rampSeconds = 0.08): void {
    if (!this.context || !this.masterGain || !this.musicGain || !this.effectsGain) return
    const now = this.context.currentTime
    const muted = this.settings.masterMuted
    const musicTarget = !muted && this.settings.musicEnabled
      ? this.settings.musicVolume * (this.mood === 'game' ? 1 : 0.72) * this.musicIntensity
      : 0
    const effectsTarget = !muted && this.settings.effectsEnabled ? this.settings.effectsVolume : 0
    this.ramp(this.masterGain.gain, muted ? 0 : this.settings.masterVolume * 0.9, now, rampSeconds)
    this.ramp(this.musicGain.gain, musicTarget, now, rampSeconds)
    this.ramp(this.effectsGain.gain, effectsTarget, now, rampSeconds)
  }

  private ramp(parameter: AudioParam, value: number, now: number, duration: number): void {
    parameter.cancelScheduledValues(now)
    parameter.setValueAtTime(Math.max(0, parameter.value), now)
    parameter.linearRampToValueAtTime(Math.max(0, value), now + duration)
  }

  private startAtmosphere(): void {
    if (!this.context || !this.musicGain || this.ambientOscillators.length) return
    const frequencies = [55, 82.41, 110]
    frequencies.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator()
      const gain = this.context!.createGain()
      oscillator.type = index === 1 ? 'triangle' : 'sine'
      oscillator.frequency.value = frequency
      gain.gain.value = index === 0 ? 0.05 : 0.018
      oscillator.connect(gain).connect(this.musicGain!)
      oscillator.start()
      this.ambientOscillators.push(oscillator)
    })
    this.startAmbientNoise()
    this.scheduleDishSound()
    this.applyVolumes()
  }

  private startAmbientNoise(): void {
    if (!this.context || !this.musicGain) return
    const length = this.context.sampleRate * 3
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.12
    const source = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const gain = this.context.createGain()
    source.buffer = buffer
    source.loop = true
    filter.type = 'lowpass'
    filter.frequency.value = 320
    gain.gain.value = 0.08
    source.connect(filter).connect(gain).connect(this.musicGain)
    source.start()
  }

  private scheduleDishSound(): void {
    window.clearTimeout(this.dishTimer)
    this.dishTimer = window.setTimeout(() => {
      if (this.activated && !document.hidden && this.settings.musicEnabled && !this.settings.masterMuted) {
        this.playAmbientDish()
      }
      this.scheduleDishSound()
    }, 7000 + Math.random() * 9000)
  }

  private playAmbientDish(): void {
    if (!this.context || !this.musicGain) return
    playSynth('button', { context: this.context, destination: this.musicGain })
  }
}

export const audioManager = new BarRushAudioManager()

function PhaserMathClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
