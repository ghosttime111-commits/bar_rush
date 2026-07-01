import sharp from 'sharp'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const input = path.resolve('tmp/imagegen/cyberpunk-customers-chroma.png')
const outputDir = path.resolve('public/assets/customers/cyberpunk')
const columns = 5
const rows = 2
const canvasWidth = 400
const canvasHeight = 540

await mkdir(outputDir, { recursive: true })
const source = sharp(input).ensureAlpha()
const { width = 0, height = 0 } = await source.metadata()
if (!width || !height) throw new Error('Не удалось прочитать лист персонажей.')

const { data, info } = await source.raw().toBuffer({ resolveWithObject: true })
for (let offset = 0; offset < data.length; offset += info.channels) {
  const red = data[offset]
  const green = data[offset + 1]
  const blue = data[offset + 2]
  const distance = Math.hypot(red, 255 - green, blue)
  const alpha = distance <= 24 ? 0 : distance >= 150 ? 255 : Math.round(((distance - 24) / 126) * 255)
  data[offset + 3] = Math.min(data[offset + 3], alpha)
  if (distance < 190 && green > Math.max(red, blue)) data[offset + 1] = Math.min(green, Math.max(red, blue) + 6)
}

const keyed = sharp(data, { raw: info }).png()
for (let index = 0; index < columns * rows; index += 1) {
  const column = index % columns
  const row = Math.floor(index / columns)
  const left = Math.round((column * width) / columns)
  const top = Math.round((row * height) / rows)
  const right = Math.round(((column + 1) * width) / columns)
  const bottom = Math.round(((row + 1) * height) / rows)
  const cell = await keyed.clone()
    .extract({ left, top, width: right - left, height: bottom - top })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize({ width: 352, height: 492, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer()
  await sharp({
    create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: cell, gravity: 'south' }])
    .png()
    .toFile(path.join(outputDir, `customer-${String(index + 1).padStart(2, '0')}.png`))
}

console.log(`Подготовлено ${columns * rows} киберпанк-персонажей ${canvasWidth}×${canvasHeight}.`)
