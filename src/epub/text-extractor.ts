import type { SpineReference, SpineSection, TextBlock, TextBlockType } from '../types'

const SKIP_TAGS = new Set([
  'audio',
  'canvas',
  'figure',
  'footer',
  'form',
  'head',
  'header',
  'iframe',
  'img',
  'input',
  'math',
  'nav',
  'noscript',
  'object',
  'picture',
  'script',
  'select',
  'style',
  'svg',
  'textarea',
  'video',
])

const BLOCK_TYPE_BY_TAG: Record<string, TextBlockType> = {
  blockquote: 'paragraph',
  div: 'paragraph',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  li: 'listItem',
  p: 'paragraph',
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function noteLike(node: Element): boolean {
  const attrs = [
    node.getAttribute('epub:type'),
    node.getAttribute('role'),
    node.getAttribute('class'),
    node.getAttribute('id'),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return /(footnote|endnote|noteref|note|pagebreak|page-break)/.test(attrs)
}

function shouldSkipElement(node: Element): boolean {
  const tagName = node.tagName.toLowerCase()

  if (SKIP_TAGS.has(tagName)) {
    return true
  }

  if (node.getAttribute('hidden') !== null || node.getAttribute('aria-hidden') === 'true') {
    return true
  }

  return noteLike(node)
}

function hasNestedBlocks(node: Element): boolean {
  return Array.from(node.children).some((child) => child.tagName.toLowerCase() in BLOCK_TYPE_BY_TAG)
}

export function extractReadableText(html: string, spineItem: SpineReference): SpineSection {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const body = document.body

  if (!body) {
    throw new Error(`The section "${spineItem.label}" is missing a readable body.`)
  }

  const blocks: TextBlock[] = []
  const anchors: Record<string, number> = {}
  const parts: string[] = []
  const pendingAnchors: string[] = []
  let cursor = 0

  const queueAnchors = (node: Element) => {
    const candidates = [node.getAttribute('id'), node.getAttribute('name')]

    for (const candidate of candidates) {
      if (!candidate || candidate in anchors || pendingAnchors.includes(candidate)) {
        continue
      }

      pendingAnchors.push(candidate)
    }
  }

  const flushAnchors = (position: number) => {
    while (pendingAnchors.length > 0) {
      const anchor = pendingAnchors.shift()

      if (!anchor || anchor in anchors) {
        continue
      }

      anchors[anchor] = position
    }
  }

  const appendBlock = (text: string, type: TextBlockType) => {
    const normalized = normalizeWhitespace(text)

    if (!normalized) {
      return
    }

    if (parts.length > 0) {
      parts.push('\n\n')
      cursor += 2
    }

    const start = cursor
    flushAnchors(start)
    parts.push(normalized)
    cursor += normalized.length
    blocks.push({
      type,
      start,
      end: cursor,
    })
  }

  const visit = (node: Element) => {
    if (shouldSkipElement(node)) {
      return
    }

    queueAnchors(node)
    const tagName = node.tagName.toLowerCase()
    const blockType = BLOCK_TYPE_BY_TAG[tagName]

    if (blockType) {
      if (tagName === 'div' && hasNestedBlocks(node)) {
        Array.from(node.children).forEach((child) => visit(child))
        return
      }

      appendBlock(node.textContent ?? '', blockType)
      return
    }

    Array.from(node.children).forEach((child) => visit(child))
  }

  Array.from(body.children).forEach((child) => visit(child))

  const text = parts.join('')

  if (!text) {
    throw new Error(`No readable text could be extracted from "${spineItem.label}".`)
  }

  return {
    id: spineItem.id,
    href: spineItem.href,
    label: spineItem.label,
    order: spineItem.order,
    rawHtmlPath: spineItem.rawHtmlPath,
    text,
    blocks,
    anchors,
  }
}
