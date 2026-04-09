import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_SETTINGS } from '../../state/storage'
import { ReaderControls } from './ReaderControls'

describe('ReaderControls', () => {
  it('does not render a theme picker', () => {
    render(
      <ReaderControls
        canGoNext
        canGoPrevious
        isPlaying={false}
        onFontScaleChange={vi.fn()}
        onJump={vi.fn()}
        onNextChapter={vi.fn()}
        onPlayPause={vi.fn()}
        onPreviousChapter={vi.fn()}
        onWpmChange={vi.fn()}
        settings={DEFAULT_SETTINGS}
      />,
    )

    expect(screen.queryByText('Theme')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
