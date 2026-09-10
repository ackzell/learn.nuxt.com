import type { Observable } from 'dexie'
import type { Challenge } from '@/db'
import { liveQuery } from 'dexie'
import { db } from '@/db'

export const challenges = {
  getByName,
  recordPass,
  recordAttempt,
  incrementAttempts,
  liveQueryChallenges,
  liveQueryChallengeByName,
}

async function getByName(sessionName: string): Promise<Challenge | undefined> {
  return db.challenges.where('sessionName').equals(sessionName).first()
}

/**
 * Emits only `passed` challenges. Nav completion indicators must not light up
 * for a failed or empty attempt.
 */
function liveQueryChallenges(): Observable<Challenge[]> {
  return liveQuery(async () => db.challenges.where('status').equals('passed').toArray())
}

function liveQueryChallengeByName(sessionName: string): Observable<Challenge | undefined> {
  return liveQuery(async () => db.challenges.where('sessionName').equals(sessionName).first())
}

/**
 * Record a successful pass. Completion requires a non-empty, fully-passing
 * suite (handled by the validation composable) — this method only records the
 * pass once that precondition is met.
 */
async function recordPass(sessionName: string, files?: Record<string, string>): Promise<void> {
  const existing = await getByName(sessionName)
  if (existing) {
    await db.challenges.update(existing.id, {
      status: 'passed',
      passedAt: new Date(),
      attempts: existing.attempts + 1,
      ...(files ? { files } : {}),
    })
  }
  else {
    await db.challenges.add({
      sessionName,
      status: 'passed',
      passedAt: new Date(),
      attempts: 1,
      ...(files ? { files } : {}),
    })
  }
}

/**
 * Persist a validation attempt regardless of outcome. Failed attempts create
 * a `failed` row (or flip an existing row back to `failed`) so attempt counts
 * stay meaningful and a failed retake reverts the challenge to incomplete —
 * mirroring how quizzes handle re-taking.
 */
async function recordAttempt(sessionName: string): Promise<void> {
  const existing = await getByName(sessionName)
  if (existing) {
    await db.challenges.update(existing.id, {
      status: 'failed',
      attempts: existing.attempts + 1,
    })
  }
  else {
    await db.challenges.add({
      sessionName,
      status: 'failed',
      attempts: 1,
    })
  }
}

/**
 * @deprecated Prefer `recordPass` / `recordAttempt`, which persist the right
 * status. Kept for call parity with the original helper.
 */
async function incrementAttempts(sessionName: string): Promise<void> {
  const existing = await getByName(sessionName)
  if (!existing)
    return
  await db.challenges.update(existing.id, {
    attempts: existing.attempts + 1,
  })
}
