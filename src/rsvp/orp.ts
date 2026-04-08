export function getOrpIndex(text: string): number {
  const length = text.length

  if (length <= 1) {
    return 0
  }

  if (length <= 5) {
    return 1
  }

  if (length <= 9) {
    return 2
  }

  if (length <= 13) {
    return 3
  }

  return Math.min(4, length - 1)
}
