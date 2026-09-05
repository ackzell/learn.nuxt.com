<script setup lang="ts">
import type { QuizResult, ResolvedQuizQuestion } from '~/types/quiz'
import { gradeQuiz, normalizeLessonPath, useQuiz } from '~/composables/useQuiz'
import { useQuizProgress } from '~/composables/useQuizProgress'
import { quizzes } from '~/db/quizzes'
import { shuffleList } from '~/lib/shuffle'

const props = defineProps<{
  id: string
  sessionName?: string
}>()

const route = useRoute()
const progress = useQuizProgress()

const { data: quiz } = useQuiz(() => props.id)

const selections = ref<Record<string, string[]>>({})
const submitted = ref(false)
const retaking = ref(false)

interface QuizDisplay {
  questionOrder: string[]
  optionOrder: Record<string, string[]>
}

const display = ref<QuizDisplay>({ questionOrder: [], optionOrder: {} })
let hydrated = false

function reshuffle() {
  const qz = quiz.value
  if (!qz)
    return
  display.value = {
    questionOrder: shuffleList(qz.questions.map(q => q.id)),
    optionOrder: Object.fromEntries(qz.questions.map(q => [q.id, shuffleList(q.options.map(o => o.id))])),
  }
}

onMounted(() => {
  hydrated = true
  reshuffle()
})

watch(() => quiz.value, (qz) => {
  if (qz && hydrated)
    reshuffle()
})

const displayedQuestions = computed<ResolvedQuizQuestion[]>(() => {
  const qz = quiz.value
  if (!qz)
    return []
  const { questionOrder, optionOrder } = display.value
  if (questionOrder.length === 0)
    return qz.questions
  return questionOrder.map((qid) => {
    const q = qz.questions.find(x => x.id === qid)!
    const ids = optionOrder[qid] ?? q.options.map(o => o.id)
    return { ...q, options: ids.map(oid => q.options.find(o => o.id === oid)!) }
  })
})

const result = computed<QuizResult | null>(() =>
  quiz.value ? gradeQuiz(quiz.value, selections.value) : null,
)

const sessionName = computed(() => props.sessionName || normalizeLessonPath(route.path))

const passed = computed(() => result.value?.passed ?? false)
const showFeedback = computed(() => submitted.value)
const completed = computed(() => progress.isCompleted(sessionName.value))
const revealAnswers = computed(() => submitted.value || (completed.value && !retaking.value))
const unanswered = computed(() =>
  quiz.value?.questions.some(q => (selections.value[q.id] ?? []).length === 0) ?? false,
)

function isSelected(q: ResolvedQuizQuestion, oid: string) {
  return (selections.value[q.id] ?? []).includes(oid)
}

function toggleOption(q: ResolvedQuizQuestion, oid: string) {
  if (revealAnswers.value)
    return
  const current = selections.value[q.id] ?? []
  let next: string[]
  if (q.type === 'tf' || q.type === 'scq') {
    next = current[0] === oid ? [] : [oid]
  }
  else {
    next = current.includes(oid)
      ? current.filter(v => v !== oid)
      : [...current, oid]
  }
  selections.value = { ...selections.value, [q.id]: next }
}

function optionState(q: ResolvedQuizQuestion, oid: string) {
  const selected = isSelected(q, oid)
  const isAnswer = q.answer.includes(oid)
  if (!revealAnswers.value)
    return { selected, isAnswer, incorrect: false, missed: false }
  return {
    selected,
    isAnswer,
    incorrect: selected && !isAnswer,
    missed: !selected && isAnswer,
  }
}

function optionClass(q: ResolvedQuizQuestion, oid: string): string {
  const s = optionState(q, oid)
  if (s.incorrect)
    return 'border-negative/60 bg-negative/5 text-negative'
  if (s.missed)
    return 'border-positive/60 bg-positive/5 text-positive'
  if (s.selected)
    return 'border-challenge bg-bgr-100/60 dark:bg-bgr-700/60'
  return 'border-base hover:border-challenge-700/60 hover:bg-bgr-100/20 dark:hover:bg-bgr-700/20'
}

function optionMarkerClass(q: ResolvedQuizQuestion, oid: string): string {
  const s = optionState(q, oid)
  if (!revealAnswers.value)
    return s.selected ? 'i-mynaui-circle-solid text-challenge' : 'i-mynaui-circle-outline op40'
  if (s.incorrect)
    return 'i-mynaui-x-solid text-negative'
  if (s.isAnswer)
    return 'i-mynaui-check-solid text-positive'
  return 'i-mynaui-circle-outline op40'
}

function submit() {
  if (!quiz.value || submitted.value || !result.value)
    return
  submitted.value = true
  if (result.value.passed) {
    void quizzes.recordPass(sessionName.value, result.value.percentage)
  }
  else {
    void quizzes.recordAttempt(sessionName.value, result.value.percentage)
  }
}

function retake() {
  selections.value = {}
  submitted.value = false
  retaking.value = true
  reshuffle()
}
</script>

