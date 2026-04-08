const PROTOCOL_PATTERN = /^[a-z]+:/i

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.?\//, '')
}

export function stripFragment(path: string): string {
  return path.split('#')[0] ?? path
}

export function dirname(path: string): string {
  const normalized = normalizePath(path)
  const index = normalized.lastIndexOf('/')
  return index === -1 ? '' : normalized.slice(0, index)
}

export function resolvePath(basePath: string, targetPath: string): string {
  if (!targetPath) {
    return normalizePath(basePath)
  }

  if (PROTOCOL_PATTERN.test(targetPath) || targetPath.startsWith('/')) {
    return normalizePath(targetPath)
  }

  const baseParts = dirname(basePath)
    .split('/')
    .filter(Boolean)
  const targetParts = normalizePath(targetPath).split('/')

  for (const part of targetParts) {
    if (!part || part === '.') {
      continue
    }

    if (part === '..') {
      baseParts.pop()
      continue
    }

    baseParts.push(part)
  }

  return baseParts.join('/')
}

export function basename(path: string): string {
  const normalized = normalizePath(path)
  const index = normalized.lastIndexOf('/')
  return index === -1 ? normalized : normalized.slice(index + 1)
}
