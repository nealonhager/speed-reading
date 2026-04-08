import type { SpineReference, TocItem } from '../types'

import { resolvePath, stripFragment } from './path'
import {
  childElements,
  childElementsByLocalName,
  firstChildByLocalName,
  firstDescendantByLocalName,
} from './xml'

interface NavigationInput {
  opfPath: string
  navDocument?: string
  navPath?: string
  ncxDocument?: string
  ncxPath?: string
  spine: SpineReference[]
}

function buildSpineIndex(spine: SpineReference[]): Map<string, number> {
  return new Map(spine.map((item, index) => [stripFragment(item.href), index]))
}

/** Resolves EPUB 3 landmarks `bodymatter` to a spine index, when present. */
export function landmarksBodymatterSpineIndex(
  navDocument: string,
  navPath: string,
  spine: SpineReference[],
): number | undefined {
  const spineIndexMap = buildSpineIndex(spine)
  const document = new DOMParser().parseFromString(navDocument, 'text/html')
  const landmarksNav = Array.from(document.querySelectorAll('nav')).find((node) => {
    const epubType =
      node.getAttribute('epub:type') ?? node.getAttribute('type') ?? node.getAttribute('role')
    return epubType === 'landmarks'
  })

  if (!landmarksNav) {
    return undefined
  }

  for (const anchor of landmarksNav.querySelectorAll('a[href]')) {
    const epubType = anchor.getAttribute('epub:type') ?? anchor.getAttribute('type')
    if (epubType !== 'bodymatter') {
      continue
    }

    const href = anchor.getAttribute('href')
    if (!href) {
      continue
    }

    const resolved = stripFragment(resolvePath(navPath, href))
    const index = spineIndexMap.get(resolved)

    if (index !== undefined && index >= 0) {
      return index
    }
  }

  return undefined
}

function walkNcxNavPoint(
  node: Element,
  ncxPath: string,
  spineIndexMap: Map<string, number>,
  items: TocItem[],
): string {
  const childNavPoints = childElementsByLocalName(node, 'navPoint')
  const childIds: string[] = []

  for (const child of childNavPoints) {
    const childId = walkNcxNavPoint(child, ncxPath, spineIndexMap, items)
    if (childId) {
      childIds.push(childId)
    }
  }

  const navLabel = firstChildByLocalName(node, 'navLabel')
  const label = firstDescendantByLocalName(navLabel ?? node, 'text')?.textContent?.trim()
  const src = firstChildByLocalName(node, 'content')?.getAttribute('src')

  if (!label || !src) {
    return ''
  }

  const href = resolvePath(ncxPath, src)
  const normalizedHref = stripFragment(href)
  const id = `ncx-${items.length}`

  items.push({
    id,
    label,
    href,
    spineIndex: spineIndexMap.get(normalizedHref) ?? -1,
    childrenIds: childIds,
  })

  return id
}

/** Drop parent rows that only group nested links (Parts, Books), keeping leaf targets. */
function preferLeafNavEntries(items: TocItem[]): TocItem[] {
  const leaves = items.filter((item) => item.childrenIds.length === 0)
  return leaves.length > 0 ? leaves : items
}

function linearSpineCount(spine: SpineReference[]): number {
  return spine.filter((item) => item.linear).length
}

/**
 * Many converter EPUBs ship a broken or stub NCX (e.g. one bogus navPoint). If the TOC is far
 * smaller than the linear spine, fall back to one entry per spine item.
 */
function shouldReplaceWithSyntheticToc(spine: SpineReference[], tocEntryCount: number): boolean {
  const n = linearSpineCount(spine)

  if (tocEntryCount === 0 || n <= 2) {
    return false
  }

  if (tocEntryCount >= n) {
    return false
  }

  if (tocEntryCount <= 1 && n >= 5) {
    return true
  }

  return tocEntryCount / n < 0.12
}

function flattenNavList(
  list: Element,
  sourcePath: string,
  spineIndexMap: Map<string, number>,
  items: TocItem[],
): string[] {
  const ids: string[] = []
  const directItems = childElementsByLocalName(list, 'li')

  directItems.forEach((item, index) => {
    const link =
      childElements(item).find((node) => node.localName === 'a' || node.localName === 'span') ??
      null
    const label = link?.textContent?.trim()

    if (!label) {
      return
    }

    const hrefValue = link?.getAttribute('href')
    const href = hrefValue
      ? resolvePath(sourcePath, hrefValue)
      : ''
    const normalizedHref = stripFragment(href)
    const childList =
      childElements(item).find((node) => node.localName === 'ol' || node.localName === 'ul') ??
      null
    const id = `${items.length + index}`
    const childIds = childList
      ? flattenNavList(childList, sourcePath, spineIndexMap, items)
      : []

    ids.push(id)
    items.push({
      id,
      label,
      href: href || normalizedHref,
      spineIndex: spineIndexMap.get(normalizedHref) ?? -1,
      childrenIds: childIds,
    })
  })

  return ids
}

export function parseNavigation({
  opfPath,
  navDocument,
  navPath,
  ncxDocument,
  ncxPath,
  spine,
}: NavigationInput): TocItem[] {
  const spineIndexMap = buildSpineIndex(spine)

  if (navDocument && navPath) {
    const document = new DOMParser().parseFromString(navDocument, 'text/html')
    const navCandidates = Array.from(document.querySelectorAll('nav'))
    const navNode = navCandidates.find((node) => {
      const epubType =
        node.getAttribute('epub:type') ??
        node.getAttribute('type') ??
        node.getAttribute('role')
      return epubType === 'toc'
    }) ?? (navCandidates.length === 1 ? navCandidates[0] : null)

    if (navNode) {
      const list = firstChildByLocalName(navNode, 'ol') ?? firstChildByLocalName(navNode, 'ul')

      if (list) {
        const items: TocItem[] = []
        flattenNavList(list, navPath, spineIndexMap, items)
        const filtered = items.filter((item) => item.spineIndex >= 0)

        if (filtered.length > 0) {
          const toc = preferLeafNavEntries(filtered)
          if (!shouldReplaceWithSyntheticToc(spine, toc.length)) {
            return toc
          }
        }
      }
    }
  }

  if (ncxDocument && ncxPath) {
    const document = new DOMParser().parseFromString(ncxDocument, 'application/xml')
    const items: TocItem[] = []
    const navMap = firstDescendantByLocalName(document, 'navMap')
    const roots = navMap ? childElementsByLocalName(navMap, 'navPoint') : []

    for (const root of roots) {
      walkNcxNavPoint(root, ncxPath, spineIndexMap, items)
    }

    const filtered = items.filter((item) => item.spineIndex >= 0)

    if (filtered.length > 0) {
      const toc = preferLeafNavEntries(filtered)
      if (!shouldReplaceWithSyntheticToc(spine, toc.length)) {
        return toc
      }
    }
  }

  return synthesizeNavigation(spine, opfPath)
}

export function synthesizeNavigation(spine: SpineReference[], opfPath: string): TocItem[] {
  return spine.map((item, index) => ({
    id: `spine-${item.id}`,
    label: item.label || `Chapter ${index + 1}`,
    href: resolvePath(opfPath, item.href),
    spineIndex: index,
    childrenIds: [],
  }))
}