<template>
  <div
    v-if="quiz"
    class="amx-quiz bg-bgr-50 dark:bg-bgr-dark"
    flex="~ col gap-4"
    border="~ solid challenge"
    my-2 p4 rounded-md
    :class="{
      'border-positive': completed,
    }"
  >
    <div flex="~ gap-2 items-center justify-between">
      <div flex="~ gap-2 items-center" text-challenge>
        <div i-mynaui-chat-question-hexagon-solid flex-none />
        <span font-medium>
          {{ quiz.title || $t('quiz.check-title') }}
        </span>
      </div>
      <div v-if="completed && !showFeedback" flex="~ gap-2 items-center" text-positive>
        <div i-mynaui-check-hexagon-solid flex-none />
        <span text-sm>{{ $t('quiz.completed') }}</span>
      </div>
    </div>

    <!-- Question List -->
    <div
      v-for="(q, qi) in displayedQuestions" :key="q.id"
      flex="~ col gap-2"
      class="bg-bgr-100/30 dark:bg-bgr-800/40"
      p3 rounded-md
    >
      <!-- Question Prompt -->
      <div flex="~ gap-1 items-start justify-start col" text-medium text-sm>
        <span text-lg text-challenge-600 flex-none>{{ $t('quiz.question', { n: qi + 1 }) }}</span>
        <MDC class="amx-md text-challenge-700 dark:text-challenge-200" :value="q.prompt" />
      </div>

      <!-- Option List -->
      <div grid="~ cols-1 sm:cols-2 gap-2">
        <label
          v-for="opt in q.options"
          :key="opt.id"
          flex="~ gap-2 items-center justify-between"
          text-sm p2 rounded-lg cursor-pointer select-none
          border="~ solid"
          transition="all duration-200"
          :class="optionClass(q, opt.id)"
        >
          <input
            class="sr-only"
            :type="q.type === 'mcq' ? 'checkbox' : 'radio'"
            :name="q.id"
            :value="opt.id"
            :checked="isSelected(q, opt.id)"
            :disabled="revealAnswers"
            @change="toggleOption(q, opt.id)"
          >
          <div min-w-0>
            <MDC class="amx-md option-md" :value="opt.label" tag="span" unwrap="p" />
          </div>
          <div
            mt-0.5 flex-none
            :class="optionMarkerClass(q, opt.id)"
            aria-hidden="true"
          />
        </label>
      </div>

      <!-- Explanation -->
      <div
        v-if="revealAnswers && q.explanation"
        flex="~ col gap-1"
        class="bg-bgr-50 dark:bg-bgr-800/40"
        text-sm p3 rounded-lg
      >
        <div flex="~ gap-2 items-center" text-positive font-medium>
          <div i-mynaui-info-circle-solid flex-none />
          <span>{{ $t('quiz.explanation') }}</span>
        </div>
        <MDC class="amx-md" :value="q.explanation" />
      </div>
    </div>

    <!-- Submit Button -->
    <div
      v-if="!revealAnswers"
      flex="~ gap-2 items-center flex-wrap justify-between"
      border="t base"
      mt1 pt3
    >
      <span v-if="unanswered" text-xs op50>{{ $t('quiz.answer-all-hint') }}</span>
      <span v-else />
      <button
        type="button"
        :disabled="unanswered"
        text-sm text-white font-medium px3 py1.5 rounded-lg dark:bg-primary-dark-500
        class="bg-challenge! disabled:op60 disabled:cursor-not-allowed"
        data-testid="quiz-submit"
        @click="submit"
      >
        {{ $t('quiz.submit') }}
      </button>
    </div>

    <div v-else-if="showFeedback && !completed" flex="~ gap-2 items-center justify-between" border="t base" mt1 pt3>
      <div
        flex="~ gap-2 items-center"
        text-sm px3 py1.5 rounded-lg
        :class="passed ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'"
      >
        <div :class="passed ? 'i-mynaui-check-hexagon-solid' : 'i-mynaui-danger-hexagon-solid'" flex-none />
        <span font-medium>
          {{ passed ? $t('quiz.passed') : $t('quiz.failed') }}
        </span>
        <span data-testid="quiz-score" op70>
          {{ $t('quiz.score', { score: result?.score, total: result?.total }) }}
        </span>
      </div>
      <button
        type="button"
        text-sm font-medium px3 py1.5 rounded-lg
        border="~ base"
        hover="bg-bgr-100 dark:bg-bgr-700"
        data-testid="quiz-retake"
        @click="retake"
      >
        {{ $t('quiz.retake') }}
      </button>
    </div>

    <div v-else flex="~ gap-2 items-center justify-between" border="t base" mt1 pt3>
      <div
        flex="~ gap-2 items-center"
        text-sm px3 py1.5 rounded-lg
        class="text-positive bg-positive/10"
      >
        <div i-mynaui-check-hexagon-solid flex-none />
        <span font-medium>
          {{ $t('quiz.passed') }}
        </span>
        <span data-testid="quiz-best-score" op70>
          {{ $t('quiz.score', { score: progress.bestScore(sessionName.value) ?? 0, total: 100 }) }}
        </span>
      </div>
      <button
        type="button"
        text-sm font-medium px3 py1.5 rounded-lg
        border="~ base"
        hover="bg-bgr-100 dark:bg-bgr-700"
        data-testid="quiz-retake"
        @click="retake"
      >
        {{ $t('quiz.retake') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.amx-quiz :deep(.amx-md p) {
  margin: 0;
  font-size: 1.03rem;
}
.amx-quiz :deep(.amx-md :is(p, li) code) {
  background: rgb(127 127 127 / 0.15);
  border-radius: 0.25rem;
  padding: 0.1em 0.3em;
  font-size: 0.9em;
}
.amx-quiz :deep(.amx-md pre) {
  background: rgb(127 127 127 / 0.12);
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}
.amx-quiz :deep(.amx-md pre code) {
  background: transparent;
  padding: 0;
}
.amx-quiz :deep(.amx-md strong) {
  font-weight: 600;
}
.amx-quiz :deep(.amx-md a) {
  text-decoration: underline;
}
.amx-quiz :deep(.amx-md ul),
.amx-quiz :deep(.amx-md ol) {
  padding-left: 1.25rem;
  margin: 0.35rem 0;
}
</style>
