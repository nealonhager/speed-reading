import { extractSectionText, loadEpub } from '../epub'
import { DEFAULT_SETTINGS, loadProgress, saveProgress } from '../state/storage'
import { createTestEpub } from '../test/epub-fixture'
import { tokenizeSection } from '../rsvp/tokenize'

describe('reader flow', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads a book, tokenizes a chapter, and restores saved progress for the same file', async () => {
    const file = await createTestEpub()
    const book = await loadEpub(file)
    const section = await extractSectionText(book, book.spine[0].id)
    const tokens = tokenizeSection(section, DEFAULT_SETTINGS)

    expect(book.title).toBe('Fixture Book')
    expect(section.label).toBe('Opening')
    expect(tokens[0]?.normalizedText).toBe('Opening')

    saveProgress({
      bookId: book.id,
      sectionId: section.id,
      tokenIndex: 10,
      completedSectionIds: [],
      updatedAt: '2026-04-08T00:00:00.000Z',
    })

    const secondBook = await loadEpub(file)

    expect(loadProgress(secondBook.id)).toMatchObject({
      sectionId: section.id,
      tokenIndex: 10,
    })
  })
})
