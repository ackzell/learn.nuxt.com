/**
 * In-container challenge validation harness.
 *
 * Runs inside the WebContainer's Vite app (same origin as the preview iframe)
 * so it can reach the live DOM and, for Vue templates, mount components with
 * Vue Test Utils. This lets lesson authors write real `expect()`-style checks
 * using `@vitest/expect`'s matchers without installing the full vitest runner
 * or spawning a second process.
 *
 * Public API (used by a guide's `__challenge__/suite.ts`):
 *   - `expect`   vitest-style matchers (toBe, toContain, toBeGreaterThan, …)
 *   - `mount`    Vue Test Utils `mount` (Vue templates only; absent for html)
 *   - `checks(run, opts)` / `check(name, spec)` friendly authoring helpers
 *   - `describe` / `it` / `test`  minimal shims for vitest-style modules
 */

import type { ExpectStatic } from '@vitest/expect'
import {
  GLOBAL_EXPECT,
  JestAsymmetricMatchers,
  JestChaiExpect,
  JestExtend,
  setState,
} from '@vitest/expect'
import { mount } from '@vue/test-utils'
import * as chai from 'chai'

export { mount }

/** Local mirror of the host `types/validation.ts` shapes (container is isolated). */
export type ChallengeCategory = 'content' | 'behavior' | 'binding' | 'data' | (string & {})

export interface ChallengeCheckResult {
  name: string
  passed: boolean
  hint?: string
  category?: ChallengeCategory
  message: string
}

// Reconstruct vitest's `expect` from `@vitest/expect`'s matcher plugins layered
// on chai. This avoids pulling in the full vitest runtime in the container.
function constructExpect() {
  const expect = chai.expect
  setState(
    {
      testPath: '',
      currentTestName: undefined,
      expand: false,
      isNot: false,
      promise: undefined,
    },
    // chai.expect is augmented at runtime by the vitest plugins into vitest's
    // ExpectStatic; the two static types diverge so we bridge them here.
    expect as unknown as Parameters<typeof setState>[1],
  )
  ;(globalThis as any)[GLOBAL_EXPECT] = expect
  chai.use(JestExtend)
  chai.use(JestChaiExpect)
  chai.use(JestAsymmetricMatchers)
  return expect as unknown as ExpectStatic
}

export const expect = constructExpect()

export interface CheckContext {
  /** The live document inside the iframe (same origin). */
  doc: Document
  /** Vue Test Utils mount for mounting components from source (Vue templates). */
  mount: typeof mount
}

export interface CheckSpec {
  /** Runs the assertion(s). Receives the live context; throw to fail. */
  run: (ctx: CheckContext) => void | Promise<void>
  /** i18n key resolved by the host UI for a friendly hint on failure. */
  hint?: string
  /** Category used for grouping/coloring in the UI. */
  category?: ChallengeCategory
}

/** Run a single check, capturing pass/fail + the failing assertion message. */
async function runCheck(name: string, spec: CheckSpec, ctx: CheckContext): Promise<ChallengeCheckResult> {
  try {
    await spec.run(ctx)
    return { name, passed: true, hint: spec.hint, category: spec.category, message: '' }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { name, passed: false, hint: spec.hint, category: spec.category, message }
  }
}

export interface ChecksOptions {
  /** Shared beforeEach-style setup; result is merged into the ctx. */
  setup?: (ctx: CheckContext) => void | Promise<Partial<CheckContext>>
}

export function checks(
  createChecks: Array<[string, CheckSpec]>,
  options: ChecksOptions = {},
) {
  return {
    __amxChecks: true,
    run: async (ctx: CheckContext): Promise<ChallengeCheckResult[]> => {
      const base: CheckContext = { doc: ctx.doc, mount: ctx.mount }
      if (options.setup)
        Object.assign(base, await options.setup(base))
      const results: ChallengeCheckResult[] = []
      for (const [name, spec] of createChecks)
        results.push(await runCheck(name, spec, base))
      return results
    },
  }
}

/** Convenience for expressing a single check as an entry. */
export function check(name: string, spec: CheckSpec): [string, CheckSpec] {
  return [name, spec]
}

// ── describe / it shims (corrected) ──────────────────────────────────────────
// Slightly adapted from vitest but executed inline (no async queue/scheduling).
// The preferred authoring DSL is `checks([...])`; these shims exist for authors
// migrating existing suites. The empty-suite rule applies here too.

