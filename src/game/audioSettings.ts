export type AudioSettings = {
  musicEnabled: boolean
  effectsEnabled: boolean
  musicVolume: number
  effectsVolume: number
  masterVolume: number
  masterMuted: boolean
}

const STORAGE_KEY = 'bar-rush-audio-settings-v1'

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicEnabled: true,
  effectsEnabled: true,
  musicVolume: 0.28,
  effectsVolume: 0.62,
  masterVolume: 1,
  masterMuted: false,
}

export function loadAudioSettings(): AudioSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<AudioSettings>
    return {
      musicEnabled: saved.musicEnabled !== false,
      effectsEnabled: saved.effectsEnabled !== false,
      musicVolume: clampVolume(saved.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume),
      effectsVolume: clampVolume(saved.effectsVolume, DEFAULT_AUDIO_SETTINGS.effectsVolume),
      masterVolume: clampVolume(saved.masterVolume, DEFAULT_AUDIO_SETTINGS.masterVolume),
      masterMuted: saved.masterMuted === true,
    }
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS }
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function clampVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback
}
