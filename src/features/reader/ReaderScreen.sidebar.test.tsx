import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from '../../state/storage'
import type { BookAsset, ChapterStatus, ReaderProgress, SpineSection } from '../../types'
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
  title: 'Chapter Strip Fixture',
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

function createChapters(availableChapterIds: string[] = sections.map((section) => section.id)): ChapterStatus[] {
  return sections.map((section) => ({
    id: section.id,
    label: section.label,
    available: availableChapterIds.includes(section.id),
  }))
}

function createInitialProgress(overrides: Partial<ReaderProgress> = {}): ReaderProgress {
  return {
    bookId: book.id,
    sectionId: sections[0]!.id,
    tokenIndex: 0,
    completedSectionIds: [],
    updatedAt: '2026-04-08T00:00:00.000Z',
    ...overrides,
  }
}

describe('ReaderScreen chapter progress strip', () => {
  it('marks the active chapter and exposes its reading progress', () => {
    render(
      <ReaderScreen
        book={book}
        chapters={createChapters()}
        initialProgress={createInitialProgress({ tokenIndex: 2 })}
        onCloseBook={() => {}}
        onProgressChange={() => {}}
        onSettingsChange={() => {}}
        sectionWarnings={{}}
        sections={sections}
        settings={DEFAULT_SETTINGS}
      />,
    )

    expect(screen.getByRole('button', { name: 'Chapter 1' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('progressbar', { name: 'Chapter 1 progress' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
  })

  it('disables unreadable chapters and ignores clicks on them', () => {
    render(
      <ReaderScreen
        book={book}
        chapters={createChapters(['chapter-1'])}
        initialProgress={null}
        onCloseBook={() => {}}
        onProgressChange={() => {}}
        onSettingsChange={() => {}}
        sectionWarnings={{}}
        sections={sections}
        settings={DEFAULT_SETTINGS}
      />,
    )

    const disabledChapter = screen.getByRole('button', { name: 'Chapter 2' })
    expect(disabledChapter).toBeDisabled()

    fireEvent.click(disabledChapter)

    expect(screen.getByTitle('First')).toBeInTheDocument()
  })

  it('marks earlier chapters as complete after moving forward', () => {
    render(
      <ReaderScreen
        book={book}
        chapters={createChapters()}
        initialProgress={null}
        onCloseBook={() => {}}
        onProgressChange={() => {}}
        onSettingsChange={() => {}}
        sectionWarnings={{}}
        sections={sections}
        settings={DEFAULT_SETTINGS}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Next chapter' }))

    expect(screen.getByRole('button', { name: 'Chapter 2' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('progressbar', { name: 'Chapter 1 progress' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })

  it('renders chapters before the active chapter as filled on initial load', () => {
    render(
      <ReaderScreen
        book={book}
        chapters={createChapters()}
        initialProgress={createInitialProgress({ sectionId: 'chapter-2' })}
        onCloseBook={() => {}}
        onProgressChange={() => {}}
        onSettingsChange={() => {}}
        sectionWarnings={{}}
        sections={sections}
        settings={DEFAULT_SETTINGS}
      />,
    )

    expect(screen.getByRole('button', { name: 'Chapter 2' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('progressbar', { name: 'Chapter 1 progress' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
  })
})
