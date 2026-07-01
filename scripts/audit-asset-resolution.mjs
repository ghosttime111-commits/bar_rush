import sharp from 'sharp'
import path from 'node:path'
import { readdir } from 'node:fs/promises'

const MAX_RENDER_SCALE = 2
const groups = [
  {
    label: 'background',
    directory: 'public/assets/backgrounds/cyberpunk',
    match: /^night-bar-hd\.png$/,
    display: [1920, 1080],
  },
  {
    label: 'customer',
    directory: 'public/assets/customers/cyberpunk',
    match: /\.png$/,
    display: [188, 190],
  },
  {
    label: 'cocktail',
    directory: 'public/assets/icons/cocktails/cyberpunk',
    match: /\.png$/,
    display: [78, 78],
  },
  {
    label: 'ingredient',
    directory: 'public/assets/icons/ingredients/cyberpunk',
    match: /\.png$/,
    display: [36, 36],
  },
  {
    label: 'UI',
    directory: 'public/assets/icons/ui/cyberpunk',
    match: /\.png$/,
    display: [72, 72],
  },
  {
    label: 'upgrade',
    directory: 'public/assets/icons/upgrades/cyberpunk',
    match: /\.png$/,
    display: [30, 30],
  },
]

let warnings = 0
console.log(`Проверка растровых ассетов для максимального renderScale=${MAX_RENDER_SCALE}`)
console.log('Статус  Группа       Путь                                                     Источник     Max display   Нужно при 2×')

for (const group of groups) {
  const directory = path.resolve(group.directory)
  const files = (await readdir(directory)).filter((file) => group.match.test(file)).sort()
  for (const file of files) {
    const metadata = await sharp(path.join(directory, file)).metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0
    const requiredWidth = Math.ceil(group.display[0] * MAX_RENDER_SCALE)
    const requiredHeight = Math.ceil(group.display[1] * MAX_RENDER_SCALE)
    const ok = width >= requiredWidth && height >= requiredHeight
    if (!ok) warnings += 1
    const relativePath = path.relative(process.cwd(), path.join(directory, file)).replaceAll('\\', '/')
    console.log(
      `${ok ? 'OK    ' : 'WARN  '}  ${group.label.padEnd(12)} ${relativePath.padEnd(56)} `
      + `${`${width}×${height}`.padEnd(12)} `
      + `${`${group.display[0]}×${group.display[1]}`.padEnd(13)} ${requiredWidth}×${requiredHeight}`,
    )
  }
}

if (warnings > 0) {
  console.warn(`\nНайдено предупреждений: ${warnings}. Проверьте реальные размеры показа этих ассетов.`)
  process.exitCode = 1
} else {
  console.log('\nВсе проверенные ассеты имеют достаточный запас для режима «Качество» (2×).')
}
