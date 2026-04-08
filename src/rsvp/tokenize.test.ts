import { DEFAULT_SETTINGS } from '../state/storage'
import type { SpineSection } from '../types'
import { tokenizeSection } from './tokenize'

const section: SpineSection = {
  id: 'section-1',
  href: 'chapter1.xhtml',
  label: 'Chapter 1',
  order: 0,
  rawHtmlPath: 'chapter1.xhtml',
  text: `Don't rush.\n\nRead steadily.`,
  blocks: [],
  anchors: {},
}

describe('tokenizeSection', () => {
  it('keeps contractions, strips whitespace-only tokens, and appends a break token', () => {
    const tokens = tokenizeSection(section, DEFAULT_SETTINGS)

    expect(tokens.map((token) => token.normalizedText)).toEqual([
      "Don't",
      'rush.',
      'Read',
      'steadily.',
      '',
    ])
    expect(tokens.at(-1)?.isBreak).toBe(true)
  })
})
