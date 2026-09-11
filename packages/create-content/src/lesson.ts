import type { Locale } from './utils'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { autocomplete, confirm, isCancel, select, spinner, text } from '@clack/prompts'
import { red } from 'kolorist'
import {
  copyDir,
  generateChallengeIndexTs,
  generateIndexTs,
  getChallengeIndexMd,
  getChaptersFlat,
  getContentDir,
  getLessonIndexMd,
  getLessons,
  getLocales,
  getNextNumber,
  getStubContent,
  getStubFileName,

  padNumber,
  slugify,
  writeChallengeSuite,
} from './utils'

export const TEMPLATE_OPTIONS = [
  { value: 'vue', label: 'Vue SFC', hint: 'vue' },
  { value: 'html', label: 'HTML (no bundler)', hint: 'html' },
  { value: 'vue-sass', label: 'Vue SFC + SASS', hint: 'vue-sass' },
  { value: 'none', label: 'Docs-only (no playground)', hint: 'none' },
] as const

export interface LessonOptions {
  locale?: Locale
  chapterDir?: string
  title?: string
  template?: string
  isChallenge?: boolean
  bankId?: string
}

export async function createLesson(options?: LessonOptions) {
  const locale = options?.locale
  const chapterDir = options?.chapterDir

  const locales = getLocales()

  let resolvedLocale: Locale
  if (locale) {
    resolvedLocale = locale
  }
  else {
    const chosen = locales.length === 1
      ? locales[0]
      : await select({
          message: 'Locale:',
          options: locales.map(l => ({ value: l, label: l })),
        })
    if (isCancel(chosen))
      return
    resolvedLocale = chosen as Locale
  }

  let chapter: string
  if (chapterDir) {
    chapter = chapterDir
  }
  else {
    const chapters = getChaptersFlat(resolvedLocale)
    if (chapters.length === 0) {
      console.error(red(`No chapters found in ${resolvedLocale}/. Create a chapter first.`))
      return
    }
    const chosen = await autocomplete({
      message: 'Select chapter:',
      options: chapters,
    })
    if (isCancel(chosen))
      return
    chapter = chosen as string
  }

  const lessons = getLessons(resolvedLocale, chapter)
  const nextNum = getNextNumber(join(getContentDir(), resolvedLocale, chapter))

  const title = options?.title ?? await text({
    message: 'Lesson title:',
    validate: (v) => {
      if (!v)
        return 'Required'
      if (slugify(v).length === 0)
        return 'Title must contain at least one letter or number'
    },
  })

  if (isCancel(title))
    return

  const numStr = await text({
    message: 'Lesson number:',
    initialValue: String(nextNum),
    validate: (v) => {
      const n = Number(v)
      if (!Number.isInteger(n) || n < 0)
        return 'Must be a positive integer'
      if (lessons.some(l => l.num === n))
        return `Lesson ${padNumber(n)} already exists`
    },
  })

  if (isCancel(numStr))
    return

  const num = Number(numStr)

  const template = options?.template ?? await select({
    message: 'Template type:',
    options: [...TEMPLATE_OPTIONS],
  })

  if (isCancel(template))
    return

  const isChallenge = options?.isChallenge ?? await confirm({
    message: 'Make this a checkable challenge (with validation)?',
    initialValue: false,
  })
  if (isCancel(isChallenge))
    return

  const slug = slugify(title)
  const dirName = `${padNumber(num)}.${slug}`
  const lessonDir = join(getContentDir(), resolvedLocale, chapter, dirName)
  const sessionName = slug

  const bankId = isChallenge
    ? options?.bankId ?? await text({
      message: 'Challenge bank id (challenges/<id>/ referenced by validation.challenge):',
      initialValue: sessionName,
      validate: (v) => {
        if (!v || !v.trim())
          return 'Bank id cannot be empty'
        if (/[\s/]/.test(v))
          return 'Must be a single path segment (no spaces or slashes)'
      },
    })
    : undefined
  if (isCancel(bankId))
    return

  const s = spinner()
  s.start('Creating lesson...')

  mkdirSync(join(lessonDir), { recursive: true })
  writeFileSync(
    join(lessonDir, 'index.md'),
    isChallenge ? getChallengeIndexMd(title) : getLessonIndexMd(title),
  )

  const templateDir = join(lessonDir, '.template')
  mkdirSync(templateDir, { recursive: true })
  writeFileSync(
    join(templateDir, 'index.ts'),
    isChallenge
      ? generateChallengeIndexTs(template, sessionName, bankId!)
      : generateIndexTs(template, sessionName),
  )

  if (template !== 'none') {
    const stubFile = getStubFileName(template)
    const stubPath = join(templateDir, 'files', stubFile)
    mkdirSync(dirname(stubPath), { recursive: true })
    writeFileSync(stubPath, getStubContent(template))
  }

  if (isChallenge)
    writeChallengeSuite(bankId!)

  s.stop(`Created lesson: ${resolvedLocale}/${chapter}/${dirName}/`)

  const addSolutions = await confirm({ message: 'Create solution files (copy of files/ as base)?' })
  if (isCancel(addSolutions))
    return

  if (addSolutions && template !== 'none') {
    const s2 = spinner()
    s2.start('Copying files/ to solutions/...')
    const filesDir = join(lessonDir, '.template', 'files')
    const solutionsDir = join(lessonDir, '.template', 'solutions')
    if (existsSync(filesDir))
      copyDir(filesDir, solutionsDir)
    s2.stop('Solutions created')
  }
}

export async function createLessonWizard() {
  try {
    await createLesson()
  }
  catch (e) {
    console.error(red(String(e)))
  }
}
