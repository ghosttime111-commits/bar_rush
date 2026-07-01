import Phaser from 'phaser'

export type CustomerArchetype = 'manager' | 'biker' | 'afterWork' | 'regular' | 'stranger'

export type CustomerSpriteDefinition = {
  key: string
  path: string
  archetype: CustomerArchetype
  scaleMultiplier: number
  offsetX: number
  offsetY: number
  fallbackKey?: string
}

export const CUSTOMER_SPRITES: CustomerSpriteDefinition[] = [
  { key: 'cyber-customer-01', path: 'assets/customers/cyberpunk/customer-01.png', fallbackKey: 'legacy-customer-01', archetype: 'manager', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-02', path: 'assets/customers/cyberpunk/customer-02.png', fallbackKey: 'legacy-customer-02', archetype: 'biker', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-03', path: 'assets/customers/cyberpunk/customer-03.png', fallbackKey: 'legacy-customer-03', archetype: 'stranger', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-04', path: 'assets/customers/cyberpunk/customer-04.png', fallbackKey: 'legacy-customer-04', archetype: 'afterWork', scaleMultiplier: 0.94, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-05', path: 'assets/customers/cyberpunk/customer-05.png', fallbackKey: 'legacy-customer-05', archetype: 'regular', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-06', path: 'assets/customers/cyberpunk/customer-06.png', fallbackKey: 'legacy-customer-06', archetype: 'stranger', scaleMultiplier: 0.96, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-07', path: 'assets/customers/cyberpunk/customer-07.png', fallbackKey: 'legacy-customer-07', archetype: 'biker', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-08', path: 'assets/customers/cyberpunk/customer-08.png', fallbackKey: 'legacy-customer-08', archetype: 'manager', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-09', path: 'assets/customers/cyberpunk/customer-09.png', fallbackKey: 'legacy-customer-09', archetype: 'afterWork', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
  { key: 'cyber-customer-10', path: 'assets/customers/cyberpunk/customer-10.png', fallbackKey: 'legacy-customer-01', archetype: 'regular', scaleMultiplier: 1, offsetX: 0, offsetY: 0 },
]

export function preloadCustomerSprites(scene: Phaser.Scene): void {
  CUSTOMER_SPRITES.forEach((sprite) => scene.load.image(sprite.key, sprite.path))
  for (let index = 1; index <= 9; index += 1) {
    const suffix = String(index).padStart(2, '0')
    const key = `legacy-customer-${suffix}`
    if (!scene.textures.exists(key)) scene.load.image(key, `assets/customers/customer-${suffix}.png`)
  }
}

export function pickCustomerSprites(count: number, excludedKeys: string[] = []): CustomerSpriteDefinition[] {
  const available = CUSTOMER_SPRITES.filter((sprite) => !excludedKeys.includes(sprite.key))
  const pool = available.length >= count ? available : CUSTOMER_SPRITES
  return Phaser.Utils.Array.Shuffle([...pool]).slice(0, count)
}
