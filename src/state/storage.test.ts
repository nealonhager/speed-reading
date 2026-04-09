import {
  DEFAULT_SETTINGS,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from './storage'

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads settings defaults and persists overrides', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)

    saveSettings({ ...DEFAULT_SETTINGS, wpm: 500, theme: 'dusk' })

    expect(loadSettings()).toMatchObject({ wpm: 500, theme: 'dusk' })
  })

  it('coerces saved light theme settings back to dusk', () => {
    window.localStorage.setItem(
      'speed-reader.settings.v1',
      JSON.stringify({ ...DEFAULT_SETTINGS, theme: 'light' }),
    )

    expect(loadSettings()).toMatchObject({ theme: 'dusk' })
  })

  it('saves and loads progress by book id', () => {
    saveProgress({
      bookId: 'book-1',
      sectionId: 'chapter-2',
      tokenIndex: 12,
      completedSectionIds: ['chapter-1'],
      updatedAt: '2026-04-08T00:00:00.000Z',
    })

    expect(loadProgress('book-1')).toMatchObject({
      sectionId: 'chapter-2',
      tokenIndex: 12,
      completedSectionIds: ['chapter-1'],
    })
  })
})
