import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ImportScreen } from './ImportScreen'

describe('ImportScreen', () => {
  it('does not render a theme picker', () => {
    render(
      <ImportScreen
        loading={false}
        onFileSelected={vi.fn()}
      />,
    )

    expect(screen.queryByText('Theme')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
