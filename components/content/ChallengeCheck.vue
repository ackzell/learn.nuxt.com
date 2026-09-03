<script setup lang="ts">
import { useChallengeProgress } from '~/composables/useChallengeProgress'
import { useChallengeValidation } from '~/composables/useChallengeValidation'

const guide = useGuideStore()

const {
  status,
  results,
  passed,
  runValidation,
  computing,
} = useChallengeValidation()

const progress = useChallengeProgress()

const hasValidation = computed(() =>
  !!guide.currentGuide?.validation?.file,
)

const completed = computed(() =>
  progress.isCompleted(guide.currentGuide?.sessionName),
)

async function check() {
  if (computing.value)
    return
  await runValidation()
}

const showFeedback = computed(() => status.value === 'pass' || status.value === 'fail')

const statusSummary = computed(() => {
  if (!guide.currentGuide?.validation)
    return ''
  const total = results.value.length
  const passedCount = results.value.filter(r => r.passed).length
  return `${passedCount}/${total}`
})
</script>

<template>
  <div v-if="hasValidation" class="challenge-client" flex="~ col gap-3" border="~ base solid" p4 rounded-xl>
    <div flex="~ gap-2 items-center">
      <div i-mynaui-lightning-solid text-challenge flex-none />
      <span text-sm font-semibold>{{ $t('challenge.check-title') }}</span>
    </div>

    <div v-if="completed && !showFeedback" flex="~ gap-2 items-center" text-positive>
      <div i-mynaui-check-hexagon-solid flex-none />
      <span text-sm>{{ $t('challenge.completed') }}</span>
    </div>

    <div flex="~ gap-2 items-center flex-wrap">
      <button
        type="button"

        bg="primary-600 dark:bg-primary-dark-500"
        text-sm text-white font-medium px3 py1.5 rounded-lg
        class="disabled:op60 disabled:cursor-not-allowed"
        :disabled="computing"
        @click="check"
      >
        <span v-if="computing" inline-flex="~ gap-1 items-center">
          <div i-svg-spinners-90-ring-with-bg animate-spin />
          {{ $t('challenge.checking') }}
        </span>
        <span v-else>{{ $t('challenge.check') }}</span>
      </button>

      <span v-if="statusSummary" text-xs op60 data-testid="challenge-status-summary">
        {{ statusSummary }}
      </span>
    </div>

    <div
      v-if="showFeedback"
      flex="~ gap-2 items-center"
      class="text-sm px3 py2 rounded-lg"
      :class="passed ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning'"
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
        :class="result.passed ? 'bg-positive/5' : 'bg-warning/5'"
      >
        <div
          mt0.5 flex-none
          :class="result.passed ? 'i-mynaui-check-solid text-positive' : 'i-mynaui-x-solid text-warning'"
        />
        <div flex="~ col gap-0.5 min-w-0">
          <span font-medium>{{ result.name }}</span>
          <span v-if="result.hint && !result.passed" text-xs op50 italic>{{ result.hint }}</span>
          <span v-if="result.message" op70 break-words>{{ result.message }}</span>
        </div>
      </div>
    </div>

    <div v-if="guide.currentGuide?.solutions" mt1 border="t base" pt3>
      <ButtonShowSolution />
    </div>
  </div>
</template>
