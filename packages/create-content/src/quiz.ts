import type { QuizQuestionType, QuizStrings, QuizStructure } from '../../../types/quiz'
import type { DraftOption } from './utils'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { confirm, group, isCancel, log, multiline, multiselect, select, spinner, text } from '@clack/prompts'
import { red } from 'kolorist'
import { getRoot, parseOptionLines, slugify, writeQuizFiles } from './utils'

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const TF_PREFILL = 'true: True\nfalse: False'

interface DraftQuestion {
  id: string
  type: QuizQuestionType
  options: DraftOption[]
  answer: string[]
  prompt: string
  explanation?: string
}

interface QuestionForm {
  type: string
  optionLines: string
  prompt: string
  answer: string[] | string
  explanation: string
}

function copyToClipboard(value: string): Promise<boolean> {
  const candidates = [
    { bin: 'pbcopy', args: [] },
    { bin: 'xclip', args: ['-selection', 'clipboard'] },
    { bin: 'clip', args: [] },
  ]
  return new Promise((resolve) => {
    const tryNext = (index: number) => {
      if (index >= candidates.length) {
        resolve(false)
        return
      }
      const { bin, args } = candidates[index]!
      const child = spawn(bin, args)
      let settled = false
      const finish = (ok: boolean) => {
        if (settled)
          return
        settled = true
        if (ok) {
          resolve(true)
        }
        else {
          tryNext(index + 1)
        }
      }
      child.stdin.on('error', () => finish(false))
      child.on('error', () => finish(false))
      child.on('close', (code) => {
        finish(code === 0)
      })
      child.stdin.write(value)
      child.stdin.end()
    }
    tryNext(0)
  })
}

