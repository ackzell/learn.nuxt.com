import type { Challenge } from '@/db'
import { onScopeDispose, ref, shallowRef } from 'vue'
import { challenges } from '~/db/challenges'

/**
 * Reactive, app-wide record of which challenges the student has completed,
 * keyed by `sessionName`. Used by nav components to show completion status
 * (e.g. a green checkmark next to finished challenges).
 */
export function useChallengeProgress() {
  const completedBySession = shallowRef<Map<string, Challenge>>(new Map())
  const ready = ref(false)

  let subscription: { unsubscribe: () => void } | null = null

  const start = () => {
    if (subscription)
      return
    // IndexedDB (Dexie) is not available during SSR; only query on the client.
    if (!import.meta.client)
      return
    subscription = challenges.liveQueryChallenges().subscribe((list) => {
      const map = new Map<string, Challenge>()
      for (const c of list)
        map.set(c.sessionName, c)
      completedBySession.value = map
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
    return completedBySession.value.has(sessionName)
  }

  return {
    completedBySession,
    ready,
    isCompleted,
  }
}
