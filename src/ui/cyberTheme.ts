import { DISPLAY_FONT as DISPLAY_TYPEFACE, UI_FONT } from './typography'

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

export const CYBER_FONT = UI_FONT
export const BODY_FONT = UI_FONT
export const DISPLAY_FONT = DISPLAY_TYPEFACE

export const UI_STROKE = {
  subtle: 0.34,
  normal: 0.58,
  strong: 0.82,
} as const

export const UI_RADIUS = {
  small: 4,
  normal: 7,
  large: 10,
} as const

export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}
