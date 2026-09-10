export const CHALLENGE_DEBUG_TAG = '[challenge-debug]'

export function isChallengeDebugEnabled(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__challengeDebug
}

export function challengeDebug(message: string, ...args: unknown[]): void {
  if (!isChallengeDebugEnabled())
    return
  console.warn(CHALLENGE_DEBUG_TAG, message, ...args)
}
