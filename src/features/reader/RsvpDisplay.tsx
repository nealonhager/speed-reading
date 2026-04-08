import type { CSSProperties } from 'react'

import type { RsvpToken } from '../../types'

interface RsvpDisplayProps {
  token?: RsvpToken
  fontScale: number
}

const displayShellClass =
  'relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-[rgba(49,38,33,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(201,92,58,0.14),transparent_48%),linear-gradient(160deg,rgba(255,255,255,0.95),rgba(246,239,228,0.96))] p-8 shadow-strong md:min-h-[24rem]'

const displayFrameClass =
  "relative isolate grid min-h-[20rem] w-full place-items-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:-translate-y-1/2 before:bg-[rgba(49,38,33,0.08)] before:content-[''] after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:-translate-x-1/2 after:bg-[rgba(49,38,33,0.08)] after:content-['']"

export function RsvpDisplay({ token, fontScale }: RsvpDisplayProps) {
  if (!token || token.isBreak) {
    return (
      <section className={displayShellClass} aria-live="polite">
        <div className={displayFrameClass}>
          <span
            className="relative z-10 font-display tracking-[0.02em] text-muted"
            style={{
              fontSize: `clamp(1.2rem, calc(1.15rem * ${fontScale}), 2rem)`,
            } as CSSProperties}
          >
            Section pause
          </span>
        </div>
      </section>
    )
  }

  const safeIndex = Math.min(token.orpIndex, token.normalizedText.length - 1)
  const before = token.normalizedText.slice(0, safeIndex)
  const focus = token.normalizedText[safeIndex] ?? ''
  const after = token.normalizedText.slice(safeIndex + 1)

  return (
    <section className={displayShellClass} aria-live="polite">
      <div className={displayFrameClass}>
        <span
          className="relative z-10 font-display leading-none tracking-[-0.05em] text-heading"
          style={{
            fontSize: `clamp(2.8rem, calc(2.6rem * ${fontScale}), 5rem)`,
          } as CSSProperties}
          title={token.normalizedText}
        >
          <span>{before}</span>
          <span className="text-accent">{focus}</span>
          <span>{after}</span>
        </span>
      </div>
    </section>
  )
}
