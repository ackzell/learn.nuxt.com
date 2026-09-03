export type ChallengeCategory = 'content' | 'behavior' | 'binding' | 'data' | (string & {})

/**
 * Result of a single challenge check, produced by the in-container harness
 * (or host-side runner) and rendered by `ChallengeCheck.vue`.
 */
export interface ChallengeCheckResult {
  /** The check's display name (e.g. "Renders greeting"). */
  name: string
  passed: boolean
  /** Optional friendly hint shown on failure. */
  hint?: string
  /** Optional category used for grouping/coloring in the UI. */
  category?: ChallengeCategory
  /** Failing assertion message, or '' on pass. */
  message: string
}

/**
 * A checkable challenge's suite. The suite lives as a module (authored with
 * the `check()`/`checks()`/`expect()` harness helpers) inside the challenge's
 * `.template/files/__challenge__/suite.*`.
 *
 * Suites run inside the WebContainer on the same origin as the preview iframe
 * so they can assert against the live DOM:
 *   - `vue` / `vue-sass` templates run under Vite and can also mount components
 *     with Vue Test Utils (`ctx.mount`).
 *   - `html` (static) templates run a dependency-free static server
 *     (`server.js`, no Vite) against the live document (`ctx.doc` only).
 */
export interface ChallengeSuite {
  /** Path of the suite module in the container, e.g. '/__challenge__/suite.ts'. */
  file: string
}

/**
 * Identifies a single `run-suite` request/response exchange between the host
 * and the in-iframe harness. The harness echoes the id back on its
 * `suite-result` reply so the host can resolve the correct pending promise
 * even when suites run concurrently or a stale response arrives late.
 */
export interface ChallengeRequest {
  /** Opaque id echoed back by the harness in its `suite-result` reply. */
  id: string
  /** The suite module path to import in the container, e.g. '/__challenge__/suite.ts'. */
  file: string
}

/**
 * The message payload the harness posts back to the host in a
 * `nuxt-playground-challenge` → `suite-result` message.
 */
export interface SuiteResultPayload {
  /** Mirrors the request id so the host can resolve the right pending call. */
  id: string
  /** True when the suite was loaded and executed; false on load/exec errors. */
  success: boolean
  /** True only when the suite is non-empty and every check passed. */
  passed: boolean
  /** One entry per authored check (never the empty-every-trick). */
  tests: ChallengeCheckResult[]
  /**
   * True when the message is a synthesized outcome (e.g. empty suite) rather
   * than the direct result of executing authored checks. Used by the host to
   * surface actionable feedback.
   */
  empty?: boolean
  /** True when the host cancelled the run because the preview was refreshed. */
  cancelled?: boolean
}

export type ValidationStatus = 'idle' | 'pass' | 'fail'

export interface ValidationOutcome {
  /** True only when the suite is non-empty and every check passed. */
  passed: boolean
  results: ChallengeCheckResult[]
  /** True for an explicit empty-suite failure (no authored checks). */
  empty?: boolean
}
