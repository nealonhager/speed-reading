import { startTransition, useEffect, useState } from 'react'

import { clearRegisteredArchive } from './epub/archive'
import { extractSectionText, loadEpub } from './epub'
import { deriveReaderSections } from './epub/sections'
import { ImportScreen } from './features/import/ImportScreen'
import { ReaderScreen } from './features/reader/ReaderScreen'
import { loadProgress, loadSettings, saveProgress, saveSettings } from './state/storage'
import type { BookAsset, ChapterStatus, ReaderProgress, ReaderSettings, SpineSection } from './types'

function buildChapterStatus(sections: SpineSection[]): ChapterStatus[] {
  return sections.map((section) => ({
    id: section.id,
    label: section.label,
    available: true,
  }))
}

async function loadReadableSections(book: BookAsset): Promise<{
  sections: SpineSection[]
  warnings: Record<string, string>
}> {
  const sections: SpineSection[] = []
  const warnings: Record<string, string> = {}

  for (const spineItem of book.spine) {
    if (!spineItem.linear) {
      continue
    }

    if (
      book.contentStartSpineIndex !== undefined &&
      spineItem.order < book.contentStartSpineIndex
    ) {
      continue
    }

    try {
      sections.push(await extractSectionText(book, spineItem.id))
    } catch (error) {
      warnings[spineItem.id] =
        error instanceof Error ? error.message : 'The section could not be read.'
    }
  }

  const derivedSections = deriveReaderSections(book, sections)

  if (derivedSections.length === 0) {
    throw new Error('No readable sections were found in this EPUB.')
  }

  return { sections: derivedSections, warnings }
}

function App() {
  const [book, setBook] = useState<BookAsset | null>(null)
  const [sections, setSections] = useState<SpineSection[]>([])
  const [sectionWarnings, setSectionWarnings] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState<ReaderSettings>(() => loadSettings())
  const [progress, setProgress] = useState<ReaderProgress | null>(null)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>()

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.theme = settings.theme
  }, [settings])

  useEffect(() => {
    return () => {
      if (book) {
        void clearRegisteredArchive(book.id)
      }
    }
  }, [book])

  const handleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.epub')) {
      setError('Select an `.epub` file to continue.')
      return
    }

    setLoading(true)
    setError(undefined)
    setLoadingMessage('Opening EPUB archive...')

    const previousBookId = book?.id

    try {
      const nextBook = await loadEpub(file)
      setLoadingMessage('Extracting readable sections...')
      const { sections: nextSections, warnings } = await loadReadableSections(nextBook)
      const savedProgress = loadProgress(nextBook.id)
      const validSectionIds = new Set(nextSections.map((section) => section.id))
      const nextProgress =
        savedProgress && validSectionIds.has(savedProgress.sectionId)
          ? savedProgress
          : {
              bookId: nextBook.id,
              sectionId: nextSections[0].id,
              tokenIndex: 0,
              completedSectionIds: [],
              updatedAt: new Date().toISOString(),
            }

      if (previousBookId) {
        await clearRegisteredArchive(previousBookId)
      }

      startTransition(() => {
        setBook(nextBook)
        setSections(nextSections)
        setSectionWarnings(warnings)
        setProgress(nextProgress)
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load EPUB.')
    } finally {
      setLoading(false)
      setLoadingMessage(undefined)
    }
  }

  const closeBook = async () => {
    if (book) {
      await clearRegisteredArchive(book.id)
    }

    setBook(null)
    setSections([])
    setSectionWarnings({})
    setProgress(null)
    setError(undefined)
  }

  const chapterStatus = book ? buildChapterStatus(sections) : []

  return (
    <div className="min-h-screen">
      {book ? (
        <ReaderScreen
          key={book.id}
          book={book}
          chapters={chapterStatus}
          initialProgress={progress}
          onCloseBook={() => {
            void closeBook()
          }}
          onProgressChange={(nextProgress) => {
            setProgress(nextProgress)
            saveProgress(nextProgress)
          }}
          onSettingsChange={setSettings}
          sectionWarnings={sectionWarnings}
          sections={sections}
          settings={settings}
        />
      ) : (
        <ImportScreen
          error={error}
          loading={loading}
          loadingMessage={loadingMessage}
          onFileSelected={(file) => {
            void handleFileSelected(file)
          }}
        />
      )}
    </div>
  )
}

export default App
