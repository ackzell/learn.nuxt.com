import { describe, expect, it } from 'vitest'
import { shuffleList } from '../lib/shuffle'

describe('shuffleList', () => {
  it('returns all original items', () => {
    const result = shuffleList([1, 2, 3, 4, 5])
    expect(result.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('preserves length', () => {
    expect(shuffleList(['a']).length).toBe(1)
    expect(shuffleList(['a', 'b']).length).toBe(2)
    expect(shuffleList([]).length).toBe(0)
  })

  it('does not mutate the original array', () => {
    const original = [1, 2, 3]
    shuffleList(original)
    expect(original).toEqual([1, 2, 3])
  })

  it('returns identity when rand always yields the current index', () => {
    const result = shuffleList([1, 2, 3, 4], () => 0.999)
    expect(result).toEqual([1, 2, 3, 4])
  })

  it('reverses when rand always yields index 0', () => {
    const result = shuffleList([1, 2, 3], () => 0.001)
    expect(result).toEqual([2, 3, 1])
  })

  it('is deterministic for the same rand source', () => {
    const a = shuffleList(['x', 'y', 'z'], () => 0.4)
    const b = shuffleList(['x', 'y', 'z'], () => 0.4)
    expect(a).toEqual(b)
  })
})
