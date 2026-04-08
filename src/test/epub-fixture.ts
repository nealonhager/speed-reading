import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'

interface TestEpubOptions {
  includeNav?: boolean
  /** EPUB 3 nav with parent Parts wrapping chapter links (tests leaf-only TOC). */
  nestedNav?: boolean
  includeNcx?: boolean
  includeEncryption?: boolean
  includeImageOnlySection?: boolean
  includeMalformedSection?: boolean
  fixedLayout?: boolean
  /** Inserts a front XHTML before chapter1 in the spine (for linear / landmarks tests). */
  includeFrontMatter?: boolean
  /** When used with `includeFrontMatter`, front matter is linear and landmarks point at chapter1. */
  includeFrontMatterLandmarks?: boolean
}

function buildOpf(options: TestEpubOptions): string {
  const manifest: string[] = []

  if (options.includeFrontMatter) {
    manifest.push(
      `<item id="front" href="front.xhtml" media-type="application/xhtml+xml" />`,
    )
  }

  manifest.push(
    `<item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml" />`,
    `<item id="chapter2" href="text/chapter2.xhtml" media-type="application/xhtml+xml" />`,
  )

  if (options.includeImageOnlySection) {
    manifest.push(
      `<item id="plate" href="plate.xhtml" media-type="application/xhtml+xml" />`,
    )
  }

  if (options.includeMalformedSection) {
    manifest.push(
      `<item id="broken" href="broken.xhtml" media-type="application/xhtml+xml" />`,
    )
  }

  if (options.includeNav !== false) {
    manifest.push(
      `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />`,
    )
  }

  if (options.includeNcx) {
    manifest.push(
      `<item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml" />`,
    )
  }

  const spine: string[] = []

  if (options.includeFrontMatter) {
    const frontLinear =
      options.includeFrontMatterLandmarks === true ? '' : ' linear="no"'
    spine.push(`<itemref idref="front"${frontLinear} />`)
  }

  spine.push('<itemref idref="chapter1" />', '<itemref idref="chapter2" />')

  if (options.includeImageOnlySection) {
    spine.push('<itemref idref="plate" />')
  }

  if (options.includeMalformedSection) {
    spine.push('<itemref idref="broken" />')
  }

  const fixedLayoutMeta = options.fixedLayout
    ? '<meta property="rendition:layout">pre-paginated</meta>'
    : ''
  const tocAttribute = options.includeNcx ? ' toc="toc"' : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Fixture Book</dc:title>
    <dc:creator>Test Author</dc:creator>
    <dc:language>en</dc:language>
    ${fixedLayoutMeta}
  </metadata>
  <manifest>
    ${manifest.join('\n')}
  </manifest>
  <spine${tocAttribute}>
    ${spine.join('\n')}
  </spine>
</package>`
}

export async function createTestEpub(options: TestEpubOptions = {}): Promise<File> {
  const writer = new ZipWriter(new BlobWriter('application/epub+zip'))
  const write = (path: string, contents: string) =>
    writer.add(path, new TextReader(contents), { level: 0 })

  await writer.add('mimetype', new TextReader('application/epub+zip'), { level: 0 })
  await write(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`,
  )

  if (options.includeEncryption) {
    await write(
      'META-INF/encryption.xml',
      '<encryption><EncryptedData /></encryption>',
    )
  }

  await write('OEBPS/content.opf', buildOpf(options))

  if (options.includeNav !== false) {
    const frontLi = options.includeFrontMatter
      ? '<li><a href="front.xhtml">Half title</a></li>'
      : ''
    const navBody = options.nestedNav
      ? `<ol>
        ${frontLi}
        <li>
          <a href="chapter1.xhtml">Part One</a>
          <ol>
            <li><a href="chapter1.xhtml">Opening</a></li>
          </ol>
        </li>
        <li>
          <a href="text/chapter2.xhtml">Part Two</a>
          <ol>
            <li><a href="text/chapter2.xhtml">Second Wind</a></li>
          </ol>
        </li>
      </ol>`
      : `<ol>
        ${frontLi}
        <li><a href="chapter1.xhtml">Opening</a></li>
        <li><a href="text/chapter2.xhtml">Second Wind</a></li>
      </ol>`
    const landmarksNav =
      options.includeFrontMatter && options.includeFrontMatterLandmarks
        ? `<nav epub:type="landmarks" hidden="">
      <ol>
        <li><a epub:type="bodymatter" href="chapter1.xhtml">Start</a></li>
      </ol>
    </nav>`
        : ''
    await write(
      'OEBPS/nav.xhtml',
      `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <body>
    ${landmarksNav}
    <nav epub:type="toc">
      ${navBody}
    </nav>
  </body>
</html>`,
    )
  }

  if (options.includeNcx) {
    await write(
      'OEBPS/toc.ncx',
      `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="nav-1" playOrder="1">
      <navLabel><text>Opening</text></navLabel>
      <content src="chapter1.xhtml" />
    </navPoint>
    <navPoint id="nav-2" playOrder="2">
      <navLabel><text>Second Wind</text></navLabel>
      <content src="text/chapter2.xhtml" />
    </navPoint>
  </navMap>
</ncx>`,
    )
  }

  if (options.includeFrontMatter) {
    await write(
      'OEBPS/front.xhtml',
      `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <body>
    <p>Front matter only.</p>
  </body>
</html>`,
    )
  }

  await write(
    'OEBPS/chapter1.xhtml',
    `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <body>
    <h1>Opening</h1>
    <p>First chapter text.</p>
    <aside epub:type="footnote">Ignore this note.</aside>
    <p>Another paragraph with <span>inline emphasis</span>.</p>
  </body>
</html>`,
  )

  await write(
    'OEBPS/text/chapter2.xhtml',
    `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <body>
    <h2>Second Wind</h2>
    <p>Second chapter text.</p>
    <script>window.alert('skip');</script>
    <p>THE END.</p>
  </body>
</html>`,
  )

  if (options.includeImageOnlySection) {
    await write(
      'OEBPS/plate.xhtml',
      `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <body><img src="plate.jpg" alt="plate" /></body>
</html>`,
    )
  }

  if (options.includeMalformedSection) {
    await write('OEBPS/broken.xhtml', '<html><not-body /></html>')
  }

  const blob = await writer.close()
  const buffer = await blob.arrayBuffer()
  return new File([buffer], 'fixture.epub', {
    type: 'application/epub+zip',
    lastModified: 1234,
  })
}
