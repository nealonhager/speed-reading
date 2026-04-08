export type TextBlockType = 'heading' | 'paragraph' | 'listItem'

export interface TextBlock {
  type: TextBlockType
  start: number
  end: number
}

export interface TocItem {
  id: string
  label: string
  href: string
  spineIndex: number
  childrenIds: string[]
}

export interface SpineReference {
  id: string
  href: string
  label: string
  order: number
  rawHtmlPath: string
  mediaType: string
  /** EPUB spine defaults to linear; `no` marks auxiliary documents (cover, copyright, etc.). */
  linear: boolean
}

export interface BookAsset {
  id: string
  fileName: string
  title: string
  author: string
  language: string
  opfPath: string
  toc: TocItem[]
  spine: SpineReference[]
  /** First spine index included when skipping front matter (landmarks / guide). */
  contentStartSpineIndex?: number
}

export interface SpineSection {
  id: string
  href: string
  label: string
  order: number
  rawHtmlPath: string
  text: string
  blocks: TextBlock[]
  anchors: Record<string, number>
}

export interface RsvpToken {
  id: string
  sectionId: string
  index: number
  text: string
  normalizedText: string
  orpIndex: number
  delayMs: number
  charStart: number
  charEnd: number
  isBreak: boolean
}

export type ReaderTheme = 'light' | 'dusk'

export interface ReaderSettings {
  wpm: number
  fontScale: number
  theme: ReaderTheme
  autoPauseOnChapterEnd: boolean
  punctuationPause: boolean
  longWordPause: boolean
}

export interface ReaderProgress {
  bookId: string
  sectionId: string
  tokenIndex: number
  completedSectionIds: string[]
  updatedAt: string
}

export interface ChapterStatus {
  id: string
  label: string
  available: boolean
  warning?: string
}
