import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

async function fingerprint(directory) {
  const result = []
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await fingerprint(path)))
    else if (entry.name.endsWith('.ts'))
      result.push([
        path,
        createHash('sha256')
          .update(await readFile(path))
          .digest('hex'),
      ])
  }
  return result
}
const before = JSON.stringify(await fingerprint('src/api/generated'))
const generation = spawnSync('pnpm', ['api:generate'], { stdio: 'inherit', shell: false })
if (generation.status !== 0) process.exit(generation.status ?? 1)
const after = JSON.stringify(await fingerprint('src/api/generated'))
if (before !== after) {
  console.error(
    'Generated client drift: review and commit the regenerated client with its OpenAPI snapshot.',
  )
  process.exit(1)
}
console.log('OpenAPI client matches the committed contract snapshot.')
