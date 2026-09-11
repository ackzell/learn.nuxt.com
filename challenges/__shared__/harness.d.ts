/**
 * Authoring types for challenge bank suites (`challenges/<id>/suite.ts`).
 *
 * The bank suite is the ONLY place the challenge's checks are written. Runtime
 * details are handled for you:
 *   - `check('<id>', ...)` — the first argument is the check ID, used as the
 *     key in `en.yaml` / `es_mx.yaml` to resolve the localized display name
 *     and hint at build time. The mounted suite is generated from this file.
 *   - `checks([...])` wraps the list and marks the module as a suite.
 *   - `expect(actual).toX()` — hand-rolled vitest-style matchers. Works in
 *     both the static `html` template (dependency-free harness) and the Vue
 *     templates (Vue Test Utils backed harness).
 *   - `run({ doc })` gives you the live DOM of the preview iframe. In Vue
 *     templates `mount` lets you mount a component with Vue Test Utils (via
 *     `ctx.mount`).
 *
 * Import it from the bare module `harness` (resolved in
 * `challenges/tsconfig.json`); the build rewrites the import to the correct
 * relative runtime path per template.
 */

export type ChallengeCategory = 'content' | 'behavior' | 'binding' | 'data' | (string & {})

export interface ChallengeCheckResult {
  name: string
  passed: boolean
  hint?: string
  category?: ChallengeCategory
  message: string
}

/**
 * Context handed to every `check`'s `run`. `doc` is the live document inside
 * the preview iframe (same origin), available in every template.
 */
export interface CheckContext {
  /** The live document inside the iframe. */
  doc: Document | null
  /**
   * Vue Test Utils `mount` — only available in `vue` / `vue-sass` templates.
   * Static `html` challenges can only assert against `doc`.
   */
  mount?: <T>(component: T, options?: Record<string, unknown>) => DomWrapperLike
}

/**
 * Minimal Vue Test Utils wrapper surface for authoring mount checks.
 * The real runtime returns full VTU wrappers; these narrowed members keep
 * bank suites typed without dragging the VTU dependency into authoring.
 */
export interface DomWrapperLike {
  exists: () => boolean
  find: (selector: string) => DomWrapperLike
  findAll: (selector: string) => DomWrapperLike[]
  text: () => string
  html: () => string
  classes: () => string[]
}

export interface CheckSpec {
  run: (ctx: CheckContext) => void | Promise<void>
  /** Optional friendly hint shown on failure (localized from yaml when set). */
  hint?: string
  category?: ChallengeCategory
}

export interface ChecksOptions {
  setup?: (ctx: CheckContext) => void | Promise<Partial<CheckContext>>
}

export interface SuiteModuleResult {
  passed: boolean
  tests: ChallengeCheckResult[]
  empty?: boolean
}

export interface Matchers<T> {
  toBe: (expected: unknown) => T
  toEqual: (expected: unknown) => T
  toStrictEqual: (expected: unknown) => T
  toBeTruthy: () => T
  toBeFalsy: () => T
  toBeNull: () => T
  toBeUndefined: () => T
  toBeDefined: () => T
  toBeNaN: () => T
  toBeGreaterThan: (n: number) => T
  toBeGreaterThanOrEqual: (n: number) => T
  toBeLessThan: (n: number) => T
  toBeLessThanOrEqual: (n: number) => T
  toContain: (expected: unknown) => T
  toMatch: (expected: RegExp | string) => T
}

export interface NegativeMatchers extends Matchers<never> {}

export interface ExpectHandle {
  not: NegativeMatchers
}

export function expect<T = unknown>(actual: T): ExpectHandle & Matchers<ExpectHandle>

export type CheckEntry = [string, CheckSpec]

export function check(name: string, spec: CheckSpec): CheckEntry
export function checks(createChecks: CheckEntry[], options?: ChecksOptions): {
  __amxChecks: true
  run: (ctx: CheckContext) => Promise<ChallengeCheckResult[]>
}
export function runSuiteModule(mod: unknown): Promise<SuiteModuleResult>

export function describe(name: string, fn: () => void): void
export function it(name: string, fn: () => void | Promise<void>): void
export function test(name: string, fn: () => void | Promise<void>): void

export function startChallengeRuntime(suitePath?: string): void
export function expectAny(): { any: () => { __amxAny: true } }
