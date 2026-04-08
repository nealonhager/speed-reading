import { DEFAULT_SETTINGS } from '../state/storage'
import { getTokenDelay } from './timing'

describe('getTokenDelay', () => {
  it('applies punctuation and long word timing adjustments', () => {
    expect(getTokenDelay('reading,', DEFAULT_SETTINGS)).toBe(354)
    expect(getTokenDelay('EXPERIENCES!', DEFAULT_SETTINGS)).toBe(637)
  })
})
