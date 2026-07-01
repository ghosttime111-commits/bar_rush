export const MOBILE_BREAKPOINT = 700

export function isMobileViewport(): boolean {
  return Math.min(window.innerWidth, window.innerHeight) <= MOBILE_BREAKPOINT
}

export function responsiveFont(desktopSize: number, mobileBoost = 1.15): string {
  return `${Math.round(desktopSize * (isMobileViewport() ? mobileBoost : 1))}px`
}
