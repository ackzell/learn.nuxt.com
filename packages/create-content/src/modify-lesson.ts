import type { Locale } from './utils'
import { TEMPLATE_OPTIONS } from './lesson'
import {
  detectTemplateFromIndex,
  generateIndexTs,
  getAllLessonsFlat,
  getContentDir,
  getLocales,
  getStubContent,
  getStubFileName,
  hasTemplateDir,
  listFilesDir,

} from './utils'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { autocomplete, confirm, isCancel, note, select, spinner, text } from '@clack/prompts'
import { cyan, green, red } from 'kolorist'

async function pickLesson(): Promise<{ locale: Locale, lessonPath: string, lessonLabel: string } | null> {
  const locales = getLocales()
  const locale = locales.length === 1
    ? locales[0]
    : await select({
        message: 'Locale:',
        options: locales.map(l => ({ value: l, label: l })),
      })
  if (isCancel(locale))
    return null

  const lessons = getAllLessonsFlat(locale)
  if (lessons.length === 0) {
    console.error(red('No lessons found'))
    return null
  }

  const selected = await autocomplete({
    message: 'Select a lesson:',
    options: lessons,
  })
  if (isCancel(selected))
    return null

  return {
    locale: locale as Locale,
    lessonPath: join(getContentDir(), locale, selected as string),
    lessonLabel: selected as string,
  }
}

function showLessonStatus(lessonPath: string) {
  const files = listFilesDir(join(lessonPath, '.template', 'files'))
  const solutions = listFilesDir(join(lessonPath, '.template', 'solutions'))

  const filesList = files.length > 0
    ? files.map(f => `  ${cyan(f)}`).join('\n')
    : `  ${red('(none)')}`
  const solutionsList = solutions.length > 0
    ? solutions.map(f => `  ${cyan(f)}`).join('\n')
    : `  ${red('(none)')}`

  note(
    `files/:\n${filesList}\n\nsolutions/:\n${solutionsList}`,
    'Current files',
  )
}

async function initializeFiles(lessonPath: string) {
  const template = await select({
    message: 'Template type:',
    options: [...TEMPLATE_OPTIONS],
  })
  if (isCancel(template))
    return

  const s = spinner()
  s.start('Initializing .template/...')

  const templateDir = join(lessonPath, '.template')
  mkdirSync(templateDir, { recursive: true })

  const slug = lessonPath.split('/').pop()?.replace(/^\d{2}[a-z]?\./, '') ?? 'lesson'
  writeFileSync(join(templateDir, 'index.ts'), generateIndexTs(template, slug))

  if (template !== 'none') {
    const stubFile = getStubFileName(template)
    const stubPath = join(templateDir, 'files', stubFile)
    mkdirSync(dirname(stubPath), { recursive: true })
    writeFileSync(stubPath, getStubContent(template))
  }

  s.stop(green(`Created .template/ (${template})`))
}

async function addFile(lessonPath: string, target: 'files' | 'solutions') {
  const relPath = await text({
    message: `File path (relative to .template/${target}/) or Enter for default:`,
    placeholder: 'src/App.vue',
    validate: (v) => {
      if (v && v.startsWith('/'))
        return 'Path must be relative, not absolute'
    },
  })
  if (isCancel(relPath))
    return

  const resolvedPath = (relPath || 'src/App.vue').trim()
  const template = detectTemplateFromIndex(lessonPath)
  const content = resolvedPath === 'src/App.vue' || resolvedPath === 'index.html'
    ? getStubContent(template)
    : ''

  const destPath = join(lessonPath, '.template', target, resolvedPath)
  const s = spinner()
  s.start(`Writing ${resolvedPath}...`)
  mkdirSync(dirname(destPath), { recursive: true })
  writeFileSync(destPath, content)
  s.stop(green(`Written ${resolvedPath} to ${target}/`))
}

export async function modifyLesson() {
  const lesson = await pickLesson()
  if (!lesson)
    return

  const { lessonPath } = lesson

  if (!hasTemplateDir(lessonPath)) {
    const init = await confirm({
      message: 'No .template/ directory found. Initialize it?',
    })
    if (isCancel(init) || !init)
      return
    await initializeFiles(lessonPath)
  }

  while (true) {
    showLessonStatus(lessonPath)

    const options: { value: string, label: string }[] = []

    const existingFiles = listFilesDir(join(lessonPath, '.template', 'files'))
    if (existingFiles.length === 0) {
      options.push({ value: 'init', label: 'Initialize files/ with a stub file' })
    }

    options.push(
      { value: 'add-files', label: 'Add/replace a file in files/' },
      { value: 'add-solutions', label: 'Add/replace a file in solutions/' },
      { value: 'done', label: 'Done' },
    )

    const action = await select({
      message: 'What would you like to do?',
      options,
    })
    if (isCancel(action))
      return

    switch (action) {
      case 'init':
        await initializeFiles(lessonPath)
        break
      case 'add-files':
        await addFile(lessonPath, 'files')
        break
      case 'add-solutions':
        await addFile(lessonPath, 'solutions')
        break
      case 'done':
        return
    }
  }
}

export async function modifyLessonWizard() {
  try {
    await modifyLesson()
  }
  catch (e) {
    console.error(red(String(e)))
  }
}
