import { useEffect, useEffectEvent, useMemo, useState } from 'react'

import { tokenizeSection } from '../../rsvp/tokenize'
import type {
  BookAsset,
  ChapterStatus,
  ReaderProgress,
  ReaderSettings,
  SpineSection,
} from '../../types'
import {
  Button,
} from '../../components/ui/button'
import {
  ChapterProgressStrip,
  type ChapterProgressSegment,
} from './ChapterProgressStrip'
import { PreviewPane } from './PreviewPane'
import { ReaderControls } from './ReaderControls'
import { RsvpDisplay } from './RsvpDisplay'

interface ReaderScreenProps {
  book: BookAsset
  chapters: ChapterStatus[]
  initialProgress: ReaderProgress | null
  onCloseBook(): void
  onProgressChange(progress: ReaderProgress): void
  onSettingsChange(settings: ReaderSettings): void
  sectionWarnings: Record<string, string>
  sections: SpineSection[]
  settings: ReaderSettings
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(target.closest('button, input, select, textarea, label'))
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(value, 100))
}

function getActiveChapterProgressPercent(
  currentTokenIndex: number,
  tokenCount: number,
  isBreakToken: boolean | undefined,
): number {
  if (tokenCount === 0) {
    return 0
  }

  if (isBreakToken) {
    return 100
  }

  const readableTokenCount = Math.max(tokenCount - 1, 1)
  const completedTokenCount = Math.min(currentTokenIndex, Math.max(readableTokenCount - 1, 0))

  return clampPercent((completedTokenCount / readableTokenCount) * 100)
}

function buildChapterProgressSegments(
  chapters: ChapterStatus[],
  activeSectionId: string,
  activeSectionIndex: number,
  completedSectionIds: string[],
  activeChapterProgressPercent: number,
): ChapterProgressSegment[] {
  const completedSectionIdSet = new Set(completedSectionIds)

  return chapters.map((chapter, chapterIndex) => {
    const isActive = chapter.id === activeSectionId
    const isCompleted =
      chapter.available &&
      (completedSectionIdSet.has(chapter.id) ||
        (activeSectionIndex >= 0 && chapterIndex < activeSectionIndex))

    return {
      id: chapter.id,
      label: chapter.label,
      available: chapter.available,
      isActive,
      isCompleted,
      fillPercent: isCompleted ? 100 : isActive ? activeChapterProgressPercent : 0,
    }
  })
}

