import type { TextBlock } from '../types'

import {
  curlyQuoteDialogRanges,
  isDialogueAt,
  isInsideBlockquote,
  isInsideDialogRanges,
} from './dialog-context'

describe('curlyQuoteDialogRanges', () => {
  it('returns ranges for paired curly double quotes', () => {
    const text = 'He said \u201CHello\u201D to me.'
    expect(curlyQuoteDialogRanges(text)).toEqual([[8, 15]])
  })

  it('handles multiple quoted spans', () => {
    const text = '\u201CA\u201D then \u201CB\u201D'
    expect(curlyQuoteDialogRanges(text)).toEqual([
      [0, 3],
      [9, 12],
    ])
  })

  it('ignores unclosed open quote', () => {
    const text = 'Start \u201Cno end'
    expect(curlyQuoteDialogRanges(text)).toEqual([])
  })
})

describe('isInsideDialogRanges', () => {
  const ranges: Array<[number, number]> = [[10, 20]]

  it('is true inside a range', () => {
    expect(isInsideDialogRanges(10, ranges)).toBe(true)
    expect(isInsideDialogRanges(15, ranges)).toBe(true)
    expect(isInsideDialogRanges(19, ranges)).toBe(true)
  })

  it('is false on the closing boundary', () => {
    expect(isInsideDialogRanges(20, ranges)).toBe(false)
  })

  it('is false outside', () => {
    expect(isInsideDialogRanges(9, ranges)).toBe(false)
  })
})

describe('isInsideBlockquote', () => {
  const blocks: TextBlock[] = [
    { type: 'paragraph', start: 0, end: 5 },
    { type: 'blockquote', start: 7, end: 20 },
  ]

  it('detects indices inside a blockquote block', () => {
    expect(isInsideBlockquote(blocks, 7)).toBe(true)
    expect(isInsideBlockquote(blocks, 10)).toBe(true)
    expect(isInsideBlockquote(blocks, 19)).toBe(true)
    expect(isInsideBlockquote(blocks, 20)).toBe(false)
    expect(isInsideBlockquote(blocks, 3)).toBe(false)
  })
})

describe('isDialogueAt', () => {
  it('is true inside blockquote even without curly quotes', () => {
    const text = 'Narration.\n\nInner line.'
    const innerStart = text.indexOf('Inner')
    const blocks: TextBlock[] = [
      { type: 'paragraph', start: 0, end: innerStart },
      { type: 'blockquote', start: innerStart, end: text.length },
    ]
    expect(isDialogueAt(innerStart, blocks, [])).toBe(true)
    expect(isDialogueAt(0, blocks, [])).toBe(false)
  })

  it('is true inside curly quotes even without blockquote blocks', () => {
    const text = 'He said \u201CYes\u201D'
    const ranges = curlyQuoteDialogRanges(text)
    const yesStart = text.indexOf('Yes')
    expect(isDialogueAt(yesStart, [], ranges)).toBe(true)
    expect(isDialogueAt(0, [], ranges)).toBe(false)
  })
})
