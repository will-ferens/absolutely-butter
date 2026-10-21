import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'

const packageDir = resolve(dirname(new URL(import.meta.url).pathname), '..')
const tempDir = mkdtempSync(resolve(tmpdir(), 'absolutely-butter-sdk-'))
const npmEnv = {
  ...process.env,
  npm_config_cache: resolve(tempDir, 'npm-cache'),
}
let tarball

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: packageDir, encoding: 'utf8', stdio: 'pipe', ...options }).trim()
}

try {
  const packageJson = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'))
  const packOutput = run('npm', ['pack', '--json', '--ignore-scripts'], { env: npmEnv })
  const packResult = JSON.parse(packOutput)[0]
  tarball = resolve(packageDir, packResult.filename)

  const requiredFiles = ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'README.md']
  const packedFiles = new Set(packResult.files.map(file => file.path))
  for (const file of requiredFiles) {
    if (!packedFiles.has(file)) throw new Error(`Package is missing ${file}`)
  }

  const forbiddenPrefixes = ['src/', '__tests__/', '.env']
  for (const file of packedFiles) {
    if (forbiddenPrefixes.some(prefix => file.startsWith(prefix))) {
      throw new Error(`Package contains unintended file ${file}`)
    }
  }

  writeFileSync(resolve(tempDir, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: tempDir, env: npmEnv })

  execFileSync(process.execPath, ['--input-type=module', '-e', `import { init, ready, getVariant, track } from '${packageJson.name}'; if (!init || !ready || !getVariant || !track) process.exit(1)`], { cwd: tempDir, stdio: 'inherit' })
  execFileSync(process.execPath, ['-e', `const sdk = require('${packageJson.name}'); if (!sdk.init || !sdk.ready || !sdk.getVariant || !sdk.track) process.exit(1)`], { cwd: tempDir, stdio: 'inherit' })

  writeFileSync(resolve(tempDir, 'consumer.ts'), `import { init, ready, getVariant, track } from '${packageJson.name}'\nvoid init\nvoid ready\nvoid getVariant\nvoid track\n`)
  writeFileSync(resolve(tempDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, module: 'NodeNext', moduleResolution: 'NodeNext', noEmit: true }, files: ['consumer.ts'] }))
  const tsc = resolve(packageDir, '../../node_modules/.bin/tsc')
  execFileSync(tsc, ['--project', resolve(tempDir, 'tsconfig.json')], { cwd: tempDir, stdio: 'inherit' })

  console.log(`Verified ${packageJson.name}@${packageJson.version}: ESM, CommonJS, declarations, and tarball contents.`)
} finally {
  if (tarball) rmSync(tarball, { force: true })
  rmSync(tempDir, { recursive: true, force: true })
}
