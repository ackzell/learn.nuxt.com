import type { ChallengeStrings } from '../types/challenge'
import type { TemplateType } from '../types/guides'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import yaml from 'js-yaml'
import { join } from 'pathe'
import ts from 'typescript'
import { getChallengeSuiteFile } from '../types/guides'
import { bakeSuite, validateChallengeStrings } from './challenge-validation'

/**
 * Reads the localized strings for a challenge bank entry, falling back to
 * `en.yaml` when the target locale has no yaml (or no block yet).
 */
export function loadChallengeStrings(
  bankDir: string,
  challengeId: string,
  locale: string,
  addWatchFile: (file: string) => void = () => {},
): ChallengeStrings | undefined {
  function readLocale(loc: string): ChallengeStrings | undefined {
    const file = join(bankDir, `${loc}.yaml`)
    if (!existsSync(file))
      return undefined
    addWatchFile(file)
    try {
      const parsed = yaml.load(readFileSync(file, 'utf-8')) as Record<string, ChallengeStrings> | undefined
      return parsed?.[challengeId]
    }
    catch (e) {
      console.warn(`[challenge] "${challengeId}" (${loc}.yaml) failed to parse:`, (e as Error).message)
      return undefined
    }
  }
  return readLocale(locale) ?? readLocale('en')
}

/**
 * Strips types from a `.ts` suite so static `html` templates (which serve the
 * browser directly with no build step) get a plain `.js` module. Keeps modern
 * ESM/ES2022 syntax — it already targets current browsers. Throws on syntax
 * errors so authoring mistakes surface the moment the lesson is built.
 */
export function transpileToJs(source: string, challengeId: string): string {
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    reportDiagnostics: true,
  })
  const errors = (diagnostics ?? [])
    .filter(d => d.category === ts.DiagnosticCategory.Error)
    .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
  if (errors.length > 0) {
    throw new Error(`[challenge] "${challengeId}" suite.ts failed to transpile: ${errors.join('; ')}`)
  }
  return outputText
}

/**
 * The bank suite is authored with a bare `harness` import (resolved to the
 * shared authoring types via `challenges/tsconfig.json` paths). This rewrites
 * it to the relative runtime import the mounted suite needs: `./harness.js`
 * for static html, `./harness` for the Vue templates. Legacy `./harness` /
 * `./harness.js` imports are normalized too.
 */
export function normalizeHarnessImport(source: string, ext: string): string {
  const target = ext === 'ts' ? './harness' : './harness.js'
  return source
    .replace(/from ['"]harness['"]/g, `from '${target}'`)
    .replace(/from ['"]\.\/harness(?:\.js)?['"]/g, `from '${target}'`)
}

/**
 * When a lesson's `.template/index.ts` sets `validation.challenge`, generate
 * its mounted `__challenge__/suite.<ext>` from the shared `challenges/<id>/`
 * bank instead of a per-locale authored file — mirroring the quizzes bank.
 * The check names/hints are baked in from the lesson's locale strings (with
 * `en` fallback, then the raw check ids), and the bank inputs are registered
 * as transform watch files so edits re-trigger the transform.
 *
 * The bank is authored as TypeScript (`suite.ts`, full intellisense); for
 * static html mounts the suite is transpiled to plain `.js` and served by the
 * template's dependency-free harness. Legacy `.js` bank suites still work.
 *
 * Returns the lesson's files map with the generated suite, or the input map
 * unchanged when the lesson is not a challenge-bank lesson.
 */
export function generateChallengeSuiteFile(options: {
  code: string
  sourceId: string
  files: Record<string, string> | undefined
  addWatchFile?: (file: string) => void
}): Record<string, string> | undefined {
  const { code, sourceId, files, addWatchFile = () => {} } = options

  const challengeId = code.match(/challenge\s*:\s*['"]([^'"]+)['"]/)?.[1]
  if (!challengeId)
    return files

  // The suite module path is decided by the lesson's template (html = plain
  // `.js` for the static server, vue = `.ts` under Vite), never authored.
  const filePath = getChallengeSuiteFile(code.match(/template\s*:\s*['"]([^'"]+)['"]/)?.[1] as TemplateType | undefined)
  const ext = filePath.endsWith('.ts') ? 'ts' : 'js'
  const target = filePath.replace(/^\/+/, '')

  const locale = sourceId.split('/content/')[1]?.split('/')[0] || 'en'
  const bankDir = join(process.cwd(), 'challenges', challengeId)

  // Canonical bank file is suite.ts; legacy suite.js still supported.
  const suiteFileName = Array.from(new Set(['suite.ts', `suite.${ext}`, 'suite.js']))
    .find(name => existsSync(join(bankDir, name)))

  if (!suiteFileName) {
    throw new Error(
      `[challenge] "${challengeId}" has no suite.ts (or suite.${ext}) in challenges/${challengeId}/ (referenced by ${sourceId})`,
    )
  }

  const suitePath = join(bankDir, suiteFileName)
  const suiteSource = readFileSync(suitePath, 'utf-8')
  addWatchFile(suitePath)

  // Static html templates can't import TypeScript natively — strip the types.
  const source = suiteFileName.endsWith('.ts') && ext === 'js'
    ? transpileToJs(suiteSource, challengeId)
    : suiteSource

  const strings = loadChallengeStrings(bankDir, challengeId, locale, addWatchFile)

  const problems = validateChallengeStrings(source, strings)
  for (const p of problems)
    console.warn(`[challenge] "${challengeId}" (${locale}): ${p}`)

  const baked = normalizeHarnessImport(bakeSuite(source, strings), ext)

  return { ...(files ?? {}), [target]: baked }
}
