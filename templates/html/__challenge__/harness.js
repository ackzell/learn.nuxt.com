/**
 * In-container challenge validation runtime for the static `html` template.
 *
 * Runs inside the WebContainer's static server (no Vite, no npm deps) on the
 * same origin as the preview iframe. It provides a small dependency-free
 * `expect` matcher set and the same `check` / `checks` / `expect` authoring
 * vocabulary as the Vue harness, returning an identical result shape over the
 * same postMessage protocol.
 *
 * Public API (used by a guide's `__challenge__/suite.js`):
 *   - `expect`   minimal matchers (toBe, toBeTruthy, toContain, toEqual, ...)
 *   - `check(name, spec)` / `checks([...])` friendly authoring helpers
 *   - `describe` / `it` / `test`  corrected shims for vitest-style modules
 *   - `startChallengeRuntime(path)`  registers the `run-suite` listener
 *
 * Unlike the Vue template, `ctx.mount` is unavailable here (plain HTML/CDN
 * pages) — use `ctx.doc` to assert against the live document.
 */

// ── Minimal matchers ─────────────────────────────────────────────────────────
// Each matcher returns `true` on success. On failure it throws an Error with a
// readable message. `actual` is the value passed to `expect(...)`.
const MATCHERS = {
  toBe(expected) {
    return Object.is(this.actual, expected)
  },
  toEqual(expected) {
    return deepEqual(this.actual, expected)
  },
  toStrictEqual(expected) {
    return deepEqual(this.actual, expected, true)
  },
  toBeTruthy() {
    return Boolean(this.actual)
  },
  toBeFalsy() {
    return !this.actual
  },
  toBeNull() {
    return this.actual === null
  },
  toBeUndefined() {
    return this.actual === undefined
  },
  toBeDefined() {
    return this.actual !== undefined
  },
  toBeNaN() {
    return Number.isNaN(this.actual)
  },
  toBeGreaterThan(expected) {
    return this.actual > expected
  },
  toBeGreaterThanOrEqual(expected) {
    return this.actual >= expected
  },
  toBeLessThan(expected) {
    return this.actual < expected
  },
  toBeLessThanOrEqual(expected) {
    return this.actual <= expected
  },
  toContain(expected) {
    if (typeof this.actual === 'string')
      return this.actual.includes(String(expected))
    if (Array.isArray(this.actual))
      return this.actual.some(item => deepEqual(item, expected))
    if (this.actual && typeof this.actual === 'object' && typeof this.actual[Symbol.iterator] === 'function') {
      for (const item of this.actual) {
        if (deepEqual(item, expected))
          return true
      }
      return false
    }
    return false
  },
  toMatch(expected) {
    if (expected instanceof RegExp)
      return expected.test(String(this.actual))
    return String(this.actual).includes(String(expected))
  },
}

function deepEqual(a, b, strict = false, seen = new Map()) {
  // Handle primitives with Object.is for strict, otherwise == loose equal.
  if (strict ? Object.is(a, b) : a === b)
    return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object')
    return false
  // Avoid cycles.
  const aKey = seen.get(a)
  if (aKey === b)
    return true
  seen.set(a, b)
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length)
      return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], strict, seen))
        return false
    }
    return true
  }
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  if (aKeys.length !== bKeys.length)
    return false
  for (const key of aKeys) {
    if (!(key in b))
      return false
    if (!deepEqual(a[key], b[key], strict, seen))
      return false
  }
  return true
}

function format(value) {
  if (typeof value === 'string')
    return JSON.stringify(value)
  if (value === undefined)
    return 'undefined'
  if (typeof value === 'function')
    return '[Function]'
  try {
    return JSON.stringify(value)
  }
  catch {
    return String(value)
  }
}

/**
 * The assertion object handed to authored checks. Chained matchers throw on
 * failure so the surrounding check is marked as failed with a clear message.
 */
function makeExpect(actual) {
  const api = {
    get not() {
      return makeNegated(actual)
    },
  }
  for (const name of Object.keys(MATCHERS)) {
    api[name] = (...args) => runMatcher(name, actual, args)
  }
  return api

  function makeNegated(value) {
    const negated = {}
    for (const name of Object.keys(MATCHERS)) {
      negated[name] = (...args) => {
        const ok = MATCHERS[name].call({ actual: value }, ...args)
        if (ok)
          throw new Error(`expected ${format(value)} not ${describeMatcher(name, args)}`)
      }
    }
    return negated
  }
}

function describeMatcher(name, args) {
  if (args.length === 0)
    return name
  const parts = [name]
  for (const a of args)
    parts.push(format(a))
  return parts.join(' ')
}

function runMatcher(name, actual, args) {
  let ok
  try {
    ok = MATCHERS[name].call({ actual }, ...args)
  }
  catch {
    ok = false
  }
  if (!ok) {
    const desc = describeMatcher(name, args)
    throw new Error(`expected ${format(actual)} ${desc}`)
  }
}

export function expect(actual) {
  return makeExpect(actual)
}

export function expectAny() {
  // Shallow placeholder for symmetry with the Vue harness; not used by checks.
  return { any: () => ({ __amxAny: true }) }
}

