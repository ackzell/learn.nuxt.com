/**
 * Fisher–Yates shuffle. Returns a new array with the items reordered; the
 * source array is left untouched. A `rand` source can be injected so tests and
 * future SSR seeding stay deterministic.
 */
export function shuffleList<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}
