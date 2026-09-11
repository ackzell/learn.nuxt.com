import type { ChallengeStrings } from '../types/challenge'

const CHECK_RE = /check\(\s*['"]([^'"]+)['"]\s*,\s*\{/g

/**
 * Extracts the check ids the bank suite passes to `check(<id>, ...)`. These
 * ids key the per-locale yaml strings and are resolved to localized names at
 * build time.
 */
export function extractSuiteCheckIds(suiteSource: string): string[] {
  const ids: string[] = []
  for (const m of suiteSource.matchAll(CHECK_RE)) {
    ids.push(m[1]!)
  }
  return ids
}

function toJsString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n')}'`
}

/**
 * Bakes per-locale display strings into a bank suite: each `check('<id>', {`
 * call becomes `check('<localized name>', { hint: '<localized hint>', ...`.
 * Checks whose id has no string entry are left untouched so an untranslated
 * check falls back to its raw id (mirroring the quiz fallback to raw ids).
 */
export function bakeSuite(suiteSource: string, strings: ChallengeStrings | undefined): string {
  if (!strings?.checks)
    return suiteSource

  return suiteSource.replace(CHECK_RE, (full, id: string) => {
    const entry = strings.checks[id]
    if (!entry)
      return full
    const out = [`check(${toJsString(entry.name)}, {`]
    if (entry.hint)
      out.push(`\n  hint: ${toJsString(entry.hint)},`)
    return out.join('')
  })
}

/**
 * Validates that per-locale strings fully cover a bank suite. Returns a list
 * of problems (not throwing) so a partially translated challenge warns instead
 * of breaking the build — missing strings fall back to the raw check ids.
 * Also warns about authored `hint:` literals, since hints now come from yaml.
 */
export function validateChallengeStrings(suiteSource: string, strings: ChallengeStrings | undefined): string[] {
  const problems: string[] = []
  const ids = extractSuiteCheckIds(suiteSource)
  const checks = strings?.checks ?? {}

  if (ids.length === 0) {
    problems.push('[challenge] suite has no checks — add at least one check("<id>", { run })')
  }

  if (suiteSource.includes('hint:')) {
    problems.push('[challenge] suite defines an inline hint — hints must live in the <locale>.yaml strings')
  }

  for (const id of ids) {
    const entry = checks[id]
    if (!entry) {
      problems.push(`[challenge] missing strings for check "${id}"`)
      continue
    }
    if (typeof entry.name !== 'string' || entry.name.length === 0) {
      problems.push(`[challenge] missing name for check "${id}"`)
    }
  }

  for (const key of Object.keys(checks)) {
    if (!ids.includes(key)) {
      problems.push(`[challenge] strings define "${key}" but the suite has no matching check`)
    }
  }

  return problems
}
