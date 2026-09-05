export type QuizQuestionType = 'mcq' | 'scq' | 'tf'
export type QuizFeedbackMode = 'submit'

/**
 * The non-localized, shared part of a quiz: question types, option ids (and
 * their order), correct answers and the pass threshold. Authored once in
 * `quizzes/<id>/index.yaml` and edited in a single place — no per-locale
 * duplication, so answer/index changes never drift per language.
 */
export interface QuizStructure {
  passThreshold: number
  feedback: QuizFeedbackMode
  questions: QuizQuestionDefinition[]
}

export interface QuizQuestionDefinition {
  id: string
  type: QuizQuestionType
  options: string[]
  answer: string[]
}

/**
 * Per-locale strings for one quiz, keyed by the same ids used in the
 * structure. All string fields may contain Markdown (bold/italic/inline code,
 * links and fenced code blocks) — rendered client-side through the MDC runtime.
 */
export interface QuizStrings {
  title?: string
  questions: Record<string, QuizQuestionStrings>
}

export interface QuizQuestionStrings {
  prompt: string
  options: Record<string, string>
  explanation?: string
}

export interface QuizMapEntry {
  id: string
  structure: QuizStructure
  strings: Record<string, QuizStrings>
}

export interface ResolvedQuizOption {
  id: string
  label: string
}

export interface ResolvedQuizQuestion {
  id: string
  type: QuizQuestionType
  prompt: string
  options: ResolvedQuizOption[]
  answer: string[]
  explanation?: string
}

export interface ResolvedQuiz {
  id: string
  title?: string
  passThreshold: number
  feedback: QuizFeedbackMode
  questions: ResolvedQuizQuestion[]
}

export interface QuizQuestionResult {
  questionId: string
  selected: string[]
  expected: string[]
  correct: boolean
}

export interface QuizResult {
  score: number
  total: number
  percentage: number
  passed: boolean
  questions: QuizQuestionResult[]
}
