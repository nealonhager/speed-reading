import type { BookAsset, SpineSection, TextBlock } from '../types'

function decodeFragment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function trimRange(text: string, start: number, end: number): [number, number] {
  let nextStart = start
  let nextEnd = end

  while (nextStart < nextEnd && /\s/.test(text[nextStart] ?? '')) {
    nextStart += 1
  }

  while (nextEnd > nextStart && /\s/.test(text[nextEnd - 1] ?? '')) {
    nextEnd -= 1
  }

  return [nextStart, nextEnd]
}

function sliceBlocks(blocks: TextBlock[], start: number, end: number): TextBlock[] {
  return blocks
    .filter((block) => block.end > start && block.start < end)
    .map((block) => ({
      ...block,
      start: Math.max(block.start, start) - start,
      end: Math.min(block.end, end) - start,
    }))
}

export function deriveReaderSections(book: BookAsset, sourceSections: SpineSection[]): SpineSection[] {
  const derivedSections: SpineSection[] = []

  for (const sourceSection of sourceSections) {
    const tocItems = book.toc
      .filter((item) => item.spineIndex === sourceSection.order)
      .map((item, index) => {
        const fragment = item.href.split('#')[1]
        const anchorName = fragment ? decodeFragment(fragment) : ''
        const anchorOffset =
          anchorName === ''
            ? 0
            : sourceSection.anchors[anchorName]

        return {
          item,
          index,
          start: anchorOffset,
        }
      })
      .filter((entry) => entry.start !== undefined)
      .sort((left, right) => left.start - right.start || left.index - right.index)

    const uniqueTocItems = tocItems.filter(
      (entry, index) =>
        index === 0 ||
        entry.start !== tocItems[index - 1].start ||
        entry.item.label !== tocItems[index - 1].item.label,
    )

    if (uniqueTocItems.length <= 1) {
      if (uniqueTocItems[0]) {
        const onlyItem = uniqueTocItems[0]
        const hasFragment = onlyItem.item.href.includes('#')

        if (hasFragment && onlyItem.start > 0) {
          const [sliceStart, sliceEnd] = trimRange(
            sourceSection.text,
            onlyItem.start,
            sourceSection.text.length,
          )

          derivedSections.push({
            ...sourceSection,
            id: `${sourceSection.id}::${onlyItem.item.id}`,
            label: onlyItem.item.label,
            href: onlyItem.item.href,
            text: sourceSection.text.slice(sliceStart, sliceEnd),
            blocks: sliceBlocks(sourceSection.blocks, sliceStart, sliceEnd),
            anchors: {},
          })
          continue
        }

        derivedSections.push({
          ...sourceSection,
          label: onlyItem.item.label,
          href: onlyItem.item.href,
        })
        continue
      }

      derivedSections.push(sourceSection)
      continue
    }

    for (let index = 0; index < uniqueTocItems.length; index += 1) {
      const current = uniqueTocItems[index]
      const next = uniqueTocItems[index + 1]
      const [sliceStart, sliceEnd] = trimRange(
        sourceSection.text,
        current.start,
        next?.start ?? sourceSection.text.length,
      )

      if (sliceEnd <= sliceStart) {
        continue
      }

      derivedSections.push({
        id: `${sourceSection.id}::${current.item.id}`,
        href: current.item.href,
        label: current.item.label,
        order: derivedSections.length,
        rawHtmlPath: sourceSection.rawHtmlPath,
        text: sourceSection.text.slice(sliceStart, sliceEnd),
        blocks: sliceBlocks(sourceSection.blocks, sliceStart, sliceEnd),
        anchors: {},
      })
    }
  }

  return derivedSections
}
