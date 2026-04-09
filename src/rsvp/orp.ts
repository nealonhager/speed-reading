import { prepareWithSegments } from '@chenglou/pretext'

import {
  collectGraphemeWidthsFromPrepared,
  focusTranslateXFromWidths,
  graphemeIndexToCodeUnitStart,
  orpGraphemeIndexFromWidths,
  splitAtOrpGrapheme,
} from './orp-widths'
import { rsvpDisplayCanvasFont, rsvpDisplayLetterSpacingPx } from './rsvp-display-font'

let canvasMeasureAvailable: boolean | null = null

function canUseCanvasMeasureText(): boolean {
  if (canvasMeasureAvailable !== null) {
    return canvasMeasureAvailable
  }
  if (typeof document === 'undefined') {
    canvasMeasureAvailable = false
    return false
  }
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) {
    canvasMeasureAvailable = false
    return false
  }
  ctx.font = '16px serif'
  canvasMeasureAvailable = ctx.measureText('x').width > 0
  return canvasMeasureAvailable
}

/** Length-based fallback when canvas measurement is unavailable (e.g. tests). */
export function getOrpIndexHeuristic(text: string): number {
  const length = text.length

  if (length <= 1) {
    return 0
  }

  if (length <= 5) {
    return 1
  }

  if (length <= 9) {
    return 2
  }

  if (length <= 13) {
    return 3
  }

  return Math.min(4, length - 1)
}

function codeUnitStartToGraphemeIndex(text: string, codeUnitStart: number): number {
  if (codeUnitStart <= 0) {
    return 0
  }

  if (typeof Intl === 'undefined' || !('Segmenter' in Intl)) {
    return Math.min(codeUnitStart, text.length)
  }

  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  let graphemeIndex = 0
  for (const segment of segmenter.segment(text)) {
    if (segment.index >= codeUnitStart) {
      return graphemeIndex
    }
    graphemeIndex += 1
  }

  return graphemeIndex
}

/**
 * Pixel offset that aligns the ORP grapheme midpoint with the display centerline.
 */
export function getOrpCenterShiftPx(
  text: string,
  fontScale: number,
  orpCodeUnitStart: number,
): number {
  if (!text) {
    return 0
  }

  const focusGraphemeIndex = codeUnitStartToGraphemeIndex(text, orpCodeUnitStart)
  const letterSpacingPx = rsvpDisplayLetterSpacingPx(fontScale)

  if (!canUseCanvasMeasureText()) {
    const graphemeCount = Math.max(1, codeUnitStartToGraphemeIndex(text, text.length))
    return focusTranslateXFromWidths(new Array<number>(graphemeCount).fill(1), focusGraphemeIndex, letterSpacingPx)
  }

  try {
    const prepared = prepareWithSegments(text, rsvpDisplayCanvasFont(fontScale))
    const widths = collectGraphemeWidthsFromPrepared(prepared)
    return focusTranslateXFromWidths(widths, focusGraphemeIndex, letterSpacingPx)
  } catch {
    return 0
  }
}

function getTypographicOrpCodeUnitIndex(text: string, fontScale: number): number | null {
  const font = rsvpDisplayCanvasFont(fontScale)
  const letterSpacingPx = rsvpDisplayLetterSpacingPx(fontScale)
  const prepared = prepareWithSegments(text, font)
  const widths = collectGraphemeWidthsFromPrepared(prepared)

  if (widths.length === 0) {
    return 0
  }

  const graphemeIndex = orpGraphemeIndexFromWidths(widths, letterSpacingPx)
  return graphemeIndexToCodeUnitStart(text, graphemeIndex)
}

/** Code unit index at the start of the ORP grapheme (use with `splitAtOrpGrapheme`). */
export function getOrpIndex(text: string, fontScale: number): number {
  if (!text) {
    return 0
  }

  if (!canUseCanvasMeasureText()) {
    return getOrpIndexHeuristic(text)
  }

  try {
    const idx = getTypographicOrpCodeUnitIndex(text, fontScale)
    if (idx !== null && idx >= 0 && idx <= text.length) {
      return idx
    }
  } catch {
    // Canvas / measurement unavailable (typical in jsdom).
  }

  return getOrpIndexHeuristic(text)
}

export { splitAtOrpGrapheme }
