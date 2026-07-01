import sharp from 'sharp'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const input = path.resolve('tmp/imagegen/night-bar-hd-source.png')
const output = path.resolve('public/assets/backgrounds/cyberpunk/night-bar-hd.png')

await mkdir(path.dirname(output), { recursive: true })
await sharp(input)
  .resize(3840, 2160, {
    fit: 'cover',
    position: 'centre',
    kernel: sharp.kernel.lanczos3,
  })
  .sharpen({ sigma: 0.75, m1: 0.5, m2: 1.2 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(output)

console.log('Подготовлен детализированный фон 3840×2160; исходный night-bar.png сохранён как fallback.')
