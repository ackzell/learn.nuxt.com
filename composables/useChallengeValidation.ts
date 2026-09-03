import type { ChallengeCheckResult, SuiteResultPayload, ValidationStatus } from '~/types/validation'
import { computed, ref } from 'vue'
import { challenges } from '~/db/challenges'
import { useGuideStore } from '~/stores/guide'

/**
 * Returns the live `contentDocument` of the playground preview iframe.
 * `PanelPreviewClient` exposes this on the global `window` so components
 * outside the preview tree (like the challenge checker) can inspect the
 * rendered DOM.
 */
export function getPreviewDocument(): Document | null {
  if (typeof window === 'undefined')
    return null
  const fn = (window as any).__getPreviewDocument
  if (typeof fn !== 'function')
    return null
  return fn() as Document | null
}

// ── Shared state ─────────────────────────────────────────────────────────────
// Both the challenge widget (`ChallengeCheck`) and the preview toolbar
// (`PanelPreview`) drive the same validation so their status/results stay
// consistent. Module-level refs make every `useChallengeValidation()` call
// observe the same state.
const status = ref<ValidationStatus>('idle')
const results = ref<ChallengeCheckResult[]>([])
const attempts = ref(0)
const computing = ref(false)

/**
 * Central entry point for running the challenge suite. Exposed by
 * `PanelPreviewClient`; the bridge adds request-id handling and a timeout.
 */
function runChallengeSuite(file: string): Promise<SuiteResultPayload> {
  const opener = (window as any).__runChallengeSuite
  if (typeof opener !== 'function') {
    return Promise.resolve({
      id: '',
      success: false,
      empty: true,
      passed: false,
      tests: [{ name: 'suite', passed: false, message: 'Preview is not ready. Try again once the preview has loaded.' }],
    })
  }
  return opener(file) as Promise<SuiteResultPayload>
}

/**
 * Runs the current guide's challenge suite against the live preview.
 *
 * Completion requires a non-empty, fully-passing suite — an empty suite is an
 * explicit failure (the harness emits one; see `__challenge__/harness.*`), never
 * the `[].every(...) === true` empty-trick, and is never recorded as passed.
 *
 * Shared across the challenge widget and the preview toolbar so both surfaces
 * report identical results.
 */
export function useChallengeValidation() {
  const guide = useGuideStore()

  const passed = computed(() => status.value === 'pass')
  const failed = computed(() => status.value === 'fail')

  async function runValidation(): Promise<boolean> {
    const validation = guide.currentGuide?.validation
    if (!validation?.file)
      return false

    computing.value = true
    try {
      const outcome = await runChallengeSuite(validation.file)
      if (outcome?.cancelled)
        return false

      const tests: ChallengeCheckResult[] = Array.isArray(outcome?.tests) ? outcome.tests : []
      results.value = tests

      // A suite passes only when it is non-empty and every check passed.
      const passedNow = !!outcome?.passed && !outcome?.empty && tests.length > 0 && tests.every((t: ChallengeCheckResult) => t.passed)
      status.value = passedNow ? 'pass' : 'fail'
      attempts.value += 1

      const sessionName = guide.currentGuide?.sessionName
      if (passedNow && sessionName)
        await challenges.recordPass(sessionName)
      else if (sessionName)
        await challenges.recordAttempt(sessionName)

      return passedNow
    }
    finally {
      computing.value = false
    }
  }

  function reset() {
    status.value = 'idle'
    results.value = []
    attempts.value = 0
  }

  return {
    status,
    results,
    attempts,
    passed,
    failed,
    computing,
    runValidation,
    reset,
  }
}
