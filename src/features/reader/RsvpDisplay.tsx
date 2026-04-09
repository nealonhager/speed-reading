import type { CSSProperties } from 'react'

import { getOrpCenterShiftPx, splitAtOrpGrapheme } from '../../rsvp/orp'
import { rsvpDisplayFontSizePx, rsvpPauseFontSizePx } from '../../rsvp/rsvp-display-font'
import type { RsvpToken } from '../../types'

interface RsvpDisplayProps {
  token?: RsvpToken
  fontScale: number
  isPlaying: boolean
}

const displayShellBaseClass =
  'relative min-h-[18rem] overflow-hidden rounded-[2rem] p-8 shadow-strong transition-[border-color,box-shadow] duration-200 md:min-h-[24rem]'

const displayShellDialogueBaseClass =
  'relative min-h-[18rem] overflow-hidden rounded-[2rem] p-8 shadow-strong transition-[border-color,box-shadow] duration-200 md:min-h-[24rem]'

const displayShellPausedClass = `${displayShellBaseClass} border border-outline`
const displayShellPlayingClass = `${displayShellBaseClass} border border-accent/35 ring-2 ring-accent/15`
const displayShellDialoguePausedClass = `${displayShellDialogueBaseClass} border border-info/30`
const displayShellDialoguePlayingClass = `${displayShellDialogueBaseClass} border border-info/45 ring-2 ring-info/20`

const displayFrameBaseClass =
  "relative isolate grid min-h-[20rem] w-full place-items-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:-translate-y-1/2 before:content-[''] after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:-translate-x-1/2 after:content-[''] transition-colors duration-200"

const displayFramePausedClass = `${displayFrameBaseClass} `
const displayFramePlayingClass = `${displayFrameBaseClass} `
const displayFrameDialoguePausedClass = `${displayFrameBaseClass} `
const displayFrameDialoguePlayingClass = `${displayFrameBaseClass} `

function displayShellClass(isPlaying: boolean, isDialogue: boolean): string {
  if (isDialogue) {
    return isPlaying ? displayShellDialoguePlayingClass : displayShellDialoguePausedClass
  }
  return isPlaying ? displayShellPlayingClass : displayShellPausedClass
}

function displayFrameClass(isPlaying: boolean, isDialogue: boolean): string {
  if (isDialogue) {
    return isPlaying ? displayFrameDialoguePlayingClass : displayFrameDialoguePausedClass
  }
  return isPlaying ? displayFramePlayingClass : displayFramePausedClass
}

export function RsvpDisplay({ token, fontScale, isPlaying }: RsvpDisplayProps) {
  const isDialogue = Boolean(token && !token.isBreak && token.isDialogue)
  const shellClass = displayShellClass(isPlaying, isDialogue)
  const frameClass = displayFrameClass(isPlaying, isDialogue)

  if (!token || token.isBreak) {
    return (
      <section className={shellClass} aria-live="polite">
        <div className={frameClass}>
          <span
            className="relative z-10 font-display tracking-[0.02em] text-muted"
            style={
              {
                fontSize: `${rsvpPauseFontSizePx(fontScale)}px`,
              } as CSSProperties
            }
          >
            Section pause
          </span>
        </div>
      </section>
    )
  }

  const { before, focus, after } = splitAtOrpGrapheme(token.normalizedText, token.orpIndex)
  const centerShiftPx = getOrpCenterShiftPx(token.normalizedText, fontScale, token.orpIndex)

  return (
    <section className={shellClass} aria-live="polite">
      <div className={frameClass}>
        <span
          className={`relative z-10 font-display italic leading-none tracking-[-0.05em] ${isPlaying ? 'text-heading' : 'text-heading/82'}`}
          style={
            {
              fontSize: `${rsvpDisplayFontSizePx(fontScale)}px`,
              transform: `translateX(${centerShiftPx}px)`,
            } as CSSProperties
          }
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
