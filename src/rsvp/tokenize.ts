import type { ReaderSettings, RsvpToken, SpineSection } from '../types'

import { getOrpIndex } from './orp'
import { getTokenDelay } from './timing'

interface SegmentLike {
  segment: string
  index: number
  isWordLike?: boolean
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

function mergeSegments(text: string, segments: SegmentLike[]): Array<{ text: string; start: number; end: number }> {
  const merged: Array<{ text: string; start: number; end: number }> = []

  for (const segment of segments) {
    if (!segment.segment.trim()) {
      continue
    }

    const rawText = segment.segment
    const start = segment.index
    const end = segment.index + rawText.length
    const punctuationOnly = !segment.isWordLike && /^[^\p{L}\p{N}]+$/u.test(rawText)

    if (punctuationOnly && merged.length > 0) {
      const previous = merged[merged.length - 1]
      previous.text += rawText
      previous.end = end
      continue
    }

    merged.push({
      text: text.slice(start, end),
      start,
      end,
    })
  }

  return merged
}

export function tokenizeSection(section: SpineSection, settings: ReaderSettings): RsvpToken[] {
  const merged = mergeSegments(section.text, segmentText(section.text))
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
        orpIndex: getOrpIndex(normalizedText),
        delayMs: getTokenDelay(normalizedText, settings),
        charStart: item.start,
        charEnd: item.end,
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
    isBreak: true,
  })

  return tokens
}
