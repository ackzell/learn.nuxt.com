import type { MaybeRefOrGetter } from 'vue'
import type { QuizMapEntry, QuizResult, ResolvedQuiz } from '~/types/quiz'
import { toValue } from 'vue'

let mapPromise: Promise<Record<string, QuizMapEntry>> | null = null

function getQuizMap(): Promise<Record<string, QuizMapEntry>> {
  mapPromise ??= import('virtual:quiz-map').then(
    m => m.default as Record<string, QuizMapEntry>,
  )
  return mapPromise
}

/**
 * Normalizes a lesson route path for quiz session identity, stripping the
 * numeric prefixes used to order lessons (mirrors Nuxt Content's
 * `content:file:afterParse` cleanup). e.g. `/en/02.basics/11.quiz` →
 * `/en/basics/quiz`.
 */
export function normalizeLessonPath(path: string): string {
  return path
    .replace(/\/+$/, '')
    .split('/')
    .map(part => part.replace(/^\d+[a-z]*\./i, ''))
    .join('/')
}

/**
 * Merges a quiz's shared structure with the strings for the requested locale.
 * Falls back to `en` when the locale has no strings yet, and to raw option ids
 * for any missing label — so a partially-translated quiz stays usable.
 */
export function resolveQuiz(
  map: Record<string, QuizMapEntry>,
  id: string,
  locale: string,
): ResolvedQuiz | null {
  const entry = map[id]
  if (!entry)
    return null
  const strings = entry.strings[locale] ?? entry.strings.en
  const qs = strings?.questions ?? {}

  return {
    id: entry.id,
    title: strings?.title,
    passThreshold: entry.structure.passThreshold,
    feedback: entry.structure.feedback,
    questions: entry.structure.questions.map((q) => {
      const local = qs[q.id]
      return {
        id: q.id,
        type: q.type,
        prompt: local?.prompt ?? '',
        options: q.options.map(oid => ({
          id: oid,
          label: local?.options?.[oid] ?? oid,
        })),
        answer: q.answer,
        explanation: local?.explanation,
      }
    }),
  }
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length)
    return false
  const set = new Set(b)
  return a.every(v => set.has(v))
}

/**
 * Grades a quiz against the student's selections. A question is correct only
 * when the selected option ids exactly match the expected answer ids.
 * `percentage` is rounded and `passed` is `percentage >= passThreshold`.
 */
export function gradeQuiz(quiz: ResolvedQuiz, selections: Record<string, string[]>): QuizResult {
  const questions = quiz.questions.map((q) => {
    const selected = selections[q.id] ?? []
    const correct = setsEqual(selected, q.answer)
    return { questionId: q.id, selected, expected: q.answer, correct }
  })
  const score = questions.filter(q => q.correct).length
  const total = questions.length
  const percentage = total === 0 ? 0 : Math.round((score / total) * 100)
  return {
    score,
    total,
    percentage,
    passed: percentage >= quiz.passThreshold,
    questions,
  }
}

/**
 * Loads a quiz by id for the currently active locale. SSR-friendly (the map is
 * a build-time virtual module) and re-resolves when the id or locale changes.
 */
export function useQuiz(id: MaybeRefOrGetter<string>) {
  const { locale } = useI18n()

  return useAsyncData(
    computed(() => `quiz-${toValue(id)}-${locale.value}`),
    async () => {
      const map = await getQuizMap()
      return resolveQuiz(map, toValue(id), locale.value)
    },
    { default: () => null },
  )
}
