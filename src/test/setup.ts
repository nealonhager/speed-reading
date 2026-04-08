import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

import { clearAllRegisteredArchives } from '../epub/archive'

afterEach(async () => {
  await clearAllRegisteredArchives()
})
