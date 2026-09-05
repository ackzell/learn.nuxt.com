import type { EntityTable } from 'dexie'
import Dexie from 'dexie'

export interface Session {
  id: number
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SnapshotType = 'manual' | 'auto' | 'periodic'

export interface Snapshot {
  id: number
  sessionId: number
  files: Record<string, string>
  createdAt: Date
  type: SnapshotType
  message: string
}

export type ChallengeStatus = 'passed' | 'failed'

export interface Challenge {
  id: number
  /** Matches `GuideMeta.sessionName` so it is stable across renames. */
  sessionName: string
  status: ChallengeStatus
  /** Set when the challenge was last marked as completed (status === 'passed'). */
  passedAt?: Date
  /** Running count of validation attempts (passes and failures). */
  attempts: number
}

export type QuizStatus = 'passed' | 'failed'

export interface QuizRecord {
  id: number
  /** Page path of the lesson hosting the quiz (or an explicit sessionName override). */
  sessionName: string
  status: QuizStatus
  /** Set when the quiz was last passed (status === 'passed'). */
  passedAt?: Date
  /** Running count of submissions (passes and failures). */
  attempts: number
  /** Best percentage score (0-100) achieved across attempts. */
  bestScore: number
}

const db = new Dexie('AmoxtliVueDB') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  snapshots: EntityTable<Snapshot, 'id'>
  challenges: EntityTable<Challenge, 'id'>
  quizzes: EntityTable<QuizRecord, 'id'>
}

db.version(1).stores({
  sessions: '++id, name, createdAt, updatedAt',
  snapshots: '++id, sessionId, files, createdAt, type, message',
})

db.version(2).stores({
  sessions: '++id, name, createdAt, updatedAt',
  snapshots: '++id, sessionId, files, createdAt, type, message',
  challenges: '++id, sessionName, status, passedAt, attempts',
})

db.version(3).stores({
  sessions: '++id, name, createdAt, updatedAt',
  snapshots: '++id, sessionId, files, createdAt, type, message',
  challenges: '++id, sessionName, status, passedAt, attempts',
  quizzes: '++id, sessionName, status, passedAt, attempts, bestScore',
})

export { db }
