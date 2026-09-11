<script setup lang="ts">
import { challengeDebug } from '~/composables/useChallengeDebug'
import { useChallengeProgress } from '~/composables/useChallengeProgress'
import { useChallengeValidation } from '~/composables/useChallengeValidation'
import { loadGuideMeta } from '~/composables/useGuideMeta'
import { challenges } from '~/db/challenges'
import { getChallengeSuiteFile } from '~/types/guides'

const guide = useGuideStore()
const route = useRoute()

const {
  status,
  results,
  passed,
  runValidation,
  computing,
  reset,
} = useChallengeValidation()

const progress = useChallengeProgress()

const hasValidation = computed(() =>
  !!guide.currentGuide?.validation,
)

const completed = computed(() =>
  progress.isCompleted(guide.currentGuide?.sessionName),
)

async function check() {
  if (computing.value)
    return
  challengeDebug('check button clicked', {
    hasValidation: hasValidation.value,
    computing: computing.value,
    completed: completed.value,
    file: getChallengeSuiteFile(guide.currentGuide?.template),
    sessionName: guide.currentGuide?.sessionName,
  })
  // A peek at the solution must never be checked — restore the user's own code
  // first so "Check my work" always validates their work.
  if (guide.showingSolution)
    await guide.toggleSolutions()
  await runValidation()
}

const showFeedback = computed(() => status.value === 'pass' || status.value === 'fail')

const retaking = ref(false)

async function retake() {
  if (computing.value)
    return
  retaking.value = true
  reset()
  const meta = await loadGuideMeta(route.path)
  if (meta) {
    await guide.mount(meta, false)
  }
  // Commit the retake immediately: flip the record back to failed so the nav
  // checkmark, card border and "completed" state all revert in one step, and
  // the next visit loads the pristine starter. (Files in the DB are left
  // untouched until the next pass overwrites them.)
  const sessionName = guide.currentGuide?.sessionName
  if (sessionName)
    await challenges.recordAttempt(sessionName)
}

// Show "Check my work" for fresh or failing states; during a retake the user
// can iterate without being forced to reset.  "Retake challenge" only appears
// once the challenge is already passed.
const showCheck = computed(() => !completed.value || retaking.value)
const showRetake = computed(() => completed.value && !retaking.value)

// End the retake session as soon as a check finishes so the correct button
// reappears immediately (pass → Retake, fail → Check my work).
watch(status, (s) => {
  if (s === 'pass' || s === 'fail')
    retaking.value = false
})

const statusSummary = computed(() => {
  if (!guide.currentGuide?.validation)
    return ''
  const total = results.value.length
  const passedCount = results.value.filter(r => r.passed).length
  return `${passedCount}/${total}`
})
</script>

<template>
  <div
    v-if="hasValidation"
    class="challenge-client"
    flex="~ col gap-3"
    border="~ solid challenge"
    bg="bgr dark:bgr-dark"
    my-4 p4 rounded-xl
    :class="{ 'border-positive': completed && passed }"
  >
    <div flex="~ gap-2 items-center justify-between">
      <div v-if="passed" flex="~ gap-2 items-center" text-positive>
        <div i-mynaui-check-hexagon-solid flex-none />
        <span text-sm>{{ $t('challenge.completed') }}</span>
      </div>
      <div v-else text-challenge>
        <div flex="~ gap-2 items-center">
          <div i-mynaui-lightning-solid flex-none />
          <span>{{ $t('challenge.check-title') }}</span>
        </div>
        <span text-xs op60>
          {{ $t('update-the-code-in-the-playground-and-click-check-my-work') }}
        </span>
      </div>
      <div flex="~ gap-2 items-center flex-wrap justify-end">
        <button
          v-if="showCheck"
          type="button"
          text-sm text-white font-medium px3 py1.5 rounded-lg dark:bg-primary-dark-500
          class="bg-challenge! disabled:op60 disabled:cursor-not-allowed"
          :disabled="computing || guide.showingSolution"
          @click="check"
        >
          <span v-if="computing" flex="~ gap-2 items-center">
            <div i-svg-spinners-pulse-multiple />
            <div>{{ $t('challenge.checking') }}</div>
          </span>
          <span v-else>{{ $t('challenge.check') }}</span>
        </button>

        <button
          v-if="showRetake"
          type="button"
          text-sm text-white font-medium px3 py1.5 rounded-lg dark:bg-primary-dark-500
          class="bg-challenge! disabled:op60 disabled:cursor-not-allowed"
          :disabled="computing"
          @click="retake"
        >
          <span v-if="computing" flex="~ gap-2 items-center">
            <div i-svg-spinners-pulse-multiple />
            <div>{{ $t('challenge.checking') }}</div>
          </span>
          <span v-else>{{ $t('challenge.retake') }}</span>
        </button>

        <span v-if="statusSummary" text-md op60 data-testid="challenge-status-summary">
          {{ statusSummary }}
        </span>
      </div>
    </div>

    <div
      v-if="showFeedback"
      flex="~ gap-2 items-center"
      class="text-sm px3 py2 rounded-lg"
      :class="passed ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'"
    >
      <div
        :class="passed ? 'i-mynaui-check-hexagon-solid' : 'i-mynaui-danger-hexagon-solid'"
        flex-none
      />
      <span font-medium>
        {{ passed ? $t('challenge.pass') : $t('challenge.fail') }}
      </span>
    </div>

    <div v-if="results.length" flex="~ col gap-1.5" text-sm>
      <div
        v-for="(result, i) in results"
        :key="i"
        flex="~ gap-2 items-start"
        p2 rounded-lg
        :class="result.passed ? 'bg-positive/5' : 'bg-negative/5'"
      >
        <div
          mt0.5 flex-none
          :class="result.passed ? 'i-mynaui-check-solid text-positive' : 'i-mynaui-x-solid text-negative'"
        />
        <div flex="~ col gap-0.5 min-w-0">
          <span font-medium>{{ result.name }}</span>
          <span v-if="result.hint && !result.passed" text-xs op50 italic>{{ result.hint }}</span>
          <span v-if="result.message" op70 break-words>{{ result.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
