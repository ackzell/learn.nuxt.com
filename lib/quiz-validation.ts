import type { QuizQuestionDefinition, QuizStrings, QuizStructure } from '../types/quiz'

const VALID_TYPES = ['mcq', 'scq', 'tf'] as const

function asStringList(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`[quiz] ${path} must be an array`)
  }
  return value.map((v, i) => {
    if (typeof v !== 'string' || v.length === 0) {
      throw new Error(`[quiz] ${path}[${i}] must be a non-empty string`)
    }
    return v
  })
}

/**
 * Validates the shared structure of a quiz. Throws on any violation — a quiz
 * with a structurally wrong `index.yaml` should fail fast (dev and build)
 * instead of silently misgrading learners.
 */
export function validateQuizStructure(structure: QuizStructure): void {
  if (!structure || typeof structure !== 'object') {
    throw new Error('[quiz] structure must be an object')
  }
  if (typeof structure.passThreshold !== 'number' || structure.passThreshold < 0 || structure.passThreshold > 100) {
    throw new Error('[quiz] passThreshold must be a number between 0 and 100')
  }
  if (structure.feedback !== 'submit') {
    throw new Error('[quiz] feedback must be "submit" (immediate mode is not supported yet)')
  }
  if (!Array.isArray(structure.questions) || structure.questions.length === 0) {
    throw new Error('[quiz] must define at least one question')
  }

  const ids = new Set<string>()
  for (const [i, q] of structure.questions.entries()) {
    const path = `questions[${i}]`
    const question = q as QuizQuestionDefinition
    if (!question || typeof question.id !== 'string' || question.id.length === 0) {
      throw new Error(`[quiz] ${path} must have a non-empty string id`)
    }
    if (ids.has(question.id)) {
      throw new Error(`[quiz] duplicate question id "${question.id}"`)
    }
    ids.add(question.id)
    if (!VALID_TYPES.includes(question.type as any)) {
      throw new Error(`[quiz] ${path} ("${question.id}") type must be one of: ${VALID_TYPES.join(', ')}`)
    }
    const options = asStringList(question.options, `${path}.options`)
    const optionSet = new Set(options)
    if (optionSet.size !== options.length) {
      throw new Error(`[quiz] ${path} ("${question.id}") has duplicate option ids`)
    }
    if (question.type === 'tf' && options.length !== 2) {
      throw new Error(`[quiz] ${path} ("${question.id}") is tf and must have exactly 2 options (got ${options.length})`)
    }
    if (question.type === 'scq' && options.length < 2) {
      throw new Error(`[quiz] ${path} ("${question.id}") is scq and must have at least 2 options (got ${options.length})`)
    }
    const answer = asStringList(question.answer, `${path}.answer`)
    if (answer.length === 0) {
      throw new Error(`[quiz] ${path} ("${question.id}") must define at least one correct answer`)
    }
    for (const a of answer) {
      if (!optionSet.has(a)) {
        throw new Error(`[quiz] ${path} ("${question.id}") answer "${a}" is not one of the options`)
      }
    }
    const singleAnswer = question.type === 'tf' || question.type === 'scq'
    if (singleAnswer && answer.length !== 1) {
      throw new Error(`[quiz] ${path} ("${question.id}") is ${question.type} and must have exactly one answer`)
    }
  }
}

/**
 * Validates that per-locale strings fully cover the structure. Returns a list
 * of problems (as opposed to throwing) so a partially translated quiz warns
 * instead of breaking the build — the missing strings simply fall back to the
 * option ids / empty text at runtime.
 */
export function validateQuizStrings(structure: QuizStructure, strings: QuizStrings): string[] {
  const problems: string[] = []
  const qs = strings?.questions ?? {}
  for (const [i, q] of structure.questions.entries()) {
    const label = `questions[${i}] ("${q.id}") in ${strings?.title ?? 'quiz'}`
    const qsEntry = qs[q.id]
    if (!qsEntry) {
      problems.push(`[quiz] missing strings for ${label}`)
      continue
    }
    if (typeof qsEntry.prompt !== 'string' || qsEntry.prompt.length === 0) {
      problems.push(`[quiz] missing prompt for ${label}`)
    }
    for (const oid of q.options) {
      if (typeof qsEntry.options?.[oid] !== 'string' || qsEntry.options[oid].length === 0) {
        problems.push(`[quiz] missing option label "${oid}" for ${label}`)
      }
    }
  }
  return problems
}
