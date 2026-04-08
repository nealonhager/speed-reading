import { extractSectionText, loadEpub } from './index'
import { parseContainerXml } from './container'
import { extractReadableText } from './text-extractor'
import { createTestEpub } from '../test/epub-fixture'

describe('EPUB parsing', () => {
  it('resolves the OPF path from container.xml', () => {
    expect(
      parseContainerXml(`<?xml version="1.0"?>
<container>
  <rootfiles>
    <rootfile full-path="OPS/package.opf" />
  </rootfiles>
</container>`),
    ).toBe('OPS/package.opf')
  })

  it('loads manifest and spine with relative paths and nav labels', async () => {
    const file = await createTestEpub()
    const book = await loadEpub(file)

    expect(book.title).toBe('Fixture Book')
    expect(book.spine.map((item) => item.href)).toEqual([
      'OEBPS/chapter1.xhtml',
      'OEBPS/text/chapter2.xhtml',
    ])
    expect(book.spine.map((item) => item.label)).toEqual(['Opening', 'Second Wind'])
    expect(book.toc).toHaveLength(2)
  })

  it('uses leaf TOC entries when nav nests parts above chapters', async () => {
    const file = await createTestEpub({ nestedNav: true })
    const book = await loadEpub(file)

    expect(book.toc.map((item) => item.label)).toEqual(['Opening', 'Second Wind'])
    expect(book.toc).toHaveLength(2)
  })

  it('drops TOC rows that point at non-linear spine items', async () => {
    const file = await createTestEpub({ includeFrontMatter: true })
    const book = await loadEpub(file)

    expect(book.spine[0]?.linear).toBe(false)
    expect(book.toc.every((item) => item.spineIndex >= 1)).toBe(true)
  })

  it('honors landmarks bodymatter as the start of readable content', async () => {
    const file = await createTestEpub({
      includeFrontMatter: true,
      includeFrontMatterLandmarks: true,
    })
    const book = await loadEpub(file)

    expect(book.spine[0]?.linear).toBe(true)
    expect(book.contentStartSpineIndex).toBe(1)
    expect(book.toc.every((item) => item.spineIndex >= 1)).toBe(true)
  })

  it('falls back to NCX when nav.xhtml is missing', async () => {
    const file = await createTestEpub({ includeNav: false, includeNcx: true })
    const book = await loadEpub(file)

    expect(book.toc.map((item) => item.label)).toEqual(['Opening', 'Second Wind'])
  })

  it('rejects fixed-layout and encrypted books', async () => {
    await expect(loadEpub(await createTestEpub({ fixedLayout: true }))).rejects.toThrow(
      'Fixed-layout EPUBs are not supported in this reader yet.',
    )

    await expect(loadEpub(await createTestEpub({ includeEncryption: true }))).rejects.toThrow(
      'Encrypted or DRM-protected EPUBs are not supported in this reader.',
    )
  })

  it('extracts readable text and skips notes, scripts, and image-only sections', async () => {
    const file = await createTestEpub({ includeImageOnlySection: true })
    const book = await loadEpub(file)
    const section = await extractSectionText(book, 'chapter1')

    expect(section.text).toContain('First chapter text.')
    expect(section.text).not.toContain('Ignore this note.')

    await expect(extractSectionText(book, 'plate')).rejects.toThrow(
      'No readable text could be extracted from "Chapter 3".',
    )
  })

  it('records anchor offsets from nested wrapper structures without collapsing them to the first block', () => {
    const section = extractReadableText(
      `<!doctype html>
<html>
  <body>
    <div class="wrapper">
      <h1 id="chapter-1">Chapter One</h1>
      <p>Alpha text.</p>
      <h1 id="chapter-2">Chapter Two</h1>
      <p>Beta text.</p>
    </div>
  </body>
</html>`,
      {
        id: 'section-1',
        href: 'chapter.xhtml',
        label: 'Combined',
        order: 0,
        rawHtmlPath: 'chapter.xhtml',
        mediaType: 'application/xhtml+xml',
        linear: true,
      },
    )

    expect(section.anchors['chapter-1']).toBe(0)
    expect(section.anchors['chapter-2']).toBeGreaterThan(0)
  })
})
