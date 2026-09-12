import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { extractSuiteCheckIds } from '../../../lib/challenge-validation'

import { buildChallengeSuiteSource, writeChallengeBank } from '../src/utils.ts'

const CHECKS = [
  { id: 'shows-greeting', name: 'Shows the greeting', hint: 'Expected the greeting to be rendered' },
  { id: 'uses-v-bind', name: 'Binds the title', hint: 'Expected v-bind to be used' },
  { id: 'no-hint-check', name: 'Has no hint' },
]

describe('buildChallengeSuiteSource', () => {
  it('scaffolds a vue suite with the App import and mount-based stubs', () => {
    const source = buildChallengeSuiteSource('vue', CHECKS)
    expect(source).toContain('from \'harness\'')
    expect(source).toContain('import App from \'../src/App.vue\'')
    expect(source).toContain('run({ mount })')
    expect(source).toContain('expect(true).toBe(false)')
    expect(source).not.toContain('hint:')
  })

  it('scaffolds an html suite doc-based and bundler-free', () => {
    const source = buildChallengeSuiteSource('html', CHECKS)
    expect(source).toContain('from \'harness\'')
    expect(source).not.toContain('import App')
    expect(source).toContain('run({ doc })')
    expect(source).toContain('expect(true).toBe(false)')
  })

  it('uses the same check ids the strings are keyed by', () => {
    const source = buildChallengeSuiteSource('vue-sass', CHECKS)
    expect(extractSuiteCheckIds(source)).toEqual(CHECKS.map(c => c.id))
  })
})

describe('writeChallengeBank', () => {
  let tmpDir: string
  let cwd: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'create-content-challenge-test-'))
    cwd = process.cwd()
    process.chdir(tmpDir)
  })

  afterAll(() => {
    process.chdir(cwd)
    rmSync(tmpDir, { recursive: true, force: true })
  })

  const bankDir = (id: string) => join(tmpDir, 'challenges', id)

  it('writes suite.ts + en.yaml with synced check ids', () => {
    writeChallengeBank('sync-bank', 'vue', CHECKS)
    const dir = bankDir('sync-bank')
    const suite = readFileSync(join(dir, 'suite.ts'), 'utf-8')
    expect(extractSuiteCheckIds(suite)).toEqual(CHECKS.map(c => c.id))

    const parsed = yaml.load(readFileSync(join(dir, 'en.yaml'), 'utf-8')) as Record<string, { checks: Record<string, { name: string, hint?: string }> }>
    const checks = parsed['sync-bank']!.checks
    expect(Object.keys(checks)).toEqual(CHECKS.map(c => c.id))
    expect(checks['shows-greeting']!.name).toBe('Shows the greeting')
    expect(checks['shows-greeting']!.hint).toBe('Expected the greeting to be rendered')
    expect(checks['no-hint-check']!.hint).toBeUndefined()
  })

  it('transpiles to plain js for html mounts at build time', () => {
    writeChallengeBank('html-bank', 'html', CHECKS)
    const dir = bankDir('html-bank')
    expect(readFileSync(join(dir, 'suite.ts'), 'utf-8')).toContain('run({ doc })')
    expect(existsSync(join(dir, 'en.yaml'))).toBe(true)
  })

  it('is idempotent — does not overwrite an existing bank', () => {
    writeChallengeBank('keep-bank', 'vue', CHECKS)
    const dir = bankDir('keep-bank')
    const original = readFileSync(join(dir, 'suite.ts'), 'utf-8')
    writeFileSync(join(dir, 'extra.txt'), 'custom')
    writeChallengeBank('keep-bank', 'html', [{ id: 'other', name: 'Other' }])
    expect(readFileSync(join(dir, 'suite.ts'), 'utf-8')).toBe(original)
    expect(existsSync(join(dir, 'extra.txt'))).toBe(true)
  })
})
