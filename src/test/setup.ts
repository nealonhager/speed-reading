import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

import { clearAllRegisteredArchives } from '../epub/archive'

type MatchMediaChangeListener = (event: MediaQueryListEvent) => void

function readMaxWidth(query: string): number | null {
  const result = /\(max-width:\s*(\d+)px\)/.exec(query)
  return result ? Number(result[1]) : null
}

function normalizeMatchMediaListener(
  listener: MediaQueryList['onchange'],
): MatchMediaChangeListener | null {
  if (!listener) {
    return null
  }

  return (event) => listener.call(window.matchMedia(event.media), event)
}

function createMatchMediaList(query: string): MediaQueryList {
  const maxWidth = readMaxWidth(query)
  const matches = maxWidth === null ? false : window.innerWidth <= maxWidth
  const listeners = new Set<MatchMediaChangeListener>()

  return {
    matches,
    media: query,
    onchange: null,
    addEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
      if (typeof listener === 'function') {
        listeners.add(listener as MatchMediaChangeListener)
      }
    },
    removeEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
      if (typeof listener === 'function') {
        listeners.delete(listener as MatchMediaChangeListener)
      }
    },
    addListener(listener) {
      const normalizedListener = normalizeMatchMediaListener(listener)
      if (normalizedListener) {
        listeners.add(normalizedListener)
      }
    },
    removeListener(listener) {
      const normalizedListener = normalizeMatchMediaListener(listener)
      if (normalizedListener) {
        listeners.delete(normalizedListener)
      }
    },
    dispatchEvent(event) {
      listeners.forEach((listener) => listener(event as MediaQueryListEvent))
      return true
    },
  }
}

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value(query: string) {
      return createMatchMediaList(query)
    },
    writable: true,
  })
}

const canvasProto = globalThis.HTMLCanvasElement?.prototype
if (canvasProto) {
  const originalGetContext = canvasProto.getContext
  canvasProto.getContext = (function (
    this: HTMLCanvasElement,
    contextId: string,
    ...args: unknown[]
  ) {
    if (contextId === '2d') {
      return null
    }

    return (originalGetContext as (...innerArgs: unknown[]) => unknown).call(
      this,
      contextId,
      ...args,
    ) as ReturnType<HTMLCanvasElement['getContext']>
  }) as HTMLCanvasElement['getContext']
}

afterEach(async () => {
  await clearAllRegisteredArchives()
})
