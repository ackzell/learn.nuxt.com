/**
 * The per-locale, display-only strings for one challenge check, keyed by the
 * check id the author assigns in the bank's `suite.*` (the first argument to
 * `check(<id>, ...)`). The check's `name` (defaults to the id when missing)
 * and `hint` are injected into the mounted `__challenge__/suite.*` at build
 * time — authors never write specs per locale.
 */
export interface ChallengeCheckStrings {
  name: string
  hint?: string
}

/**
 * Per-locale strings for one challenge bank entry, mirroring `QuizStrings`:
 * the same directory is authored in `challenges/<id>/<locale>.yaml` under a
 * top-level key equal to the bank id (the quiz convention).
 */
export interface ChallengeStrings {
  checks: Record<string, ChallengeCheckStrings>
}