type Fn = () => unknown
interface SuiteState {
  name: string
  tests: { name: string, fn: Fn }[]
  children: SuiteState[]
}
const suites: SuiteState[] = []
let currentSuite: SuiteState | null = null

export function describe(name: string, fn: () => void) {
  const parent = currentSuite
  const suite: SuiteState = { name, tests: [], children: [] }
  if (parent)
    parent.children.push(suite)
  else
    suites.push(suite)
  currentSuite = suite
  fn()
  currentSuite = parent
}

export function it(name: string, fn: Fn) {
  if (!currentSuite) {
    const suite: SuiteState = { name: '', tests: [], children: [] }
    suites.push(suite)
    currentSuite = suite
    currentSuite.tests.push({ name, fn })
    currentSuite = null
    return
  }
  currentSuite.tests.push({ name, fn })
}
export const test = it

function flattenSuite(suite: SuiteState, prefix: string): { name: string, fn: Fn }[] {
  const full = prefix ? `${prefix} › ${suite.name}` : suite.name
  const out: { name: string, fn: Fn }[] = []
  for (const t of suite.tests)
    out.push({ name: t.name ? `${full} › ${t.name}` : full, fn: t.fn })
  for (const child of suite.children)
    out.push(...flattenSuite(child, full))
  return out
}

function buildSuiteResult(tests: ChallengeCheckResult[]) {
  return { passed: tests.every((t: ChallengeCheckResult) => t.passed), tests }
}

/**
 * Execute a suite module and collect its checks into the shared result shape.
 *
 * Acceptance rule: a suite only "passes" when it is non-empty and every check
 * passes. An empty suite is an explicit failure — it must never pass because
 * `[].every(...) === true`.
 */
export async function runSuiteModule(mod: any): Promise<{ passed: boolean, tests: ChallengeCheckResult[], empty?: boolean }> {
  const ctx: CheckContext = { doc: document, mount }

  // Shape A: module authored via checks()/check()
  if (mod?.__amxChecks && typeof mod.run === 'function') {
    const tests = await mod.run(ctx)
    if (tests.length === 0) {
      return {
        passed: false,
        empty: true,
        tests: [{ name: 'suite', passed: false, message: 'Empty suite: add at least one check().' }],
      }
    }
    return buildSuiteResult(tests)
  }

  // Shape B: describe()/it() registration module.
  suites.length = 0
  currentSuite = null
  if (typeof mod === 'function')
    mod()
  else if (mod?.default && typeof mod.default === 'function')
    mod.default()

  const leaves = suites.flatMap(suite => flattenSuite(suite, ''))
  suites.length = 0
  currentSuite = null

  if (leaves.length === 0) {
    return {
      passed: false,
      empty: true,
      tests: [{ name: 'suite', passed: false, message: 'Empty suite: add at least one check() or it().' }],
    }
  }

  const tests: ChallengeCheckResult[] = []
  for (const leaf of leaves) {
    try {
      await leaf.fn()
      tests.push({ name: leaf.name, passed: true, message: '' })
    }
    catch (err) {
      tests.push({
        name: leaf.name,
        passed: false,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return buildSuiteResult(tests)
}

// ── postMessage bridge to the host ──────────────────────────────────────────

function post(payload: unknown) {
  window.parent.postMessage({ source: 'nuxt-playground-challenge', payload }, '*')
}

let started = false

/**
 * Register the `run-suite` message listener. Imports the authored suite and
 * runs it against the live document, echoing the request id back in the
 * `suite-result` reply so the host can resolve the correct pending call.
 */
export function startChallengeRuntime(suitePath = '/__challenge__/suite.ts') {
  if (started)
    return
  started = true
  window.addEventListener('message', async (event) => {
    if (typeof event.data !== 'object')
      return
    if (event.data.source !== 'nuxt-playground-parent-challenge')
      return
    const payload = event.data.payload
    if (!payload || payload.method !== 'run-suite')
      return
    const id = typeof payload.id === 'string' ? payload.id : ''
    try {
      const file = payload.file || suitePath
      const specPath = file.startsWith('/') || file.startsWith('.') || file.startsWith('@')
        ? file
        : `/${file}`
      const mod = await import(/* @vite-ignore */ specPath)
      const result = await runSuiteModule(mod)
      post({ id, method: 'suite-result', success: true, ...result })
    }
    catch (err) {
      post({
        id,
        method: 'suite-result',
        success: false,
        empty: true,
        passed: false,
        tests: [{ name: 'suite', passed: false, message: err instanceof Error ? err.message : String(err) }],
      })
    }
  })
}
