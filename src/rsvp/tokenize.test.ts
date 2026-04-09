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
    expect(tokens.every((t) => !t.isDialogue || t.isBreak)).toBe(true)
  })

  it('marks tokens inside curly quotes as dialogue', () => {
    const quoted: SpineSection = {
      ...section,
      text: 'He said \u201CHi there\u201D now.',
    }
    const tokens = tokenizeSection(quoted, DEFAULT_SETTINGS)
    const words = tokens.filter((t) => !t.isBreak)
    const dialogueFlags = words.map((t) => t.isDialogue)
    expect(dialogueFlags.some(Boolean)).toBe(true)
    expect(words.find((t) => t.normalizedText === 'Hi')?.isDialogue).toBe(true)
    const thereToken = words.find((t) => /^there/.test(t.normalizedText))
    expect(thereToken?.isDialogue).toBe(true)
    expect(words.find((t) => t.normalizedText === 'now.')?.isDialogue).toBe(false)
    expect(words[0]?.isDialogue).toBe(false)
  })

  it('marks tokens inside blockquote blocks as dialogue', () => {
    const text = 'Before.\n\nQuoted line here.'
    const bqStart = text.indexOf('Quoted')
    const withBlocks: SpineSection = {
      ...section,
      text,
      blocks: [
        { type: 'paragraph', start: 0, end: 7 },
        { type: 'blockquote', start: bqStart, end: text.length },
      ],
    }
    const tokens = tokenizeSection(withBlocks, DEFAULT_SETTINGS)
    const quotedTokens = tokens.filter((t) => !t.isBreak && t.normalizedText.startsWith('Quoted'))
    expect(quotedTokens).toHaveLength(1)
    expect(quotedTokens[0]!.isDialogue).toBe(true)
    const beforeTokens = tokens.filter((t) => !t.isBreak && t.normalizedText === 'Before.')
    expect(beforeTokens[0]!.isDialogue).toBe(false)
  })
})
