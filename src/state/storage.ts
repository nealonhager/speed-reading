import type { ReaderProgress, ReaderSettings } from '../types'

export const SETTINGS_STORAGE_KEY = 'speed-reader.settings.v1'
export const PROGRESS_STORAGE_KEY = 'speed-reader.progress.v1'

export const DEFAULT_SETTINGS: ReaderSettings = {
  wpm: 350,
  fontScale: 1,
  theme: 'light',
  autoPauseOnChapterEnd: true,
  punctuationPause: true,
  longWordPause: true,
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function loadSettings(): ReaderSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...safeParse<Partial<ReaderSettings>>(
      window.localStorage.getItem(SETTINGS_STORAGE_KEY),
      {},
    ),
  }
}

export function saveSettings(settings: ReaderSettings): void {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function loadProgress(bookId: string): ReaderProgress | null {
  const progressByBook = safeParse<Record<string, ReaderProgress>>(
    window.localStorage.getItem(PROGRESS_STORAGE_KEY),
    {},
  )

  return progressByBook[bookId] ?? null
}

export function saveProgress(progress: ReaderProgress): void {
  const progressByBook = safeParse<Record<string, ReaderProgress>>(
    window.localStorage.getItem(PROGRESS_STORAGE_KEY),
    {},
  )

  progressByBook[progress.bookId] = progress
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressByBook))
}
