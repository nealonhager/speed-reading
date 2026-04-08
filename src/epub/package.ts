import type { SpineReference } from '../types'

import { basename, resolvePath, stripFragment } from './path'
import {
  childElementsByLocalName,
  descendantElementsByLocalName,
  firstDescendantByLocalName,
  textFromFirstDescendant,
} from './xml'

interface PackageMetadata {
  title: string
  author: string
  language: string
}

interface ManifestItem {
  id: string
  href: string
  mediaType: string
  properties: string[]
}

interface ParsedPackage {
  metadata: PackageMetadata
  spine: SpineReference[]
  navPath?: string
  ncxPath?: string
  isFixedLayout: boolean
  /** Resolved package path to OPF guide start-of-text hint, if any. */
  guideStartPath?: string
}

function parseManifest(document: Document, opfPath: string): Map<string, ManifestItem> {
  const manifest = new Map<string, ManifestItem>()
  const manifestNode = firstDescendantByLocalName(document, 'manifest')

  if (!manifestNode) {
    return manifest
  }

  for (const item of childElementsByLocalName(manifestNode, 'item')) {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    const mediaType = item.getAttribute('media-type')

    if (!id || !href || !mediaType) {
      continue
    }

    manifest.set(id, {
      id,
      href,
      mediaType,
      properties: (item.getAttribute('properties') ?? '')
        .split(/\s+/)
        .filter(Boolean),
    })
  }

  for (const entry of manifest.values()) {
    entry.href = resolvePath(opfPath, entry.href)
  }

  return manifest
}

function parseGuideStartPath(document: Document, opfPath: string): string | undefined {
  const guide = firstDescendantByLocalName(document, 'guide')

  if (!guide) {
    return undefined
  }

  const refs = childElementsByLocalName(guide, 'reference')

  for (const type of ['bodymatter', 'text'] as const) {
    const match = refs.find((ref) => ref.getAttribute('type')?.toLowerCase() === type)
    const href = match?.getAttribute('href')

    if (href) {
      return stripFragment(resolvePath(opfPath, href))
    }
  }

  return undefined
}

export function parsePackageDocument(opfXml: string, opfPath: string): ParsedPackage {
  const document = new DOMParser().parseFromString(opfXml, 'application/xml')
  const packageNode = firstDescendantByLocalName(document, 'package')

  if (!packageNode) {
    throw new Error('The EPUB package document could not be parsed.')
  }

  const metadata = {
    title: textFromFirstDescendant(document, ['title']) || basename(opfPath),
    author: textFromFirstDescendant(document, ['creator']) || 'Unknown author',
    language: textFromFirstDescendant(document, ['language']) || 'en',
  }

  const manifest = parseManifest(document, opfPath)
  const spineNode = firstDescendantByLocalName(document, 'spine')
  const tocId =
    spineNode?.getAttribute('toc') ??
    Array.from(manifest.values()).find((item) => item.mediaType === 'application/x-dtbncx+xml')?.id
  const navPath = Array.from(manifest.values()).find((item) =>
    item.properties.includes('nav'),
  )?.href
  const ncxPath = tocId ? manifest.get(tocId)?.href : undefined
  const renditionLayout = descendantElementsByLocalName(document, 'meta').find(
    (node) =>
      node.getAttribute('property') === 'rendition:layout' &&
      node.textContent?.trim() === 'pre-paginated',
  )

  const isFixedLayout =
    Boolean(renditionLayout) ||
    Array.from(manifest.values()).some((item) =>
      item.properties.includes('rendition:layout-pre-paginated'),
    )

  const spine: SpineReference[] = []
  const itemRefs = spineNode ? childElementsByLocalName(spineNode, 'itemref') : []

  itemRefs.forEach((itemRef, order) => {
    const idref = itemRef.getAttribute('idref')

    if (!idref) {
      return
    }

    const manifestItem = manifest.get(idref)

    if (!manifestItem) {
      return
    }

    const linearAttr = (itemRef.getAttribute('linear') ?? 'yes').toLowerCase()

    spine.push({
      id: idref,
      href: stripFragment(manifestItem.href),
      label: `Chapter ${order + 1}`,
      order,
      rawHtmlPath: manifestItem.href,
      mediaType: manifestItem.mediaType,
      linear: linearAttr !== 'no',
    })
  })

  if (spine.length === 0) {
    throw new Error('The EPUB does not contain any readable spine items.')
  }

  return {
    metadata,
    spine,
    navPath,
    ncxPath,
    isFixedLayout,
    guideStartPath: parseGuideStartPath(document, opfPath),
  }
}
