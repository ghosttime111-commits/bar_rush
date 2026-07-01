import sharp from 'sharp'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const input = path.resolve('tmp/imagegen/cocktail-icons-chroma.png')
const outputDir = path.resolve('public/assets/icons/cocktails/cyberpunk')
const columns = 7
const rows = 2
const names = [
  'beer', 'shot', 'whisky-ice', 'rum-cola', 'mojito', 'gin-tonic', 'screwdriver',
  'daiquiri', 'cuba-libre', 'margarita', 'tequila-sunrise', 'kamikaze', 'cosmopolitan', 'whisky-sour',
]

await mkdir(outputDir, { recursive: true })
const source = sharp(input).ensureAlpha()
const { width = 0, height = 0 } = await source.metadata()
if (!width || !height) throw new Error('Не удалось прочитать лист иконок коктейлей.')
const { data, info } = await source.raw().toBuffer({ resolveWithObject: true })

for (let offset = 0; offset < data.length; offset += info.channels) {
  const red = data[offset]
  const green = data[offset + 1]
  const blue = data[offset + 2]
  const distance = Math.hypot(red, 255 - green, blue)
  const alpha = distance <= 20 ? 0 : distance >= 145 ? 255 : Math.round(((distance - 20) / 125) * 255)
  data[offset + 3] = Math.min(data[offset + 3], alpha)
  if (distance < 185 && green > Math.max(red, blue)) data[offset + 1] = Math.min(green, Math.max(red, blue) + 5)
}

for (let index = 0; index < names.length; index += 1) {
  const column = index % columns
  const row = Math.floor(index / columns)
  const left = Math.round((column * width) / columns)
  const top = Math.round((row * height) / rows)
  const right = Math.round(((column + 1) * width) / columns)
  const bottom = Math.round(((row + 1) * height) / rows)
  const cell = await sharp(data, { raw: info })
    .extract({ left, top, width: right - left, height: bottom - top })
    .png()
    .toBuffer()
  const icon = await sharp(cell)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize({ width: 108, height: 108, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()
  await sharp({
    create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: icon, gravity: 'center' }]).png().toFile(path.join(outputDir, `${names[index]}.png`))
}

console.log(`Подготовлено ${names.length} иконок коктейлей 128×128.`)
