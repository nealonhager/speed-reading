import { getOrpIndex } from './orp'

describe('getOrpIndex', () => {
  it.each([
    ['I', 0],
    ['read', 1],
    ['quicker', 2],
    ['processing', 3],
    ['hyperconcentration', 4],
  ])('returns the expected ORP index for %s', (token, expected) => {
    expect(getOrpIndex(token)).toBe(expected)
  })
})
