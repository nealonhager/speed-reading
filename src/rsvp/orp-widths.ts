import type { PreparedTextWithSegments } from '@chenglou/pretext'

/**
 * Flatten prepared text into per-grapheme advances (CSS letter-spacing applied separately).
 */
export function collectGraphemeWidthsFromPrepared(
  prepared: PreparedTextWithSegments,
): number[] {
  const out: number[] = []
  const { widths, kinds, breakableFitAdvances } = prepared

  for (let i = 0; i < widths.length; i++) {
    if (kinds[i] !== 'text') {
      continue
    }
    const advances = breakableFitAdvances[i]
    if (advances && advances.length > 0) {
      for (const w of advances) {
        out.push(w)
      }
    } else {
      out.push(widths[i]!)
    }
  }

  return out
}

/**
 * Pick the grapheme index whose visual midpoint is closest to half the total inline width,
 * including uniform letter-spacing between graphemes (CSS `letter-spacing`).
 */
export function orpGraphemeIndexFromWidths(
  widths: readonly number[],
  letterSpacingPx: number,
): number {
  const n = widths.length
  if (n <= 1) {
    return 0
  }

  const body = widths.reduce((sum, w) => sum + w, 0)
  const total = body + (n - 1) * letterSpacingPx
  const half = total / 2

  let best = 0
  let bestDist = Infinity
  let start = 0

  for (let i = 0; i < n; i++) {
    const mid = start + widths[i]! / 2
    const dist = Math.abs(mid - half)
    if (dist < bestDist || (dist === bestDist && i < best)) {
      bestDist = dist
      best = i
    }
    start += widths[i]! + letterSpacingPx
  }

  return best
}

export function graphemeIndexToCodeUnitStart(text: string, graphemeIndex: number): number {
  if (graphemeIndex <= 0) {
    return 0
  }

  if (typeof Intl === 'undefined' || !('Segmenter' in Intl)) {
    return Math.min(graphemeIndex, text.length)
  }

  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  let i = 0
  for (const segment of segmenter.segment(text)) {
    if (i === graphemeIndex) {
      return segment.index
    }
    i += 1
  }

  return text.length
}

/** Split a word for RSVP display; `orpCodeUnitStart` must be a grapheme boundary. */
export function splitAtOrpGrapheme(
  text: string,
  orpCodeUnitStart: number,
): { before: string; focus: string; after: string } {
  if (!text) {
    return { before: '', focus: '', after: '' }
  }

  if (typeof Intl === 'undefined' || !('Segmenter' in Intl)) {
    const focus = text[orpCodeUnitStart] ?? ''
    const restStart = orpCodeUnitStart + focus.length
    return {
      before: text.slice(0, orpCodeUnitStart),
      focus,
      after: text.slice(restStart),
    }
  }

  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  let before = ''
  let focus = ''
  let after = ''
  let seenFocus = false

  for (const segment of segmenter.segment(text)) {
    if (!seenFocus) {
      if (segment.index < orpCodeUnitStart) {
        before += segment.segment
        continue
      }
      focus = segment.segment
      seenFocus = true
      continue
    }
    after += segment.segment
  }

  if (!seenFocus) {
    return { before: text, focus: '', after: '' }
  }

  return { before, focus, after }
}
