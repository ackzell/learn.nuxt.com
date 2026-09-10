import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useChallengeValidation } from '~/composables/useChallengeValidation'

// Shared state accessible to the module factories and the test body via
// `vi.hoisted` (mock factories are hoisted above the declarations otherwise).
const mocks = vi.hoisted(() => ({
  guideStoreRef: { currentGuide: {} as any },
  calls: { pass: 0, attempt: 0 },
}))

// Mock the Nuxt-coupled store and the Dexie-backed persistence layer so we can
// exercise the validation composable's decision logic in isolation.
vi.mock('~/stores/guide', () => ({
  useGuideStore: () => mocks.guideStoreRef,
}))

// The composable reads the container's files to persist the user's passing
// solution (recordPass(sessionName, files)). Return an empty file map so the
// host-side decision logic stays testable without a WebContainer.
vi.mock('~/stores/playground', () => ({
  usePlaygroundStore: () => ({ files: new Map() }),
}))

vi.mock('~/db/challenges', () => ({
  challenges: {
    recordPass: vi.fn(async () => { mocks.calls.pass += 1 }),
    recordAttempt: vi.fn(async () => { mocks.calls.attempt += 1 }),
    incrementAttempts: vi.fn(async () => {}),
  },
}))

function setSuite(payload: any) {
  ;(globalThis as any).window ??= {}
  ;(globalThis as any).window.__runChallengeSuite = vi.fn(async () => payload)
}

beforeEach(() => {
  ;(globalThis as any).window ??= {}
  setActivePinia(createPinia())
  mocks.calls.pass = 0
  mocks.calls.attempt = 0
  mocks.guideStoreRef.currentGuide = {
    sessionName: 'basics-challenge',
    validation: { file: '/__challenge__/suite.js' },
  }
})

afterEach(() => {
  if ((globalThis as any).window)
    delete (globalThis as any).window.__runChallengeSuite
})

describe('useChallengeValidation — host UI path', () => {
  it('fails when the suite reports a failed check', async () => {
    setSuite({
      id: '1',
      success: true,
      passed: false,
      tests: [{ name: 'x', passed: false, message: 'boom' }],
    })
    const v = useChallengeValidation()
    const ok = await v.runValidation()
    expect(ok).toBe(false)
    expect(v.failed.value).toBe(true)
    expect(v.passed.value).toBe(false)
    expect(mocks.calls.pass).toBe(0)
    expect(mocks.calls.attempt).toBe(1)
    expect(v.results.value[0]!.passed).toBe(false)
  })

  it('completes when the suite is non-empty and fully passing', async () => {
    setSuite({
      id: '2',
      success: true,
      passed: true,
      tests: [{ name: 'a', passed: true, message: '' }],
    })
    const v = useChallengeValidation()
    const ok = await v.runValidation()
    expect(ok).toBe(true)
    expect(v.passed.value).toBe(true)
    expect(mocks.calls.pass).toBe(1)
    expect(mocks.calls.attempt).toBe(0)
  })

  it('treats an empty suite as a hard failure (never passes / never records)', async () => {
    // Adversarial: the harness would never send passed=true with an empty
    // suite, but the host must guard so `[].every(...) === true` can't happen.
    setSuite({
      id: '3',
      success: true,
      empty: true,
      passed: true,
      tests: [],
    })
    const v = useChallengeValidation()
    const ok = await v.runValidation()
    expect(ok).toBe(false)
    expect(v.passed.value).toBe(false)
    expect(v.failed.value).toBe(true)
    expect(mocks.calls.pass).toBe(0)
    expect(mocks.calls.attempt).toBe(1)
  })

  it('fails when the preview runner is not present yet', async () => {
    // No __runChallengeSuite set.
    const v = useChallengeValidation()
    const ok = await v.runValidation()
    expect(ok).toBe(false)
    expect(v.failed.value).toBe(true)
    expect(mocks.calls.pass).toBe(0)
    expect(mocks.calls.attempt).toBe(1)
  })

  it('ignores a cancelled suite without changing status or recording an attempt', async () => {
    setSuite({ id: 'cancelled', success: false, cancelled: true, tests: [] })
    const v = useChallengeValidation()
    v.reset()
    const ok = await v.runValidation()
    expect(ok).toBe(false)
    expect(v.status.value).toBe('idle')
    expect(v.results.value).toHaveLength(0)
    expect(mocks.calls.pass).toBe(0)
    expect(mocks.calls.attempt).toBe(0)
  })

  it('records repeated passes (reload-safe persistence path)', async () => {
    setSuite({ id: '4', success: true, passed: true, tests: [{ name: 'a', passed: true, message: '' }] })
    const v = useChallengeValidation()
    await v.runValidation()
    await v.runValidation()
    expect(mocks.calls.pass).toBe(2)
  })

  it('can reset to idle', async () => {
    const v = useChallengeValidation()
    v.reset()
    expect(v.status.value).toBe('idle')
    expect(v.results.value).toHaveLength(0)
  })
})
