import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  check,
  checks,
  describe as hDescribe,
  expect as hExpect,
  it as hIt,
  runSuiteModule,
} from '../templates/html/__challenge__/harness.js'

describe('hTML harness — runSuiteModule', () => {
  it('passes a suite with all passing checks', async () => {
    const mod = checks([
      check('one', { run() { hExpect(1).toBe(1) } }),
      check('two', { run() { hExpect('hello').toContain('ell') } }),
    ])
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(true)
    expect(result.tests).toHaveLength(2)
    expect(result.tests.every(t => t.passed)).toBe(true)
    expect(result.empty).toBeUndefined()
  })

  it('fails a suite with a failing check and reports the message', async () => {
    const mod = checks([
      check('ok', { run() { hExpect(1).toBe(1) } }),
      check('bad', { run() { hExpect('abc').toContain('xyz') } }),
    ])
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(false)
    expect(result.tests[0]!.passed).toBe(true)
    expect(result.tests[1]!.passed).toBe(false)
    expect(result.tests[1]!.message).toContain('abc')
  })

  it('marks a suite failed when a check throws', async () => {
    const mod = checks([
      check('throw', { run() { throw new Error('kaboom') } }),
    ])
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(false)
    expect(result.tests[0]!.message).toBe('kaboom')
  })

  it('handles async checks', async () => {
    const mod = checks([
      check('async pass', { async run() {
        await new Promise(r => setTimeout(r, 5))
        hExpect(2).toBeGreaterThan(1)
      } }),
      check('async fail', { async run() {
        await new Promise(r => setTimeout(r, 5))
        hExpect(2).toBe(1)
      } }),
    ])
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(false)
    expect(result.tests[0]!.passed).toBe(true)
    expect(result.tests[1]!.passed).toBe(false)
  })

  it('explicitly fails an empty checks() suite (never the every-trick)', async () => {
    const result = await runSuiteModule(checks([]))
    expect(result.passed).toBe(false)
    expect(result.empty).toBe(true)
    expect(result.tests).toHaveLength(1)
    expect(result.tests[0]!.passed).toBe(false)
    expect(result.tests[0]!.message).toContain('Empty suite')
  })

  it('explicitly fails an empty describe/it suite', async () => {
    const result = await runSuiteModule(() => { /* no tests registered */ })
    expect(result.passed).toBe(false)
    expect(result.empty).toBe(true)
  })

  it('supports describe/it with nested suites and correct names', async () => {
    const mod = () => {
      hDescribe('group', () => {
        hIt('leaf', () => {
          hExpect(1).toBe(1)
        })
      })
    }
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(true)
    expect(result.tests[0]!.name).toBe('group › leaf')
  })

  it('supports repeated execution with isolated state', async () => {
    const mod = checks([
      check('a', { run() { hExpect(1).toBe(1) } }),
    ])
    const first = await runSuiteModule(mod)
    expect(first.passed).toBe(true)
    const second = await runSuiteModule(mod)
    expect(second.passed).toBe(true)
  })

  it('returns a clear failure when the module is not a valid suite', async () => {
    const result = await runSuiteModule({ notASuite: true })
    expect(result.passed).toBe(false)
    expect(result.empty).toBe(true)
  })
})

describe('hTML harness — request ids in the message bridge', () => {
  let listeners: Array<(event: any) => void>
  let posted: Array<any>

  beforeEach(() => {
    listeners = []
    posted = []
    // Minimal window/parent stub so startChallengeRuntime can register and post.
    ;(globalThis as any).window = {
      parent: {
        postMessage: (data: any) => (posted as any[]).push(data),
      },
      addEventListener: (_type: string, fn: any) => listeners.push(fn),
    }
    ;(globalThis as any).document = {}
  })

  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).document
    vi.resetModules()
  })

  it('echos the request id back on suite-result', async () => {
    vi.resetModules()
    const harness = await import('../templates/html/__challenge__/harness.js')
    harness.startChallengeRuntime('/__challenge__/suite.js')
    // Dispatch a run-suite message with an id; the harness must import the
    // real suite module via dynamic import, which we can't resolve here, so we
    // expect it to post an error reply — but one that carries the same id.
    const event = {
      data: {
        source: 'nuxt-playground-parent-challenge',
        payload: { method: 'run-suite', file: '/does/not/exist.js', id: 'req-123' },
      },
    }
    ;(listeners[0] as any)(event)
    await new Promise(r => setTimeout(r, 10))
    const reply = (posted as any[]).find(p => p?.payload?.method === 'suite-result')
    expect(reply).toBeTruthy()
    expect(reply.payload.id).toBe('req-123')
    expect(reply.payload.success).toBe(false)
    expect(reply.payload.passed).toBe(false)
  })
})
