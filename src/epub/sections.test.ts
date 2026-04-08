import type { BookAsset, SpineSection } from '../types'

import { deriveReaderSections } from './sections'

describe('deriveReaderSections', () => {
  it('splits a spine section using TOC fragment anchors', () => {
    const book: BookAsset = {
      id: 'book-1',
      fileName: 'fixture.epub',
      title: 'Fixture',
      author: 'Author',
      language: 'en',
      opfPath: 'OPS/content.opf',
      toc: [
        {
          id: 'toc-1',
          label: 'Chapter One',
          href: 'OPS/chapter.xhtml#one',
          spineIndex: 0,
          childrenIds: [],
        },
        {
          id: 'toc-2',
          label: 'Chapter Two',
          href: 'OPS/chapter.xhtml#two',
          spineIndex: 0,
          childrenIds: [],
        },
      ],
      spine: [],
    }

    const sourceSections: SpineSection[] = [
      {
        id: 'section-1',
        href: 'OPS/chapter.xhtml',
        label: 'Combined Chapter',
        order: 0,
        rawHtmlPath: 'OPS/chapter.xhtml',
        text: 'Chapter One text.\n\nChapter Two text.',
        blocks: [
          { type: 'paragraph', start: 0, end: 17 },
          { type: 'paragraph', start: 19, end: 36 },
        ],
        anchors: {
          one: 0,
          two: 19,
        },
      },
    ]

    const derived = deriveReaderSections(book, sourceSections)

    expect(derived).toHaveLength(2)
    expect(derived.map((section) => section.label)).toEqual(['Chapter One', 'Chapter Two'])
    expect(derived.map((section) => section.text)).toEqual([
      'Chapter One text.',
      'Chapter Two text.',
    ])
  })
})
