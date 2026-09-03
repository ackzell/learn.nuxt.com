/**
 * Type declarations for the dependency-free HTML challenge harness (`harness.js`).
 * The runtime is plain JavaScript; this file gives consumers (and editors/tests)
 * the same authoring types as the Vue harness.
 */

export type ChallengeCategory = 'content' | 'behavior' | 'binding' | 'data' | (string & {})

export interface ChallengeCheckResult {
  name: string
  passed: boolean
  hint?: string
  category?: ChallengeCategory
  message: string
}

export interface CheckContext {
  /** The live document inside the iframe (same origin). `mount` is unavailable here. */
  doc: Document | null
  mount?: undefined
}

export interface CheckSpec {
  run: (ctx: CheckContext) => void | Promise<void>
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
export function checks(createChecks: CheckEntry[], options?: ChecksOptions): { __amxChecks: true, run: (ctx: CheckContext) => Promise<ChallengeCheckResult[]> }
export function runSuiteModule(mod: unknown): Promise<SuiteModuleResult>

export function describe(name: string, fn: () => void): void
export function it(name: string, fn: () => void | Promise<void>): void
export function test(name: string, fn: () => void | Promise<void>): void

export function startChallengeRuntime(suitePath?: string): void
export function expectAny(): { any: () => { __amxAny: true } }
