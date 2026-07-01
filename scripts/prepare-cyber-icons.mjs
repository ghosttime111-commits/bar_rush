import sharp from 'sharp'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const sheets = [
  {
    input: 'tmp/imagegen/ingredient-icons-chroma.png',
    output: 'public/assets/icons/ingredients/cyberpunk',
    columns: 6,
    rows: 3,
    iconSize: 108,
    canvasSize: 128,
    names: [
      'beer', 'whisky', 'ice', 'vodka', 'rum', 'lime',
      'mint', 'soda', 'cola', 'gin', 'tonic', 'orange-juice',
      'tequila', 'grenadine', 'cranberry-juice', 'orange-liqueur', 'sugar-syrup', 'lemon-juice',
    ],
  },
  {
    input: 'tmp/imagegen/ui-icons-chroma.png',
    output: 'public/assets/icons/ui/cyberpunk',
    columns: 4,
    rows: 2,
    iconSize: 216,
    canvasSize: 256,
    names: ['shaker', 'recipe-book', 'sound', 'pause', 'special-shift', 'credits', 'reputation', 'combo'],
  },
  {
    input: 'tmp/imagegen/upgrade-icons-chroma.png',
    output: 'public/assets/icons/upgrades/cyberpunk',
    columns: 4,
    rows: 3,
    iconSize: 108,
    canvasSize: 128,
    names: [
      'quick-hands', 'better-glasses', 'cozy-bar', 'advertising',
      'pro-shaker', 'tip-jar', 'bar-insurance', 'combo-master',
      'quick-cleanup', 'neon-sign', 'reputation-reserve', 'bar-training',
    ],
  },
]

for (const sheet of sheets) {
  const input = path.resolve(sheet.input)
  const outputDir = path.resolve(sheet.output)
  await mkdir(outputDir, { recursive: true })
  const source = sharp(input).ensureAlpha()
  const { width = 0, height = 0 } = await source.metadata()
  if (!width || !height) throw new Error(`Не удалось прочитать лист: ${sheet.input}`)
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true })

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset]
    const green = data[offset + 1]
    const blue = data[offset + 2]
    const keyDistance = Math.hypot(red, 255 - green, blue)
    const alpha = keyDistance <= 20 ? 0 : keyDistance >= 145 ? 255 : Math.round(((keyDistance - 20) / 125) * 255)
    data[offset + 3] = Math.min(data[offset + 3], alpha)
    if (keyDistance < 185 && green > Math.max(red, blue)) data[offset + 1] = Math.min(green, Math.max(red, blue) + 5)
  }

  for (let index = 0; index < sheet.names.length; index += 1) {
    const column = index % sheet.columns
    const row = Math.floor(index / sheet.columns)
    const left = Math.round((column * width) / sheet.columns)
    const top = Math.round((row * height) / sheet.rows)
    const right = Math.round(((column + 1) * width) / sheet.columns)
    const bottom = Math.round(((row + 1) * height) / sheet.rows)
    const cell = await sharp(data, { raw: info })
      .extract({ left, top, width: right - left, height: bottom - top })
      .png()
      .toBuffer()
    const icon = await sharp(cell)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
      .resize({ width: sheet.iconSize, height: sheet.iconSize, fit: 'inside', withoutEnlargement: false })
      .png()
      .toBuffer()
    await sharp({
      create: {
        width: sheet.canvasSize,
        height: sheet.canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).composite([{ input: icon, gravity: 'center' }]).png().toFile(path.join(outputDir, `${sheet.names[index]}.png`))
  }
}

console.log('Подготовлены киберпанк-иконки: ингредиенты и улучшения 128×128, UI 256×256.')