// ── Check DSL ────────────────────────────────────────────────────────────────

export function check(name, spec) {
  return [name, spec]
}

export function checks(createChecks, options = {}) {
  return {
    __amxChecks: true,
    async run(ctx) {
      const base = ctx
      if (options.setup)
        Object.assign(base, await options.setup(base))
      const results = []
      for (const [name, spec] of createChecks)
        results.push(await runCheck(name, spec, base))
      return results
    },
  }
}

async function runCheck(name, spec, ctx) {
  try {
    await spec.run(ctx)
    return { name, passed: true, hint: spec.hint, category: spec.category, message: '' }
  }
  catch (err) {
    return {
      name,
      passed: false,
      hint: spec.hint,
      category: spec.category,
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

// ── describe / it shims (corrected) ──────────────────────────────────────────
// Slightly adapted from vitest but executed inline (no async queue). Kept for
// authors migrating existing suites; the preferred DSL is `checks([...])`.

const suites = []
let current = null

export function describe(name, fn) {
  const parent = current
  const suite = { name, tests: [], children: [] }
  if (current)
    current.children.push(suite)
  else
    suites.push(suite)
  current = suite
  fn()
  current = parent
}

export function it(name, fn) {
  if (!current) {
    const suite = { name: '', tests: [], children: [] }
    suites.push(suite)
    current = suite
    current.tests.push({ name, fn })
    current = null
    return
  }
  current.tests.push({ name, fn })
}
export const test = it

// ── Suite execution ──────────────────────────────────────────────────────────

/**
 * Collect every leaf test in a describe/it tree into flat entries.
 */
function flattenSuite(suite, prefix) {
  const full = prefix ? `${prefix} › ${suite.name}` : suite.name
  const out = []
  for (const t of suite.tests)
    out.push({ name: t.name ? `${full} › ${t.name}` : full, fn: t.fn })
  for (const child of suite.children)
    out.push(...flattenSuite(child, full))
  return out
}

function buildSuiteResult(tests) {
  return { passed: tests.every(t => t.passed), tests }
}

/**
 * Execute a suite module and collect its checks into the shared result shape.
 *
 * Acceptance rule: a suite only "passes" when it is non-empty and every check
 * passes. An empty suite is an explicit failure — it must never pass because
 * `[].every(...) === true`.
 *
 * Returns `{ passed, tests }` where `tests` is the authored list (or a single
 * synthesized failing entry for an empty/missing suite).
 */
export async function runSuiteModule(mod) {
  const ctx = { doc: typeof document !== 'undefined' ? document : null }

  const runChecksShape = async (checksMod) => {
    const tests = await checksMod.run(ctx)
    if (tests.length === 0) {
      return {
        passed: false,
        empty: true,
        tests: [{ name: 'suite', passed: false, message: 'Empty suite: add at least one check().' }],
      }
    }
    return buildSuiteResult(tests)
  }

  // Shape A: module authored via checks()/check()
  const checksObj = mod?.__amxChecks ? mod : mod?.default
  if (checksObj?.__amxChecks && typeof checksObj.run === 'function')
    return runChecksShape(checksObj)

  // Shape B: describe()/it() registration module.
  suites.length = 0
  current = null
  if (typeof mod === 'function')
    mod()
  else if (mod && typeof mod.default === 'function')
    mod.default()

  const leaves = suites.flatMap(suite => flattenSuite(suite, ''))
  suites.length = 0
  current = null

  if (leaves.length === 0) {
    return {
      passed: false,
      empty: true,
      tests: [{ name: 'suite', passed: false, message: 'Empty suite: add at least one check() or it().' }],
    }
  }

  const tests = []
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

// ── postMessage bridge to the host ───────────────────────────────────────────

function post(payload) {
  window.parent.postMessage({ source: 'nuxt-playground-challenge', payload }, '*')
}

let started = false

/**
 * Register the `run-suite` message listener. Loads the authored JS suite and
 * executes it against the live document, echoing the request id back in the
 * `suite-result` reply so the host can resolve the correct pending call.
 */
export function startChallengeRuntime(suitePath = '/__challenge__/suite.js') {
  if (started)
    return
  started = true
  window.addEventListener('message', async (event) => {
    if (typeof event.data !== 'object')
      return
    if (event.data.source !== 'nuxt-playground-parent-challenge')
      return
    const payload = event.data.payload
    if (payload?.method === 'challenge-ping') {
      post({ method: 'challenge-ready' })
      return
    }
    if (!payload || payload.method !== 'run-suite')
      return
    const id = typeof payload.id === 'string' ? payload.id : ''
    try {
      const file = payload.file || suitePath
      const specPath = file.startsWith('/') || file.startsWith('.')
        ? file
        : `/${file}`
      const mod = await import(/* webpackIgnore: true */ specPath)
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
  post({ method: 'challenge-ready' })
}

// Self-initialize on import so any page that loads this module is able to run
// suites. Re-exported as a named function for the entry point, but also fine to
// run without an explicit call.
if (typeof window !== 'undefined') {
  startChallengeRuntime()
}
