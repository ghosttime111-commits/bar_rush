export const CYBER = {
  void: 0x070816,
  panel: 0x101329,
  panelSoft: 0x17162f,
  panelBright: 0x202044,
  cyan: 0x34e7f5,
  cyanSoft: 0x55aebd,
  magenta: 0xff3fa4,
  violet: 0x8c6cff,
  amber: 0xffb84d,
  white: 0xeafcff,
  muted: 0x8792ae,
  success: 0x45e7a2,
  danger: 0xff4f78,
} as const

export const CYBER_FONT = '"Consolas", "Cascadia Mono", "Courier New", monospace'
export const BODY_FONT = '"Segoe UI", "Trebuchet MS", Arial, sans-serif'

export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}
