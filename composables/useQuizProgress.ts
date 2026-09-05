import type { QuizRecord } from '@/db'
import { onScopeDispose, ref, shallowRef } from 'vue'
import { quizzes } from '~/db/quizzes'

/**
 * Reactive, app-wide record of passed quizzes, keyed by sessionName. Fetching
 * the best score works only after a pass (the live query emits `passed` rows).
 */
export function useQuizProgress() {
  const passedBySession = shallowRef<Map<string, QuizRecord>>(new Map())
  const ready = ref(false)

  let subscription: { unsubscribe: () => void } | null = null

  const start = () => {
    if (subscription)
      return
    // IndexedDB (Dexie) is not available during SSR; only query on the client.
    if (!import.meta.client)
      return
    subscription = quizzes.liveQueryQuizzes().subscribe((list) => {
      const map = new Map<string, QuizRecord>()
      for (const q of list)
        map.set(q.sessionName, q)
      passedBySession.value = map
      ready.value = true
    })
  }

  const stop = () => {
    subscription?.unsubscribe()
    subscription = null
  }

  onScopeDispose(stop)
  start()

  function isCompleted(sessionName?: string): boolean {
    if (!sessionName)
      return false
    return passedBySession.value.has(sessionName)
  }

  function bestScore(sessionName?: string): number | undefined {
    if (!sessionName)
      return undefined
    return passedBySession.value.get(sessionName)?.bestScore
  }

  return {
    passedBySession,
    ready,
    isCompleted,
    bestScore,
  }
}
