import type { DraftCheck } from './utils'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { confirm, group, isCancel, log, select, spinner, text } from '@clack/prompts'
import { red } from 'kolorist'
import { createLesson } from './lesson'
import { getRoot, slugify, writeChallengeBank } from './utils'

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const CHALLENGE_TEMPLATES = [
  { value: 'vue', label: 'Vue SFC', hint: 'vue' },
  { value: 'html', label: 'HTML (no bundler)', hint: 'html' },
  { value: 'vue-sass', label: 'Vue SFC + SASS', hint: 'vue-sass' },
] as const

interface CheckForm {
  name: string
  hint: string
}

export async function createChallenge() {
  const challengesDir = join(getRoot(), 'challenges')

  const challengeId = await text({
    message: 'Challenge id (directory under challenges/):',
    initialValue: 'my-challenge',
    validate: (value) => {
      const v = value?.trim() ?? ''
      if (!v)
        return 'Required'
      if (!KEBAB_RE.test(v))
        return 'Lowercase kebab-case only (e.g. conditional-challenge)'
      if (existsSync(join(challengesDir, v)))
        return `Challenge "${v}" already exists under challenges/`
    },
  })
  if (isCancel(challengeId))
    return
  const id = challengeId.trim()

  const template = await select({
    message: 'Template type (drives the stub checks and the lesson starters):',
    options: [...CHALLENGE_TEMPLATES],
  })
  if (isCancel(template))
    return

  const checks: DraftCheck[] = []
  const usedCheckIds = new Set<string>()

  while (true) {
    const form = await group<CheckForm>({
      name: () => text({
        message: `Check ${checks.length + 1} — name (shown to the learner; the id auto-slugs from it):`,
        validate: (value) => {
          if (!value?.trim())
            return 'Required'
        },
      }) as Promise<string | undefined>,
      hint: () => text({
        message: 'Failure hint (optional, shown when the check fails):',
        placeholder: 'Empty to skip',
      }) as Promise<string | undefined>,
    })

    if (Object.values(form).some(isCancel))
      return

    const name = form.name.trim()
    let checkId = slugify(name)
    if (!checkId || usedCheckIds.has(checkId)) {
      const explicitId = await text({
        message: !checkId
          ? `Check ${checks.length + 1} id:`
          : `Check id "${checkId}" is already used — enter another:`,
        validate: (value) => {
          const v = value?.trim() ?? ''
          if (!v)
            return 'Required'
          if (!KEBAB_RE.test(v))
            return 'Lowercase kebab-case only'
          if (usedCheckIds.has(v))
            return `Check id "${v}" already used`
        },
      })
      if (isCancel(explicitId))
        return
      checkId = explicitId.trim()
    }
    usedCheckIds.add(checkId)

    const hint = form.hint.trim() || undefined
    checks.push({ id: checkId, name, hint })

    const addAnother = await confirm({ message: 'Add another check?', initialValue: true })
    if (isCancel(addAnother))
      return
    if (!addAnother)
      break
  }

  const summary = [
    `id: ${id}`,
    `template: ${template}`,
    `checks: ${checks.length}`,
    ...checks.map(c => `  ${c.id} — ${c.name}${c.hint ? ` (hint: ${c.hint})` : ''}`),
  ]
  log.info(summary.join('\n'))

  const s = spinner()
  s.start('Writing challenge bank...')
  writeChallengeBank(id, template, checks)
  s.stop(`Created challenge: challenges/${id}/ (suite.ts + en.yaml)`)

  log.info('Only en.yaml was generated. Add es_mx.yaml later by copying en.yaml and translating, if needed.')

  const createLessonNow = await confirm({
    message: 'Create a lesson pointing at this challenge?',
    initialValue: true,
  })
  if (isCancel(createLessonNow))
    return

  if (createLessonNow) {
    await createLesson({ isChallenge: true, bankId: id, template })
    log.info('Edit the lesson\'s .template/files starter so it matches the challenge\'s starting state.')
  }
}

export async function createChallengeWizard() {
  try {
    await createChallenge()
  }
  catch (e) {
    console.error(red(String(e)))
  }
}
