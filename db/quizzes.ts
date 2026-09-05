import type { Observable } from 'dexie'
import type { QuizRecord, QuizStatus } from '@/db'
import { liveQuery } from 'dexie'
import { db } from '@/db'

export const quizzes = {
  getByName,
  recordPass,
  recordAttempt,
  liveQueryQuizzes,
  liveQueryQuizByName,
}

async function getByName(sessionName: string): Promise<QuizRecord | undefined> {
  return db.quizzes.where('sessionName').equals(sessionName).first()
}

/**
 * Emits only `passed` quizzes. Progress indicators must not light up for a
 * failed or partially-correct attempt.
 */
function liveQueryQuizzes(): Observable<QuizRecord[]> {
  return liveQuery(async () => db.quizzes.where('status').equals('passed').toArray())
}

function liveQueryQuizByName(sessionName: string): Observable<QuizRecord | undefined> {
  return liveQuery(async () => db.quizzes.where('sessionName').equals(sessionName).first())
}

/**
 * Upserts one submission outcome for a session, bumping the attempt counter
 * and tracking the best percentage score ever achieved. `status === 'passed'`
 * records a `passedAt` timestamp.
 */
async function upsertScore(
  sessionName: string,
  score: number,
  status: QuizStatus,
): Promise<void> {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)))
  const existing = await getByName(sessionName)
  const attempts = (existing?.attempts ?? 0) + 1
  const bestScore = Math.max(existing?.bestScore ?? 0, clampedScore)

  if (existing) {
    const patch: Partial<QuizRecord> = { status, attempts, bestScore }
    if (status === 'passed')
      patch.passedAt = new Date()
    await db.quizzes.update(existing.id, patch)
  }
  else {
    await db.quizzes.add({
      sessionName,
      status,
      attempts,
      bestScore,
      passedAt: status === 'passed' ? new Date() : undefined,
    })
  }
}

/** Record a passing submission (score is the 0-100 percentage achieved). */
async function recordPass(sessionName: string, score: number): Promise<void> {
  await upsertScore(sessionName, score, 'passed')
}

/** Record a failing submission (score is the 0-100 percentage achieved). */
async function recordAttempt(sessionName: string, score: number): Promise<void> {
  await upsertScore(sessionName, score, 'failed')
}
