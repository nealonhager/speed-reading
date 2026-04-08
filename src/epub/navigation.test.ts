import { describe, expect, it } from 'vitest'

import type { SpineReference } from '../types'

import { parseNavigation } from './navigation'

const opfPath = 'OEBPS/content.opf'

function spineTriple(): SpineReference[] {
  return [
    {
      id: 'a',
      href: 'OEBPS/a.xhtml',
      label: 'A',
      order: 0,
      rawHtmlPath: 'OEBPS/a.xhtml',
      mediaType: 'application/xhtml+xml',
      linear: true,
    },
    {
      id: 'b',
      href: 'OEBPS/b.xhtml',
      label: 'B',
      order: 1,
      rawHtmlPath: 'OEBPS/b.xhtml',
      mediaType: 'application/xhtml+xml',
      linear: true,
    },
    {
      id: 'c',
      href: 'OEBPS/c.xhtml',
      label: 'C',
      order: 2,
      rawHtmlPath: 'OEBPS/c.xhtml',
      mediaType: 'application/xhtml+xml',
      linear: true,
    },
  ]
}

describe('parseNavigation', () => {
  it('keeps only leaf NCX targets when parts nest chapters', () => {
    const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="p1">
      <navLabel><text>Part I</text></navLabel>
      <content src="a.xhtml" />
      <navPoint id="c1">
        <navLabel><text>Chapter 1</text></navLabel>
        <content src="b.xhtml" />
      </navPoint>
      <navPoint id="c2">
        <navLabel><text>Chapter 2</text></navLabel>
        <content src="c.xhtml" />
      </navPoint>
    </navPoint>
  </navMap>
</ncx>`

    const toc = parseNavigation({
      opfPath,
      spine: spineTriple(),
      ncxDocument: ncx,
      ncxPath: 'OEBPS/toc.ncx',
    })

    expect(toc.map((item) => item.label)).toEqual(['Chapter 1', 'Chapter 2'])
    expect(toc.map((item) => item.spineIndex)).toEqual([1, 2])
  })

  it('falls back to synthetic spine TOC when NCX is far too small', () => {
    const spine: SpineReference[] = Array.from({ length: 10 }, (_, i) => ({
      id: `id${i}`,
      href: `OEBPS/s${i}.xhtml`,
      label: `Chapter ${i + 1}`,
      order: i,
      rawHtmlPath: `OEBPS/s${i}.xhtml`,
      mediaType: 'application/xhtml+xml',
      linear: true,
    }))

    const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="only">
      <navLabel><text>Stub</text></navLabel>
      <content src="s5.xhtml" />
    </navPoint>
  </navMap>
</ncx>`

    const toc = parseNavigation({
      opfPath,
      spine,
      ncxDocument: ncx,
      ncxPath: 'OEBPS/toc.ncx',
    })

    expect(toc).toHaveLength(10)
    expect(toc[0]?.spineIndex).toBe(0)
    expect(toc[5]?.label).toBe('Chapter 6')
  })
})
