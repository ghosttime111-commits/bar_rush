import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = resolve('public/assets/customers/customer-sheet.png')
const outputDir = resolve('public/assets/customers')
const columns = 3
const rows = 3
const canvasSize = 512
const defaultPadding = 40

await mkdir(outputDir, { recursive: true })

const metadata = await sharp(source).metadata()
if (!metadata.width || !metadata.height) throw new Error('Не удалось определить размер customer-sheet.png')

const cellWidth = Math.floor(metadata.width / columns)
const cellHeight = Math.floor(metadata.height / rows)

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const index = row * columns + column + 1
    const width = column === columns - 1 ? metadata.width - cellWidth * column : cellWidth
    const height = row === rows - 1 ? metadata.height - cellHeight * row : cellHeight
    const fragment = sharp(source).extract({
      left: column * cellWidth,
      top: row * cellHeight,
      width,
      height,
    }).ensureAlpha()

    const { data, info } = await fragment.raw().toBuffer({ resolveWithObject: true })
    removeConnectedDarkBackground(data, info.width, info.height)
    keepLargestVisibleComponent(data, info.width, info.height)
    softenAlphaEdges(data, info.width, info.height)

    const filename = `customer-${String(index).padStart(2, '0')}.png`
    const padding = index === 4
      ? { top: 40, right: 40, bottom: 40, left: 64 }
      : { top: defaultPadding, right: defaultPadding, bottom: defaultPadding, left: defaultPadding }
    const contentWidth = canvasSize - padding.left - padding.right
    const contentHeight = canvasSize - padding.top - padding.bottom
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
      .resize({
        width: contentWidth,
        height: contentHeight,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        withoutEnlargement: false,
      })
      .extend({
        top: padding.top,
        bottom: padding.bottom,
        left: padding.left,
        right: padding.right,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(resolve(outputDir, filename))

    console.log(`Создан ${filename}`)
  }
}

function keepLargestVisibleComponent(data, width, height) {
  const visited = new Uint8Array(width * height)
  const components = []

  for (let start = 0; start < width * height; start += 1) {
    if (visited[start] || data[start * 4 + 3] < 24) continue
    const queue = [start]
    const pixels = []
    visited[start] = 1

    while (queue.length) {
      const pixel = queue.pop()
      pixels.push(pixel)
      const x = pixel % width
      const y = Math.floor(pixel / width)
      for (const neighbour of [
        x > 0 ? pixel - 1 : -1,
        x < width - 1 ? pixel + 1 : -1,
        y > 0 ? pixel - width : -1,
        y < height - 1 ? pixel + width : -1,
      ]) {
        if (neighbour < 0 || visited[neighbour] || data[neighbour * 4 + 3] < 24) continue
        visited[neighbour] = 1
        queue.push(neighbour)
      }
    }
    components.push({
      pixels,
      touchesEdge: pixels.some((pixel) => {
        const x = pixel % width
        const y = Math.floor(pixel / width)
        return x <= 2 || y <= 2 || x >= width - 3 || y >= height - 3
      }),
    })
  }

  const largest = [...components].sort((a, b) => b.pixels.length - a.pixels.length)[0]
  if (!largest) return
  const keep = new Uint8Array(width * height)
  components
    .filter((component) => component === largest || !component.touchesEdge)
    .forEach((component) => component.pixels.forEach((pixel) => { keep[pixel] = 1 }))
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (!keep[pixel]) data[pixel * 4 + 3] = 0
  }
}

function removeConnectedDarkBackground(data, width, height) {
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let head = 0
  let tail = 0

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const pixel = y * width + x
    if (visited[pixel] || !isRemovable(data, pixel * 4)) return
    visited[pixel] = 1
    queue[tail++] = pixel
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  while (head < tail) {
    const pixel = queue[head++]
    const x = pixel % width
    const y = Math.floor(pixel / width)
    data[pixel * 4 + 3] = 0
    enqueue(x - 1, y)
    enqueue(x + 1, y)
    enqueue(x, y - 1)
    enqueue(x, y + 1)
  }
}

function isRemovable(data, offset) {
  const r = data[offset]
  const g = data[offset + 1]
  const b = data[offset + 2]
  const luminance = r * 0.299 + g * 0.587 + b * 0.114
  const brownBackground = r > g * 1.08 && g > b * 1.04
  return brownBackground && luminance < 118 && b < 92
}

function softenAlphaEdges(data, width, height) {
  const originalAlpha = new Uint8Array(width * height)
  for (let pixel = 0; pixel < width * height; pixel += 1) originalAlpha[pixel] = data[pixel * 4 + 3]

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixel = y * width + x
      if (originalAlpha[pixel] === 0) continue
      let transparentNeighbours = 0
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (originalAlpha[(y + dy) * width + x + dx] === 0) transparentNeighbours += 1
        }
      }
      if (transparentNeighbours) data[pixel * 4 + 3] = Math.max(90, 255 - transparentNeighbours * 24)
    }
  }
}
