import { getOrpIndex, getOrpIndexHeuristic } from './orp'

describe('getOrpIndexHeuristic', () => {
  it.each([
    ['I', 0],
    ['read', 1],
    ['quicker', 2],
    ['processing', 3],
    ['hyperconcentration', 4],
  ])('returns the expected ORP index for %s', (token, expected) => {
    expect(getOrpIndexHeuristic(token)).toBe(expected)
  })
})

describe('getOrpIndex', () => {
  it('matches the length heuristic when canvas measurement is unavailable', () => {
    expect(getOrpIndex('read', 1)).toBe(getOrpIndexHeuristic('read'))
    expect(getOrpIndex('processing', 1)).toBe(getOrpIndexHeuristic('processing'))
  })
})
