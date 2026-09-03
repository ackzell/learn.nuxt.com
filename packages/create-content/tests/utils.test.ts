import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'

import {
  slugify,
  padNumber,
  parseDirNumber,
  generateIndexTs,
  generateChallengeIndexTs,
  getStubFileName,
  getStubContent,
  getChapterIndexMd,
  getLessonIndexMd,
  getNextNumber,
  getLocales,
  getChapters,
  getChaptersFlat,
  getLessons,
  getAllLessonsFlat,
  hasTemplateDir,
  hasFilesDir,
  copyDir,
  countFiles,
  writeChallengeSuite,
} from '../src/utils.ts'

describe('slugify', () => {
  it('converts title to kebab-case', () => {
    expect(slugify('Understanding ref()')).toBe('understanding-ref')
  })

  it('handles special characters', () => {
    expect(slugify('Hello World! This Is A Test')).toBe('hello-world-this-is-a-test')
  })

  it('handles multiple spaces and hyphens', () => {
    expect(slugify('foo   bar--baz')).toBe('foo-bar-baz')
  })

  it('strips leading/trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('handles empty-ish input', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('padNumber', () => {
  it('pads single digit', () => {
    expect(padNumber(1)).toBe('01')
  })

  it('does not pad double digit', () => {
    expect(padNumber(12)).toBe('12')
  })

  it('pads zero', () => {
    expect(padNumber(0)).toBe('00')
  })
})

describe('parseDirNumber', () => {
  it('parses numbered directory', () => {
    expect(parseDirNumber('01.intro')).toEqual({ num: 1, rest: 'intro' })
  })

  it('returns null for unnumbered directory', () => {
    expect(parseDirNumber('intro')).toBeNull()
  })

  it('returns null for invalid format', () => {
    expect(parseDirNumber('01')).toBeNull()
  })
})

describe('generateIndexTs', () => {
  it('generates docs-only config', () => {
    const result = generateIndexTs('none', 'test')
    expect(result).toContain("defaultLayout: 'docs'")
    expect(result).not.toContain('template:')
  })

  it('generates html config', () => {
    const result = generateIndexTs('html', 'test-lesson')
    expect(result).toContain("template: 'html'")
    expect(result).toContain("startingFile: 'index.html'")
    expect(result).toContain("sessionName: 'test-lesson'")
  })

  it('generates vue config', () => {
    const result = generateIndexTs('vue', 'test-lesson')
    expect(result).toContain("template: 'vue'")
    expect(result).toContain("startingFile: 'src/App.vue'")
    expect(result).toContain("sessionName: 'test-lesson'")
  })

  it('generates vue-sass config', () => {
    const result = generateIndexTs('vue-sass', 'sass-lesson')
    expect(result).toContain("template: 'vue-sass'")
    expect(result).toContain("sessionName: 'sass-lesson'")
  })
})

describe('generateChallengeIndexTs', () => {
  it('references a .js suite for static html', () => {
    const result = generateChallengeIndexTs('html', 'my-challenge')
    expect(result).toContain("template: 'html'")
    expect(result).toContain("startingFile: 'index.html'")
    expect(result).toContain("file: '/__challenge__/suite.js'")
  })

  it('references a .ts suite for vue templates', () => {
    const result = generateChallengeIndexTs('vue', 'my-challenge')
    expect(result).toContain("template: 'vue'")
    expect(result).toContain("startingFile: 'src/App.vue'")
    expect(result).toContain("file: '/__challenge__/suite.ts'")
  })
})

describe('getStubFileName', () => {
  it('returns src/App.vue for vue', () => {
    expect(getStubFileName('vue')).toBe('src/App.vue')
  })

  it('returns src/App.vue for vue-sass', () => {
    expect(getStubFileName('vue-sass')).toBe('src/App.vue')
  })

  it('returns index.html for html', () => {
    expect(getStubFileName('html')).toBe('index.html')
  })
})

describe('getStubContent', () => {
  it('generates vue stub', () => {
    const result = getStubContent('vue')
    expect(result).toContain('<script setup lang="ts">')
    expect(result).toContain('</template>')
    expect(result).toContain('<style>')
  })

  it('generates html stub', () => {
    const result = getStubContent('html')
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<script type="module">')
  })

  it('generates vue-sass stub with lang="scss"', () => {
    const result = getStubContent('vue-sass')
    expect(result).toContain('lang="scss"')
  })
})

describe('getChapterIndexMd / getLessonIndexMd', () => {
  it('generates chapter frontmatter', () => {
    expect(getChapterIndexMd('Test Chapter')).toBe('---\ntitle: "Test Chapter"\nogImage: true\n---\n')
  })

  it('generates lesson frontmatter', () => {
    expect(getLessonIndexMd('Test Lesson')).toBe('---\ntitle: "Test Lesson"\nogImage: true\n---\n')
  })
})

describe('filesystem operations', () => {
  let tmpDir: string
  let cwd: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'create-content-test-'))
    cwd = process.cwd()
    process.chdir(tmpDir)
  })

  afterAll(() => {
    process.chdir(cwd)
    rmSync(tmpDir, { recursive: true, force: true })
  })

  afterEach(() => {
    process.chdir(tmpDir)
  })

  describe('getNextNumber', () => {
    const ns = () => mkdtempSync(join(tmpDir, 'nextnum-'))

    it('returns 1 for empty directory', () => {
      const dir = ns()
      expect(getNextNumber(dir)).toBe(1)
    })

    it('finds next number after existing dirs', () => {
      const dir = ns()
      mkdirSync(join(dir, '01.first'))
      mkdirSync(join(dir, '03.third'))
      expect(getNextNumber(dir)).toBe(4)
    })

    it('ignores non-numbered directories', () => {
      const dir = ns()
      mkdirSync(join(dir, '01.first'))
      mkdirSync(join(dir, 'readme'))
      mkdirSync(join(dir, '05.fifth'))
      expect(getNextNumber(dir)).toBe(6)
    })
  })

  describe('getLocales', () => {
    it('detects locale directories', () => {
      const dir = mkdtempSync(join(tmpDir, 'locales-'))
      process.chdir(dir)
      mkdirSync(join(dir, 'content', 'en'), { recursive: true })
      mkdirSync(join(dir, 'content', 'es_mx'), { recursive: true })
      mkdirSync(join(dir, 'content', 'other'), { recursive: true })
      const locales = getLocales()
      expect(locales).toContain('en')
      expect(locales).toContain('es_mx')
      expect(locales).not.toContain('other')
    })
  })

  describe('getChapters', () => {
    it('lists chapters in order', () => {
      const dir = mkdtempSync(join(tmpDir, 'chapters-'))
      process.chdir(dir)
      mkdirSync(join(dir, 'content', 'en', '01.first'), { recursive: true })
      mkdirSync(join(dir, 'content', 'en', '03.third'), { recursive: true })
      mkdirSync(join(dir, 'content', 'en', '02.second'), { recursive: true })
      const chapters = getChapters('en')
      expect(chapters).toHaveLength(3)
      expect(chapters[0].dir).toBe('01.first')
      expect(chapters[1].dir).toBe('02.second')
      expect(chapters[2].dir).toBe('03.third')
    })

    it('returns empty array for missing locale', () => {
      expect(getChapters('nonexistent')).toEqual([])
    })
  })

  describe('getChaptersFlat', () => {
    it('returns options format', () => {
      const dir = mkdtempSync(join(tmpDir, 'chaptersflat-'))
      process.chdir(dir)
      mkdirSync(join(dir, 'content', 'en', '01.testing'), { recursive: true })
      const result = getChaptersFlat('en')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ label: '01. testing', value: '01.testing' })
    })
  })

  describe('getLessons', () => {
    it('lists lessons in order', () => {
      const dir = mkdtempSync(join(tmpDir, 'lessons-'))
      process.chdir(dir)
      mkdirSync(join(dir, 'content', 'en', '01.chapter', '02.lesson-b'), { recursive: true })
      mkdirSync(join(dir, 'content', 'en', '01.chapter', '01.lesson-a'), { recursive: true })
      const lessons = getLessons('en', '01.chapter')
      expect(lessons).toHaveLength(2)
      expect(lessons[0].dir).toBe('01.lesson-a')
      expect(lessons[1].dir).toBe('02.lesson-b')
    })
  })

  describe('getAllLessonsFlat', () => {
    it('returns all lessons across chapters', () => {
      const dir = mkdtempSync(join(tmpDir, 'alllessons-'))
      process.chdir(dir)
      mkdirSync(join(dir, 'content', 'en', '01.a', '01.l1'), { recursive: true })
      mkdirSync(join(dir, 'content', 'en', '02.b', '01.l2'), { recursive: true })
      const result = getAllLessonsFlat('en')
      expect(result).toHaveLength(2)
      expect(result[0].value).toBe('01.a/01.l1')
      expect(result[1].value).toBe('02.b/01.l2')
    })

    it('filters by chapter when specified', () => {
      const dir = mkdtempSync(join(tmpDir, 'alllessonsfilter-'))
      process.chdir(dir)
      mkdirSync(join(dir, 'content', 'en', '01.a', '01.l1'), { recursive: true })
      mkdirSync(join(dir, 'content', 'en', '02.b', '01.l2'), { recursive: true })
      const result = getAllLessonsFlat('en', '01.a')
      expect(result).toHaveLength(1)
      expect(result[0].value).toBe('01.a/01.l1')
    })
  })

  describe('hasTemplateDir / hasFilesDir', () => {
    it('detects .template directory', () => {
      const dir = mkdtempSync(join(tmpDir, 'hastmpl-'))
      mkdirSync(join(dir, 'lesson', '.template'), { recursive: true })
      expect(hasTemplateDir(join(dir, 'lesson'))).toBe(true)
      expect(hasTemplateDir(join(dir, 'nonexistent'))).toBe(false)
    })

    it('detects .template/files directory', () => {
      const dir = mkdtempSync(join(tmpDir, 'hasfiles-'))
      mkdirSync(join(dir, 'lesson2', '.template', 'files'), { recursive: true })
      expect(hasFilesDir(join(dir, 'lesson2'))).toBe(true)
      expect(hasFilesDir(join(dir, 'lesson2'))).toBe(true)
    })
  })

  describe('copyDir', () => {
    it('copies directory structure recursively', () => {
      const dir = mkdtempSync(join(tmpDir, 'copydir-'))
      const src = join(dir, 'src-dir')
      const dest = join(dir, 'dest-dir')
      mkdirSync(join(src, 'sub'), { recursive: true })
      writeFileSync(join(src, 'a.txt'), 'a')
      writeFileSync(join(src, 'sub', 'b.txt'), 'b')

      copyDir(src, dest)

      expect(existsSync(join(dest, 'a.txt'))).toBe(true)
      expect(existsSync(join(dest, 'sub', 'b.txt'))).toBe(true)
    })
  })

  describe('countFiles', () => {
    it('counts files recursively', () => {
      const dir = mkdtempSync(join(tmpDir, 'count-'))
      mkdirSync(join(dir, 'sub'), { recursive: true })
      writeFileSync(join(dir, 'f1.txt'), '')
      writeFileSync(join(dir, 'f2.txt'), '')
      writeFileSync(join(dir, 'sub', 'f3.txt'), '')
      expect(countFiles(dir)).toBe(3)
    })

    it('returns 0 for empty directory', () => {
      const dir = mkdtempSync(join(tmpDir, 'empty-'))
      expect(countFiles(dir)).toBe(0)
    })

    it('returns 0 for nonexistent directory', () => {
      expect(countFiles(join(tmpDir, 'no-exist'))).toBe(0)
    })
  })

  describe('writeChallengeSuite', () => {
    it('writes a .js suite with an explicit failing TODO for static html', () => {
      const dir = join(tmpDir, 'challenge-html')
      mkdirSync(dir, { recursive: true })
      writeChallengeSuite(dir, 'html')
      const file = join(dir, '.template', 'files', '__challenge__', 'suite.js')
      const content = readFileSync(file, 'utf-8')
      expect(content).toContain("from './harness.js'")
      expect(content).toContain('TODO: write a real check')
      expect(content).toContain('expect(doc.querySelector')
    })

    it('writes a .ts suite with ctx.mount for vue templates', () => {
      const dir = join(tmpDir, 'challenge-vue')
      mkdirSync(dir, { recursive: true })
      writeChallengeSuite(dir, 'vue')
      const file = join(dir, '.template', 'files', '__challenge__', 'suite.ts')
      const content = readFileSync(file, 'utf-8')
      expect(content).toContain("from './harness'")
      expect(content).toContain('TODO: write a real check')
    })
  })
})
