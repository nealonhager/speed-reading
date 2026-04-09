import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_SETTINGS } from '../../state/storage'
import type { BookAsset, ChapterStatus, SpineSection } from '../../types'
import { ReaderScreen } from './ReaderScreen'

const sections: SpineSection[] = [
  {
    id: 'chapter-1',
    href: 'chapter-1.xhtml',
    label: 'Chapter 1',
    order: 0,
    rawHtmlPath: 'chapter-1.xhtml',
    text: 'First chapter preview text.',
    blocks: [],
    anchors: {},
  },
  {
    id: 'chapter-2',
    href: 'chapter-2.xhtml',
    label: 'Chapter 2',
    order: 1,
    rawHtmlPath: 'chapter-2.xhtml',
    text: 'Second chapter preview text.',
    blocks: [],
    anchors: {},
  },
]

const book: BookAsset = {
  id: 'book-1',
  fileName: 'book.epub',
  title: 'Sidebar Fixture',
  author: 'Test Author',
  language: 'en',
  opfPath: 'OPS/content.opf',
  toc: [],
  spine: sections.map((section) => ({
    id: section.id,
    href: section.href,
    label: section.label,
    order: section.order,
    rawHtmlPath: section.rawHtmlPath,
    mediaType: 'application/xhtml+xml',
    linear: true,
  })),
}

const chapters: ChapterStatus[] = sections.map((section) => ({
  id: section.id,
  label: section.label,
  available: true,
}))

const originalInnerWidth = window.innerWidth
const originalMatchMedia = window.matchMedia

function mockMobileViewport(): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 640,
    writable: true,
  })

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  })
}

describe('ReaderScreen sidebar', () => {
  beforeEach(() => {
    mockMobileViewport()
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
      writable: true,
    })

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
      writable: true,
    })
  })

  it('keeps the chapter list hidden on mobile until opened and closes after selection', () => {
    render(
      <ReaderScreen
        book={book}
        chapters={chapters}
        initialProgress={null}
        onCloseBook={() => {}}
        onProgressChange={() => {}}
        onSettingsChange={() => {}}
        sectionWarnings={{}}
        sections={sections}
        settings={DEFAULT_SETTINGS}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Chapter 2' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /chapters/i }))

    fireEvent.click(screen.getByRole('button', { name: 'Chapter 2' }))

    expect(screen.queryByRole('button', { name: 'Chapter 2' })).not.toBeInTheDocument()
    expect(screen.getByTitle('Second')).toBeInTheDocument()
  })
})
