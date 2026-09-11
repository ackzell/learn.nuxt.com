import type { ChallengeStrings } from '~/types/challenge'

import { describe, expect, it } from 'vitest'
import {
  generateChallengeSuiteFile,
  normalizeHarnessImport,
  transpileToJs,
} from '../lib/challenge-banking'
import {
  bakeSuite,
  extractSuiteCheckIds,
  validateChallengeStrings,
} from '../lib/challenge-validation'
import { getChallengeSuiteFile } from '../types/guides'

const SUITE = `import { check, checks, expect } from './harness.js'

export default checks([
  check('mounts-app', {
    run({ doc }) {
      const el = [...doc.querySelectorAll('*')].find(node => node.__vue_app__)
      expect(!!el).toBe(true)
    },
  }),
  check('renders-greeting', {
    run({ doc }) {
      const text = doc.body?.querySelector('div')?.textContent
      expect(text).toContain('Hola Vue!')
    },
  }),
  check('shows-version', {
    run({ doc }) {
      const text = doc.body?.textContent ?? ''
      if (!/3\\.\\d+\\.\\d+/.test(text))
        throw new Error('No Vue version was found on the page')
    },
  }),
])
`

const EN: ChallengeStrings = {
  checks: {
    'mounts-app': { name: 'Mounts a Vue app', hint: 'Expected Vue to be mounted with createApp().mount()' },
    'renders-greeting': { name: 'Renders the greeting', hint: 'Expected "Hola Vue!" to be rendered on the page' },
    'shows-version': { name: 'Shows the Vue version', hint: 'Expected a Vue version number (like 3.5.32) to be shown' },
  },
}

describe('challenge baking — extractSuiteCheckIds', () => {
  it('collects every check("<id>", { …}) id', () => {
    expect(extractSuiteCheckIds(SUITE)).toEqual(['mounts-app', 'renders-greeting', 'shows-version'])
  })

  it('is empty for a suite without checks', () => {
    expect(extractSuiteCheckIds('export default []')).toEqual([])
  })
})

describe('challenge baking — bakeSuite', () => {
  it('replaces check ids with localized names and injects hints', () => {
    const baked = bakeSuite(SUITE, EN)
    expect(baked).toContain('check(\'Mounts a Vue app\', {')
    expect(baked).toContain('hint: \'Expected Vue to be mounted with createApp().mount()\',')
    expect(baked).toContain('check(\'Renders the greeting\', {')
    expect(baked).toContain('check(\'Shows the Vue version\', {')
    expect(baked).not.toContain('check(\'mounts-app\', {')
  })

  it('escapes quotes/backslashes in localized strings', () => {
    const strings: ChallengeStrings = {
      checks: { 'mounts-app': { name: `Say "hi" \\ backslash`, hint: 'has "quotes"' } },
    }
    const baked = bakeSuite(SUITE, strings)
    expect(baked).toContain(`check('Say "hi" \\\\ backslash', {`)
    expect(baked).toContain(`hint: 'has "quotes"',`)
  })

  it('leaves checks without a string entry as their raw id (fallback)', () => {
    const strings: ChallengeStrings = { checks: { 'mounts-app': { name: 'Mounts', hint: 'h' } } }
    const baked = bakeSuite(SUITE, strings)
    expect(baked).toContain('check(\'Mounts\', {')
    expect(baked).toContain('\n  hint: \'h\',')
    expect(baked).toContain('check(\'renders-greeting\', {')
    expect(baked).toContain('check(\'shows-version\', {')
  })

  it('returns the source unchanged when no strings are provided', () => {
    expect(bakeSuite(SUITE, undefined)).toBe(SUITE)
  })
})

describe('challenge baking — validateChallengeStrings', () => {
  it('reports no problems for a fully covered suite', () => {
    expect(validateChallengeStrings(SUITE, EN)).toEqual([])
  })

  it('flags missing check strings', () => {
    const problems = validateChallengeStrings(SUITE, { checks: { 'mounts-app': { name: 'Mounts' } } })
    expect(problems.some(p => p.includes('missing strings for check "renders-greeting"'))).toBe(true)
    expect(problems.some(p => p.includes('missing strings for check "shows-version"'))).toBe(true)
  })

  it('flags yaml keys without a matching check', () => {
    const problems = validateChallengeStrings(SUITE, { checks: { nope: { name: 'Nope' }, ...EN.checks } })
    expect(problems).toContain('[challenge] strings define "nope" but the suite has no matching check')
  })

  it('warns about inline authored hints (they must live in yaml)', () => {
    const inline = `check('x', { hint: 'inline', run() {} })`
    expect(validateChallengeStrings(inline, { checks: { x: { name: 'X', hint: 'yaml' } } }))
      .toContain('[challenge] suite defines an inline hint — hints must live in the <locale>.yaml strings')
  })

  it('flags an empty suite', () => {
    expect(validateChallengeStrings('export default []', undefined).some(p => p.includes('no checks'))).toBe(true)
  })
})

