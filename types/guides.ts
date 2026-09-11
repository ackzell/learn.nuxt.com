import type { ChallengeSuite } from '~/types/validation'

export type StringOrRegExp = string | RegExp

export interface GuideIgnoredFiles { overwrite: boolean, patterns: StringOrRegExp[] }

export const TEMPLATE_TYPES = [
  'vue',
  'html',
  'vue-sass',
] as const

export type TemplateType = typeof TEMPLATE_TYPES[number]

/**
 * The challenge suite module path in the container, per template. The lesson's
 * `validation` no longer carries a path — the template decides it, so a suite
 * can never drift from the runtime that serves it (html is static and needs
 * plain JS; vue templates import TypeScript under Vite).
 */
export const CHALLENGE_SUITE_FILE: Record<TemplateType, string> = {
  'html': '/__challenge__/suite.js',
  'vue': '/__challenge__/suite.ts',
  'vue-sass': '/__challenge__/suite.ts',
}

/**
 * Resolves the challenge suite path for a template. When the template is
 * missing it falls back to the html suite, matching the mount default in
 * `stores/guide.ts`.
 */
export function getChallengeSuiteFile(template?: TemplateType): string {
  return template ? CHALLENGE_SUITE_FILE[template] : CHALLENGE_SUITE_FILE.html
}

export interface GuideMeta {
  features?: PlaygroundFeatures
  startingFile?: string
  startingUrl?: string
  /**
   * Template to use for this guide ('vue', 'html', or 'vue-sass')
   * @default 'vue'
   */
  template?: TemplateType
  // TODO:
  packageJsonOverrides?: any
  /**
   * When not provided, this will be loaded from './files' directory
   */
  files?: Record<string, string>
  // TODO:
  solutions?: Record<string, string>

  /**
   * Ignored file patterns.
   * Can be a list of strings or regex.
   *
   * @example
   * // add to default patterns
   * ignoredFiles: ['pnpm-lock.yaml']
   *
   * @example
   * // overwrite default patterns
   * ignoredFiles: { overwrite: true, patterns: ['pnpm-lock.yaml'] }
   */
  ignoredFiles?: StringOrRegExp[] | GuideIgnoredFiles

  /**
   * Stable identifier for snapshot sessions
   */
  sessionName?: string

  buttonSolutionMessage?: string
  buttonResetMessage?: string

  /**
   * Optional validation suite that turns this lesson into a checkable
   * challenge. When present, a "Check my work" widget (`::challenge-check` /
   * the `ChallengeCheck` component) is auto-injected at the end of the lesson
   * at build time. Authors can also place it manually anywhere in the markdown.
   */
  validation?: ChallengeSuite

}

export interface PlaygroundFeatures {
  terminal?: boolean
  fileTree?: boolean
  download?: boolean
  console?: boolean
  /**
   * Forces the main layout view mode when this guide is loaded.
   * - 'docs': shows only the docs panel
   * - 'code': shows only the code panel
   * - 'split': shows both docs and code panels side by side
   */
  defaultLayout?: 'split' | 'code' | 'docs'
}
