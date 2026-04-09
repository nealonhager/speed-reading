import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

import { clearAllRegisteredArchives } from '../epub/archive'

const canvasProto = globalThis.HTMLCanvasElement?.prototype
if (canvasProto) {
  const originalGetContext = canvasProto.getContext
  canvasProto.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    ...args: unknown[]
  ) {
    if (contextId === '2d') {
      return null
    }
    return originalGetContext.call(this, contextId, ...args)
  }
}

afterEach(async () => {
  await clearAllRegisteredArchives()
})
