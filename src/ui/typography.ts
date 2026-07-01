export const UI_FONT = '"Exo 2", "Segoe UI", Arial, sans-serif'
export const DISPLAY_FONT = '"Russo One", "Exo 2", "Segoe UI", sans-serif'
export const DEBUG_FONT = '"Cascadia Mono", Consolas, "Courier New", monospace'

export async function loadUiFonts(): Promise<void> {
  if (!document.fonts) return
  await Promise.race([
    Promise.all([
      document.fonts.load('600 16px "Exo 2"'),
      document.fonts.load('16px "Russo One"'),
    ]),
    new Promise<void>((resolve) => window.setTimeout(resolve, 1800)),
  ])
}
