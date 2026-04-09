import type { TextBlock } from '../types'

/**
 * Half-open ranges [start, end) covering “…” segments (Unicode U+201C / U+201D),
 * typical for quoted speech in reflowable EPUBs.
 */
export function curlyQuoteDialogRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  let open = -1

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (c === '\u201C') {
      open = i
    } else if (c === '\u201D' && open >= 0) {
      ranges.push([open, i + 1])
      open = -1
    }
  }

  return ranges
}

export function isInsideDialogRanges(
  charIndex: number,
  ranges: ReadonlyArray<readonly [number, number]>,
): boolean {
  return ranges.some(([start, end]) => charIndex >= start && charIndex < end)
}

export function isInsideBlockquote(blocks: readonly TextBlock[], charIndex: number): boolean {
  for (const block of blocks) {
    if (block.type === 'blockquote' && charIndex >= block.start && charIndex < block.end) {
      return true
    }
  }

  return false
}

/** True when the token begins inside a blockquote or inside curly double quotes. */
export function isDialogueAt(
  charStart: number,
  blocks: readonly TextBlock[],
  curlyRanges: ReadonlyArray<readonly [number, number]>,
): boolean {
  return isInsideBlockquote(blocks, charStart) || isInsideDialogRanges(charStart, curlyRanges)
}
