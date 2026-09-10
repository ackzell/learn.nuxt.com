import type { Server } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { createHtmlServer } from '../templates/html/server.js'

const TPL = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'html')
const openServers: Server[] = []

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })
  openServers.push(server)
  return (server.address() as any).port
}

afterEach(async () => {
  for (const s of openServers.splice(0)) {
    await new Promise<void>((resolve) => {
      s.close(() => resolve())
      ;(s as any).closeFileWatcher?.()
    })
  }
})

describe('html static template', () => {
  it('has no Vite/vitest/chai dependencies and runs node server.js', () => {
    const pkg = JSON.parse(readFileSync(join(TPL, 'package.json'), 'utf-8'))
    expect(pkg.scripts.dev).toBe('node server.js')
    expect(pkg.dependencies || {}).not.toHaveProperty('vite')
    expect(pkg.dependencies || {}).not.toHaveProperty('@vitest/expect')
    expect(pkg.dependencies || {}).not.toHaveProperty('chai')
    expect(pkg.devDependencies || {}).not.toHaveProperty('vite')
  })

  it('has no Vite config or Vite source entrypoint', () => {
    expect(existsSync(join(TPL, 'vite.config.ts'))).toBe(false)
    expect(existsSync(join(TPL, 'vite.config.js'))).toBe(false)
    expect(existsSync(join(TPL, 'main.ts'))).toBe(false)
  })

  it('ships a dependency-free browser harness', () => {
    const harness = readFileSync(join(TPL, '__challenge__', 'harness.js'), 'utf-8')
    expect(harness).toContain('export function check(')
    expect(harness).toContain('export function checks(')
    expect(harness).toContain('export function expect(')
    expect(harness).not.toContain('@vitest')
    expect(harness).not.toContain('from \'chai\'')
  })

  it('auto-starts via process.argv[1] and not import.meta.main (almostnode compat)', () => {
    // almostnode's ESM->CJS transform does not expose `import.meta.main`, so the
    // server must detect the entry via the resolved script path in argv[1].
    const server = readFileSync(join(TPL, 'server.js'), 'utf-8')
    expect(server).toContain(`process.argv[1]?.split('/').pop() === 'server.js'`)
    expect(server).not.toContain('if (import.meta.main)')
  })

  it('serves the entry HTML over HTTP without Vite', async () => {
    const server = createHtmlServer({ watchFs: false, cwd: TPL })
    const port = await listen(server)
    const res = await fetch(`http://127.0.0.1:${port}/`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const text = await res.text()
    expect(text).toContain('<script type="module" src="/main.js">')
  })

  it('injects the challenge harness only when the request is marked ?challenge=', async () => {
    const server = createHtmlServer({ watchFs: false, cwd: TPL })
    const port = await listen(server)
    const marked = await (await fetch(`http://127.0.0.1:${port}/?challenge=/__challenge__/suite.js`)).text()
    expect(marked).toContain('<script type="module" src="/__challenge__/harness.js">')
    const plain = await (await fetch(`http://127.0.0.1:${port}/`)).text()
    expect(plain).not.toContain('/__challenge__/harness.js')
  })

  it('returns 404 for missing files', async () => {
    const server = createHtmlServer({ watchFs: false, cwd: TPL })
    const port = await listen(server)
    const res = await fetch(`http://127.0.0.1:${port}/nope.js`)
    expect(res.status).toBe(404)
  })

  it('serves reload checks as a completed request', async () => {
    const server = createHtmlServer({ watchFs: true, cwd: TPL })
    const port = await listen(server)
    const res = await fetch(`http://127.0.0.1:${port}/__reload`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(await res.text()).toBe('0')
  })
})