export function ReaderScreen({
  book,
  chapters,
  initialProgress,
  onCloseBook,
  onProgressChange,
  onSettingsChange,
  sections,
  settings,
}: ReaderScreenProps) {
  const [activeSectionId, setActiveSectionId] = useState(
    initialProgress?.sectionId ?? sections[0]?.id ?? '',
  )
  const [tokenIndex, setTokenIndex] = useState(initialProgress?.tokenIndex ?? 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const isPreviewOpen = false
  const [completedSectionIds, setCompletedSectionIds] = useState<string[]>(
    initialProgress?.completedSectionIds ?? [],
  )
  const sectionsById = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections],
  )
  const readableSectionIds = sections.map((section) => section.id)
  const activeSection = sectionsById.get(activeSectionId) ?? sections[0] ?? null
  const activeChapterId = activeSection?.id ?? ''
  const activeSectionIndex = activeSection
    ? sections.findIndex((section) => section.id === activeSection.id)
    : -1
  const tokens = useMemo(
    () => (activeSection ? tokenizeSection(activeSection, settings) : []),
    [activeSection, settings],
  )
  const safeTokenIndex =
    tokens.length > 0 ? Math.min(tokenIndex, Math.max(tokens.length - 1, 0)) : 0
  const currentToken = tokens[safeTokenIndex]
  const activeChapterProgressPercent = useMemo(
    () => getActiveChapterProgressPercent(safeTokenIndex, tokens.length, currentToken?.isBreak),
    [currentToken?.isBreak, safeTokenIndex, tokens.length],
  )
  const chapterProgressSegments = useMemo(
    () =>
      buildChapterProgressSegments(
        chapters,
        activeChapterId,
        activeSectionIndex,
        completedSectionIds,
        activeChapterProgressPercent,
      ),
    [
      activeChapterId,
      activeChapterProgressPercent,
      activeSectionIndex,
      chapters,
      completedSectionIds,
    ],
  )

  const moveToSection = (nextSectionId: string, preservePlayback = false) => {
    if (!nextSectionId || nextSectionId === activeSectionId) {
      return
    }

    setActiveSectionId(nextSectionId)
    setTokenIndex(0)
    if (!preservePlayback) {
      setIsPlaying(false)
    }
  }

  const markCurrentSectionComplete = () => {
    if (!activeSectionId) {
      return
    }

    setCompletedSectionIds((current) =>
      current.includes(activeSectionId) ? current : [...current, activeSectionId],
    )
  }

  const goToAdjacentSection = (direction: 1 | -1, preservePlayback = false) => {
    if (activeSectionIndex < 0) {
      return
    }

    const nextSection = sections[activeSectionIndex + direction]

    if (!nextSection) {
      setIsPlaying(false)
      return
    }

    if (direction > 0) {
      markCurrentSectionComplete()
    }

    moveToSection(nextSection.id, preservePlayback)
  }

  const jumpToken = (step: number) => {
    if (tokens.length === 0) {
      return
    }

    setTokenIndex((current) =>
      Math.min(Math.max(current + step, 0), Math.max(tokens.length - 2, 0)),
    )
  }

  const advancePlayback = useEffectEvent(() => {
    if (!currentToken || !activeSection) {
      setIsPlaying(false)
      return
    }

    if (currentToken.isBreak) {
      if (settings.autoPauseOnChapterEnd) {
        markCurrentSectionComplete()
        setIsPlaying(false)
        return
      }

      goToAdjacentSection(1, true)
      return
    }

    if (safeTokenIndex < tokens.length - 1) {
      setTokenIndex((current) => Math.min(current + 1, tokens.length - 1))
      return
    }

    setIsPlaying(false)
  })

  useEffect(() => {
    if (!isPlaying || !currentToken) {
      return
    }

    const timer = window.setTimeout(() => {
      advancePlayback()
    }, currentToken.delayMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [currentToken, isPlaying])

  useEffect(() => {
    if (!activeSection) {
      return
    }

    onProgressChange({
      bookId: book.id,
      sectionId: activeSection.id,
      tokenIndex:
        currentToken?.isBreak && tokens.length > 1
          ? Math.max(tokens.length - 2, 0)
          : safeTokenIndex,
      completedSectionIds,
      updatedAt: new Date().toISOString(),
    })
  }, [
    activeSection,
    book.id,
    completedSectionIds,
    currentToken?.isBreak,
    onProgressChange,
    safeTokenIndex,
    tokens.length,
  ])

  const handleKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (isInteractiveTarget(event.target)) {
      return
    }

    switch (event.key) {
      case ' ':
        event.preventDefault()
        setIsPlaying((current) => !current)
        break
      case 'ArrowLeft':
        event.preventDefault()
        jumpToken(-10)
        break
      case 'ArrowRight':
        event.preventDefault()
        jumpToken(10)
        break
      case 'ArrowUp':
        event.preventDefault()
        onSettingsChange({ ...settings, wpm: Math.min(settings.wpm + 25, 1000) })
        break
      case 'ArrowDown':
        event.preventDefault()
        onSettingsChange({ ...settings, wpm: Math.max(settings.wpm - 25, 100) })
        break
      case '[':
        event.preventDefault()
        goToAdjacentSection(-1)
        break
      case ']':
        event.preventDefault()
        goToAdjacentSection(1)
        break
      default:
        break
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard)

    return () => {
      window.removeEventListener('keydown', handleKeyboard)
    }
  }, [])

  if (!activeSection) {
    return null
  }

  return (
    <div className="mx-auto flex w-[min(100vw-1rem,80rem)] flex-col gap-5 lg:w-[min(1400px,calc(100vw-2rem))]">
      <ChapterProgressStrip
        chapters={chapterProgressSegments}
        onSelectChapter={(sectionId) => moveToSection(sectionId)}
      />

      <header className="flex flex-col gap-6 md:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2>{book.title}</h2>
          <p className="mt-3 text-muted">{book.author}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Button variant="secondary" size="sm" onClick={onCloseBook}>
            Load another book
          </Button>
        </div>
      </header>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.95fr)]">
        <div className="grid gap-5">
          <RsvpDisplay
            token={currentToken}
            fontScale={settings.fontScale}
            isPlaying={isPlaying}
          />
          <ReaderControls
            canGoNext={activeSectionIndex < sections.length - 1}
            canGoPrevious={activeSectionIndex > 0}
            isPlaying={isPlaying}
            onFontScaleChange={(fontScale) => onSettingsChange({ ...settings, fontScale })}
            onJump={jumpToken}
            onNextChapter={() => goToAdjacentSection(1)}
            onPlayPause={() => setIsPlaying((current) => !current)}
            onPreviousChapter={() => goToAdjacentSection(-1)}
            onWpmChange={(wpm) => onSettingsChange({ ...settings, wpm })}
            settings={settings}
          />
        </div>

        <div className={`${isPreviewOpen ? 'grid' : 'hidden'} gap-4 md:grid`}>
          <PreviewPane
            currentTokenIndex={safeTokenIndex}
            onSelectToken={(nextTokenIndex) => {
              setIsPlaying(false)
              setTokenIndex(nextTokenIndex)
            }}
            section={activeSection}
            tokens={tokens}
          />
          {readableSectionIds.length > 0 ? (
            <div className="p-4 text-muted">
              <p className="mb-1 font-semibold">Keyboard</p>
              <span>
                Space play/pause, arrows jump and adjust WPM, [ ] chapters
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
