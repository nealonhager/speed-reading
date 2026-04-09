import type { ReaderSettings, RsvpToken, SpineSection } from '../types'

import { curlyQuoteDialogRanges, isDialogueAt } from './dialog-context'
import { getOrpIndex } from './orp'
import { getTokenDelay } from './timing'

interface SegmentLike {
  segment: string
  index: number
  isWordLike?: boolean
}

interface MergedSegment {
  text: string
  start: number
  end: number
}

function buildFallbackSegments(text: string): SegmentLike[] {
  const segments: SegmentLike[] = []
  const pattern = /\S+/g

  for (const match of text.matchAll(pattern)) {
    segments.push({
      segment: match[0],
      index: match.index ?? 0,
      isWordLike: true,
    })
  }

  return segments
}

function segmentText(text: string): SegmentLike[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'word' })
    return Array.from(segmenter.segment(text)).map((segment) => ({
      segment: segment.segment,
      index: segment.index,
      isWordLike: segment.isWordLike,
    }))
  }

  return buildFallbackSegments(text)
}

function isPunctuationOnlySegment(segment: SegmentLike): boolean {
  return !segment.isWordLike && /^[^\p{L}\p{N}]+$/u.test(segment.segment)
}

function isOpeningBracket(char: string): boolean {
  return /^[([{<]$/u.test(char)
}

function isQuote(char: string): boolean {
  return /^['"\u2018\u2019\u201C\u201D]$/u.test(char)
}

function isLeadingCompanionChar(char: string): boolean {
  return isOpeningBracket(char) || isQuote(char)
}

/**
 * Checks whether a punctuation mark is followed by opening punctuation and then
 * a word, such as the quote in `'(word)`.
 */
function hasWrappedWordAhead(text: string, start: number): boolean {
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]!

    if (/\p{L}|\p{N}/u.test(char)) {
      return true
    }

    if (!isLeadingCompanionChar(char)) {
      return false
    }
  }

  return false
}

/**
 * Finds where a punctuation run should switch from trailing the previous token
 * to leading the next one.
 */
function getLeadingSplitIndex(text: string, rawText: string, start: number, hasPreviousToken: boolean): number {
  if (!hasPreviousToken) {
    return 0
  }

  let offset = 0

  for (const char of rawText) {
    const charStart = start + offset
    const charEnd = charStart + char.length
    const previousChar = text[charStart - 1] ?? ''
    const nextChar = text[charEnd] ?? ''
    const previousIsWord = /\p{L}|\p{N}/u.test(previousChar)
    const nextIsWord = /\p{L}|\p{N}/u.test(nextChar)

    if (nextIsWord && !previousIsWord) {
      return offset
    }

    if ((isOpeningBracket(char) || isQuote(char)) && !previousIsWord && hasWrappedWordAhead(text, charEnd)) {
      return offset
    }

    offset += char.length
  }

  return rawText.length
}

function appendToPreviousToken(merged: MergedSegment[], text: string, end: number): void {
  const previous = merged.at(-1)

  if (!previous || !text) {
    return
  }

  previous.text += text
  previous.end = end
}

function mergeSegments(text: string, segments: SegmentLike[]): MergedSegment[] {
  const merged: MergedSegment[] = []
  let pendingLeadingText = ''
  let pendingLeadingStart = 0

  for (const segment of segments) {
    if (!segment.segment.trim()) {
      continue
    }

    const rawText = segment.segment
    const start = segment.index
    const end = segment.index + rawText.length
    const punctuationOnly = isPunctuationOnlySegment(segment)

    if (punctuationOnly) {
      const leadingSplitIndex = getLeadingSplitIndex(text, rawText, start, merged.length > 0)
      const trailingText = rawText.slice(0, leadingSplitIndex)
      const leadingText = rawText.slice(leadingSplitIndex)

      appendToPreviousToken(merged, trailingText, start + trailingText.length)

      if (leadingText) {
        if (!pendingLeadingText) {
          pendingLeadingStart = start + leadingSplitIndex
        }

        pendingLeadingText += leadingText
      }

      continue
    }

    const mergedText = pendingLeadingText + text.slice(start, end)
    const mergedStart = pendingLeadingText ? pendingLeadingStart : start

    merged.push({
      text: mergedText,
      start: mergedStart,
      end,
    })

    pendingLeadingText = ''
  }

  if (pendingLeadingText) {
    appendToPreviousToken(merged, pendingLeadingText, text.length)
  }

  return merged
}

export function tokenizeSection(section: SpineSection, settings: ReaderSettings): RsvpToken[] {
  const merged = mergeSegments(section.text, segmentText(section.text))
  const dialogRanges = curlyQuoteDialogRanges(section.text)
  const tokens = merged
    .map((item, index): RsvpToken | null => {
      const normalizedText = item.text.trim()

      if (!normalizedText) {
        return null
      }

      return {
        id: `${section.id}-${index}`,
        sectionId: section.id,
        index,
        text: item.text,
        normalizedText,
        orpIndex: getOrpIndex(normalizedText, settings.fontScale),
        delayMs: getTokenDelay(normalizedText, settings),
        charStart: item.start,
        charEnd: item.end,
        isDialogue: isDialogueAt(item.start, section.blocks, dialogRanges),
        isBreak: false,
      }
    })
    .filter((token): token is RsvpToken => token !== null)

  const breakIndex = tokens.length

  tokens.push({
    id: `${section.id}-break`,
    sectionId: section.id,
    index: breakIndex,
    text: '',
    normalizedText: '',
    orpIndex: 0,
    delayMs: 500,
    charStart: section.text.length,
    charEnd: section.text.length,
    isDialogue: false,
    isBreak: true,
  })

  return tokens
}
