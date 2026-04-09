import {
  graphemeIndexToCodeUnitStart,
  orpGraphemeIndexFromWidths,
  splitAtOrpGrapheme,
} from './orp-widths'

describe('orpGraphemeIndexFromWidths', () => {
  it('uses index 0 for a single grapheme', () => {
    expect(orpGraphemeIndexFromWidths([12], 0)).toBe(0)
  })

  it('picks the middle for equal widths with zero letter-spacing', () => {
    expect(orpGraphemeIndexFromWidths([10, 10, 10, 10], 0)).toBe(1)
    expect(orpGraphemeIndexFromWidths([10, 10, 10, 10, 10], 0)).toBe(2)
  })

  it('shifts ORP left when the first glyph is much wider (length-based would stay fixed)', () => {
    // Four letters; length heuristic for length 4 picks index 1.
    // Here the first glyph dominates width, so the visual midpoint falls in the first letter.
    const letterSpacing = -2
    expect(orpGraphemeIndexFromWidths([40, 5, 5, 5], letterSpacing)).toBe(0)
  })

  it('shifts ORP right when the last glyphs carry most of the width', () => {
    const letterSpacing = 0
    expect(orpGraphemeIndexFromWidths([5, 5, 5, 40], letterSpacing)).toBe(3)
  })
})

describe('graphemeIndexToCodeUnitStart', () => {
  it('maps grapheme indices to UTF-16 start offsets', () => {
    expect(graphemeIndexToCodeUnitStart('read', 2)).toBe(2)
  })

  it('handles supplementary-plane emoji as one grapheme', () => {
    const text = 'a😀b'
    expect(graphemeIndexToCodeUnitStart(text, 1)).toBe(1)
    expect(graphemeIndexToCodeUnitStart(text, 2)).toBe(3)
  })
})

describe('splitAtOrpGrapheme', () => {
  it('splits at a grapheme boundary', () => {
    expect(splitAtOrpGrapheme('read', 2)).toEqual({
      before: 're',
      focus: 'a',
      after: 'd',
    })
  })

  it('keeps multi-code-unit graphemes in the focus span', () => {
    const text = 'a😀b'
    const start = graphemeIndexToCodeUnitStart(text, 1)
    expect(splitAtOrpGrapheme(text, start)).toEqual({
      before: 'a',
      focus: '😀',
      after: 'b',
    })
  })
})