export async function createQuiz() {
  const quizzesDir = join(getRoot(), 'quizzes')

  const quizId = await text({
    message: 'Quiz id (directory under quizzes/):',
    initialValue: 'my-quiz',
    validate: (value) => {
      const v = value?.trim() ?? ''
      if (!v)
        return 'Required'
      if (!KEBAB_RE.test(v))
        return 'Lowercase kebab-case only (e.g. basics-reactivity)'
      if (existsSync(join(quizzesDir, v)))
        return `Quiz "${v}" already exists under quizzes/`
    },
  })
  if (isCancel(quizId))
    return
  const id = quizId.trim()

  const thresholdStr = await text({
    message: 'Pass threshold (0–100, % needed to pass):',
    initialValue: '80',
    validate: (value) => {
      const n = Number(value)
      if (!Number.isInteger(n) || n < 0 || n > 100)
        return 'Must be an integer between 0 and 100'
    },
  })
  if (isCancel(thresholdStr))
    return

  const title = await text({
    message: 'Quiz title (optional — shown above the quiz):',
    placeholder: 'e.g. Vue Basics Checkpoint — empty to omit',
  })
  if (isCancel(title))
    return

  const questions: DraftQuestion[] = []
  const usedQuestionIds = new Set<string>()

  while (true) {
    const form = await group<QuestionForm>({
      type: () => select({
        message: `Question ${questions.length + 1} — type:`,
        options: [
          { value: 'scq', label: 'Single choice (radio)', hint: 'one correct answer' },
          { value: 'mcq', label: 'Multiple choice (checkboxes)', hint: 'one or more correct answers' },
          { value: 'tf', label: 'True / False', hint: 'two fixed options' },
        ],
      }) as Promise<string | undefined>,
      optionLines: ({ results }) => multiline({
        message: results.type === 'tf'
          ? 'True/False options — keep the two lines, tweak the labels if needed:'
          : 'Options — one per line. `id: label` ids explicitly, otherwise the label auto-generates the id. Press Enter twice when done:',
        initialValue: results.type === 'tf' ? TF_PREFILL : undefined,
        placeholder: 'double-braces: `{{ value }}`\n`{ value }`\nsquare-brackets: `[ value ]`',
        validate: (value) => {
          if (!value || parseOptionLines(value).length === 0)
            return 'At least one option is required'
          if (results.type === 'tf' && parseOptionLines(value).length !== 2)
            return 'True/False must have exactly 2 options'
        },
      }) as Promise<string | undefined>,
      prompt: () => multiline({
        message: 'Prompt (Markdown; first line names the question). Press Enter twice when done:',
        validate: (value) => {
          if (!value?.trim())
            return 'Required'
        },
      }) as Promise<string | undefined>,
      answer: ({ results }) => {
        const rawOptions = results.optionLines
        if (!rawOptions || isCancel(rawOptions))
          return undefined
        const opts = parseOptionLines(rawOptions)
        const answerOptions = opts.map(o => ({ value: o.id, label: o.label }))
        const answerPrompt = results.type === 'mcq'
          ? multiselect({
              message: 'Correct answer(s) — pick by label:',
              required: true,
              options: answerOptions,
            })
          : select({
              message: 'Correct answer — pick by label:',
              options: answerOptions,
            })
        return answerPrompt as Promise<string[] | string | undefined>
      },
      explanation: () => multiline({
        message: 'Explanation (optional, Markdown). Press Enter twice when done:',
        placeholder: 'Empty to skip',
      }) as Promise<string | undefined>,
    })

    if (Object.values(form).some(isCancel))
      return

    const type = form.type as QuizQuestionType
    const prompt = form.prompt.trim()
    const options = parseOptionLines(form.optionLines ?? '')

    let answer: string[]
    if (Array.isArray(form.answer)) {
      answer = form.answer.map(String)
    }
    else {
      answer = [String(form.answer)]
    }

    const explanation = form.explanation.trim() || undefined

    const firstLine = prompt.split(/\r?\n/).find(line => line.trim())
    let qid = slugify(firstLine ?? '')
    if (!qid || usedQuestionIds.has(qid)) {
      const explicitId = await text({
        message: !qid
          ? `Question ${questions.length + 1} id:`
          : `Question id "${qid}" is already used — enter another:`,
        validate: (value) => {
          const v = value?.trim() ?? ''
          if (!v)
            return 'Required'
          if (!KEBAB_RE.test(v))
            return 'Lowercase kebab-case only'
          if (usedQuestionIds.has(v))
            return `Question id "${v}" already used`
        },
      })
      if (isCancel(explicitId))
        return
      qid = explicitId.trim()
    }
    usedQuestionIds.add(qid)

    questions.push({ id: qid, type, options, answer, prompt, explanation })

    const addAnother = await confirm({ message: 'Add another question?', initialValue: true })
    if (isCancel(addAnother))
      return
    if (!addAnother)
      break
  }

  const structure: QuizStructure = {
    passThreshold: Number(thresholdStr),
    feedback: 'submit',
    questions: questions.map(q => ({
      id: q.id,
      type: q.type,
      options: q.options.map(o => o.id),
      answer: q.answer,
    })),
  }

  const strings: QuizStrings = {
    ...(title.trim() ? { title: title.trim() } : {}),
    questions: Object.fromEntries(questions.map(q => [
      q.id,
      {
        prompt: q.prompt,
        options: Object.fromEntries(q.options.map(o => [o.id, o.label])),
        ...(q.explanation ? { explanation: q.explanation } : {}),
      },
    ])),
  }

  const summary = [
    `id: ${id}`,
    `pass threshold: ${structure.passThreshold}%`,
    `questions: ${structure.questions.length}`,
    ...structure.questions.map(q => `  ${q.id} (${q.type}) — answer: ${q.answer.join(', ')}`),
  ]
  log.info(summary.join('\n'))

  const s = spinner()
  s.start('Writing quiz files...')
  writeQuizFiles(id, structure, strings)
  s.stop(`Created quiz: quizzes/${id}/ (index.yaml + en.yaml)`)

  log.info('Only en.yaml was generated. Add es_mx.yaml later by copying en.yaml and translating, if needed.')

  const embed = `:quiz{id="${id}"}`
  const copyEmbed = await confirm({
    message: `Copy MDC embed to clipboard? (paste it in a lesson's index.md)`,
    initialValue: true,
  })
  if (isCancel(copyEmbed))
    return

  if (copyEmbed) {
    const copied = await copyToClipboard(embed)
    if (copied) {
      log.success(`Copied to clipboard: ${embed}`)
    }
    else {
      log.warn(`Could not copy to clipboard — paste this into the lesson: ${embed}`)
    }
  }
  else {
    log.info(`Embed MDC block: ${embed}`)
  }
}

export async function createQuizWizard() {
  try {
    await createQuiz()
  }
  catch (e) {
    console.error(red(String(e)))
  }
}
