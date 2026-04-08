import type { ReaderSettings } from '../types'

export function getTokenDelay(text: string, settings: ReaderSettings): number {
  let delay = 60000 / settings.wpm

  if (settings.punctuationPause) {
    if (/[.;,:]$/.test(text)) {
      delay *= 1.6
    }

    if (/[.!?]$/.test(text)) {
      delay *= 2.2
    }
  }

  if (settings.longWordPause) {
    if (text.length >= 8) {
      delay += 80
    }

    if (text.length >= 12) {
      delay += 120
    }

    if (text.length >= 2 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
      delay += 60
    }
  }

  return Math.round(delay)
}
