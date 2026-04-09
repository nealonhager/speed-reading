import { fireEvent, render, screen } from '@testing-library/react'

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
  title: 'Switch Fixture',
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

describe('ReaderScreen chapter switching', () => {
  it('switches chapters from the top progress strip without a chapters toggle', () => {
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

    expect(screen.queryByRole('button', { name: /chapters/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chapter 1' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTitle('First')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Chapter 2' }))

    expect(screen.getByRole('button', { name: 'Chapter 2' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTitle('Second')).toBeInTheDocument()
    expect(
      screen.getAllByText((_, node) => node?.textContent === 'Second chapter preview text.'),
    ).not.toHaveLength(0)
  })
})
