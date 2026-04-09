import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_SETTINGS } from '../../state/storage'
import type { BookAsset, ChapterStatus, SpineSection } from '../../types'
import { ReaderScreen } from './ReaderScreen'

const section: SpineSection = {
  id: 'chapter-1',
  href: 'chapter-1.xhtml',
  label: 'Chapter 1',
  order: 0,
  rawHtmlPath: 'chapter-1.xhtml',
  text: 'First second third.',
  blocks: [],
  anchors: {},
}

const book: BookAsset = {
  id: 'book-1',
  fileName: 'book.epub',
  title: 'Playback Fixture',
  author: 'Test Author',
  language: 'en',
  opfPath: 'OPS/content.opf',
  toc: [],
  spine: [
    {
      id: section.id,
      href: section.href,
      label: section.label,
      order: section.order,
      rawHtmlPath: section.rawHtmlPath,
      mediaType: 'application/xhtml+xml',
      linear: true,
    },
  ],
}

const chapters: ChapterStatus[] = [
  {
    id: section.id,
    label: section.label,
    available: true,
  },
]

describe('ReaderScreen playback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('advances the displayed word after play is pressed', () => {
    render(
      <ReaderScreen
        book={book}
        chapters={chapters}
        initialProgress={null}
        onCloseBook={() => {}}
        onProgressChange={() => {}}
        onSettingsChange={() => {}}
        sectionWarnings={{}}
        sections={[section]}
        settings={DEFAULT_SETTINGS}
      />,
    )

    expect(screen.getByTitle('First')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByTitle('second')).toBeInTheDocument()
  })

  it('jumps to the clicked preview token', () => {
    render(
      <ReaderScreen
        book={book}
        chapters={chapters}
        initialProgress={null}
        onCloseBook={() => {}}
        onProgressChange={() => {}}
        onSettingsChange={() => {}}
        sectionWarnings={{}}
        sections={[section]}
        settings={DEFAULT_SETTINGS}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Show preview' }))
    fireEvent.click(screen.getByRole('button', { name: 'third.' }))

    expect(screen.getByTitle('third.')).toBeInTheDocument()
  })
})
