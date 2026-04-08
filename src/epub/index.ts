import type { BookAsset, SpineReference, SpineSection, TocItem } from '../types'
import { hashString } from '../lib/hash'

import { getRegisteredArchive, openArchive, registerBookArchive } from './archive'
import { parseContainerXml } from './container'
import { landmarksBodymatterSpineIndex, parseNavigation } from './navigation'
import { parsePackageDocument } from './package'
import { stripFragment } from './path'
import { extractReadableText } from './text-extractor'

function spineOrderForCanonicalPath(spine: SpineReference[], canonicalPath: string): number | undefined {
  const target = stripFragment(canonicalPath)
  const match = spine.find(
    (item) => stripFragment(item.rawHtmlPath) === target || item.href === target,
  )
  return match?.order
}

function filterTocForReader(
  toc: TocItem[],
  spine: SpineReference[],
  contentStart: number | undefined,
): TocItem[] {
  return toc.filter((item) => {
    if (item.spineIndex < 0) {
      return false
    }

    const ref = spine[item.spineIndex]

    if (!ref?.linear) {
      return false
    }

    if (contentStart !== undefined && item.spineIndex < contentStart) {
      return false
    }

    return true
  })
}

export async function loadEpub(file: File): Promise<BookAsset> {
  const archive = await openArchive(file)

  if (!archive.has('META-INF/container.xml')) {
    throw new Error('This file is not a valid EPUB. META-INF/container.xml is missing.')
  }

  if (archive.has('META-INF/encryption.xml')) {
    throw new Error('Encrypted or DRM-protected EPUBs are not supported in this reader.')
  }

  const opfPath = parseContainerXml(await archive.text('META-INF/container.xml'))
  const opfDocument = await archive.text(opfPath)
  const parsedPackage = parsePackageDocument(opfDocument, opfPath)

  if (parsedPackage.isFixedLayout) {
    throw new Error('Fixed-layout EPUBs are not supported in this reader yet.')
  }

  const navDocument =
    parsedPackage.navPath && archive.has(parsedPackage.navPath)
      ? await archive.text(parsedPackage.navPath)
      : undefined
  const ncxDocument =
    parsedPackage.ncxPath && archive.has(parsedPackage.ncxPath)
      ? await archive.text(parsedPackage.ncxPath)
      : undefined

  let contentStartSpineIndex: number | undefined =
    navDocument && parsedPackage.navPath
      ? landmarksBodymatterSpineIndex(navDocument, parsedPackage.navPath, parsedPackage.spine)
      : undefined

  if (contentStartSpineIndex === undefined && parsedPackage.guideStartPath) {
    contentStartSpineIndex = spineOrderForCanonicalPath(
      parsedPackage.spine,
      parsedPackage.guideStartPath,
    )
  }

  let toc = parseNavigation({
    opfPath,
    navDocument,
    navPath: parsedPackage.navPath,
    ncxDocument,
    ncxPath: parsedPackage.ncxPath,
    spine: parsedPackage.spine,
  })

  let filteredToc = filterTocForReader(toc, parsedPackage.spine, contentStartSpineIndex)

  if (filteredToc.length === 0 && contentStartSpineIndex !== undefined) {
    contentStartSpineIndex = undefined
    filteredToc = filterTocForReader(toc, parsedPackage.spine, undefined)
  }

  toc = filteredToc

  const labelsByIndex = new Map<number, string>()

  toc.forEach((item) => {
    if (!labelsByIndex.has(item.spineIndex)) {
      labelsByIndex.set(item.spineIndex, item.label)
    }
  })

  const spine = parsedPackage.spine.map((item, index) => ({
    ...item,
    label: labelsByIndex.get(index) ?? item.label,
  }))
  const bookId = hashString(
    [parsedPackage.metadata.title, parsedPackage.metadata.author, file.size, file.lastModified].join('|'),
  )

  registerBookArchive(bookId, archive)

  return {
    id: bookId,
    fileName: file.name,
    title: parsedPackage.metadata.title,
    author: parsedPackage.metadata.author,
    language: parsedPackage.metadata.language,
    opfPath,
    toc,
    spine,
    contentStartSpineIndex,
  }
}

export async function extractSectionText(book: BookAsset, sectionId: string): Promise<SpineSection> {
  const archive = getRegisteredArchive(book.id)
  const spineItem = book.spine.find((item) => item.id === sectionId)

  if (!spineItem) {
    throw new Error(`Unknown section "${sectionId}".`)
  }

  const html = await archive.text(spineItem.rawHtmlPath)
  return extractReadableText(html, spineItem)
}