describe('challenge banking — generateChallengeSuiteFile (integration)', () => {
  const SRC = `export const meta = {
  template: 'html',
  validation: { challenge: 'basics-challenge' },
}
`
  const vueSrc = `export const meta = {
  template: 'vue',
  validation: { challenge: 'basics-challenge' },
}
`
  const vueSrcId = '/Users/ackzell/projects/amoxtli-vue-2/content/es_mx/02.basics/09.challenge/.template/index.ts'
  const enSrcId = '/Users/ackzell/projects/amoxtli-vue-2/content/en/02.basics/09.challenge/.template/index.ts'

  it('generates en suite with english names/hints', () => {
    const files = generateChallengeSuiteFile({ code: SRC, sourceId: enSrcId, files: { 'index.html': '<h1>Hi</h1>' } })
    expect(files).toBeDefined()
    const suite = files!['__challenge__/suite.js']
    expect(suite).toContain('check(\'Mounts a Vue app\', {')
    expect(suite).toContain('hint: \'Expected Vue to be mounted with createApp().mount()\',')
    expect(suite).toContain('check(\'Renders the greeting\', {')
    expect(suite).toContain('check(\'Shows the Vue version\', {')
  })

  it('generates es_mx suite with spanish names/hints', () => {
    const files = generateChallengeSuiteFile({ code: SRC, sourceId: vueSrcId.replace('.ts', '.ts'), files: {} })
    expect(files).toBeDefined()
    const suite = files!['__challenge__/suite.js']
    expect(suite).toContain('check(\'Monta una app de Vue\', {')
    expect(suite).toContain('check(\'Renderiza el saludo\', {')
  })

  it('normalises harness import for vue ts suites', () => {
    const files = generateChallengeSuiteFile({ code: vueSrc, sourceId: vueSrcId, files: {} })
    expect(files).toBeDefined()
    const suite = files!['__challenge__/suite.ts']
    expect(suite).toContain('from \'./harness\'')
    expect(suite).not.toContain('from \'./harness.js\'')
    expect(suite).toContain('check(\'Muestra la versión de Vue\', {')
  })

  it('throws when the bank has no matching suite file', () => {
    const src = `export const meta = { template: 'html', validation: { challenge: 'nope' } }`
    expect(() => generateChallengeSuiteFile({ code: src, sourceId: enSrcId, files: {} })).toThrow(
      'no suite.ts (or suite.js)',
    )
  })

  it('passes through unchanged when validation.challenge is absent', () => {
    const src = `export const meta = { template: 'html', validation: {} }`
    expect(generateChallengeSuiteFile({ code: src, sourceId: enSrcId, files: { a: '1' } })).toEqual({ a: '1' })
  })

  it('defaults to the html js target when the template is missing', () => {
    const src = `export const meta = { validation: { challenge: 'basics-challenge' } }`
    const files = generateChallengeSuiteFile({ code: src, sourceId: enSrcId, files: {} })
    expect(files).toBeDefined()
    expect(files!).toHaveProperty('__challenge__/suite.js')
  })

  it('transpiles the ts bank to plain js for static html mounts', () => {
    const files = generateChallengeSuiteFile({ code: SRC, sourceId: enSrcId, files: {} })
    const suite = files!['__challenge__/suite.js']
    expect(suite).toContain('from \'./harness.js\'')
    expect(suite).not.toContain('as any')
    expect(suite).not.toContain(/\s:\s[A-Z]/)
    expect(suite).toContain('check(\'Mounts a Vue app\', {')
  })
})

describe('challenge banking — transpileToJs', () => {
  it('strips types but keeps runtime code and imports intact', () => {
    const source = `import { check } from 'harness'
export default check('id', {
  run(ctx) {
    const el: HTMLDivElement = ctx.doc.querySelector('div') as any
    expect(el).toBeTruthy()
  },
})`
    const out = transpileToJs(source, 'fixture')
    expect(out).not.toContain(': HTMLDivElement')
    expect(out).not.toContain('as any')
    expect(out).toContain(`import { check } from 'harness'`)
    expect(out).toContain(`ctx.doc.querySelector('div')`)
    expect(out).toContain('toBeTruthy()')
  })

  it('throws on syntax errors', () => {
    expect(() => transpileToJs('export default check(]', 'fixture')).toThrow('suite.ts failed to transpile')
  })
})

describe('challenge banking — getChallengeSuiteFile', () => {
  it('maps each template to its runtime suite path', () => {
    expect(getChallengeSuiteFile('html')).toBe('/__challenge__/suite.js')
    expect(getChallengeSuiteFile('vue')).toBe('/__challenge__/suite.ts')
    expect(getChallengeSuiteFile('vue-sass')).toBe('/__challenge__/suite.ts')
  })

  it('defaults to the html suite when the template is missing', () => {
    expect(getChallengeSuiteFile()).toBe('/__challenge__/suite.js')
  })
})

describe('challenge banking — normalizeHarnessImport', () => {
  it('rewrites bare harness import for js and ts targets', () => {
    const bare = `import { check } from 'harness'`
    expect(normalizeHarnessImport(bare, 'js')).toBe(`import { check } from './harness.js'`)
    expect(normalizeHarnessImport(bare, 'ts')).toBe(`import { check } from './harness'`)
  })

  it('normalises legacy relative harness imports', () => {
    const relJs = `import { check } from './harness.js'`
    const rel = `import { check } from './harness'`
    expect(normalizeHarnessImport(relJs, 'js')).toBe(`import { check } from './harness.js'`)
    expect(normalizeHarnessImport(relJs, 'ts')).toBe(`import { check } from './harness'`)
    expect(normalizeHarnessImport(rel, 'ts')).toBe(`import { check } from './harness'`)
    expect(normalizeHarnessImport(rel, 'js')).toBe(`import { check } from './harness.js'`)
  })

  it('leaves unrelated imports alone', () => {
    const src = `import { createApp } from 'vue'`
    expect(normalizeHarnessImport(src, 'js')).toBe(src)
  })
})
