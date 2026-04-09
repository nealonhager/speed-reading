import type { CSSProperties } from 'react'

import { splitAtOrpGrapheme } from '../../rsvp/orp'
import { rsvpDisplayFontSizePx, rsvpPauseFontSizePx } from '../../rsvp/rsvp-display-font'
import type { RsvpToken } from '../../types'

interface RsvpDisplayProps {
  token?: RsvpToken
  fontScale: number
  isPlaying: boolean
}

const displayShellBaseClass =
  'relative min-h-[18rem] overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(201,92,58,0.14),transparent_48%),linear-gradient(160deg,rgba(255,255,255,0.95),rgba(246,239,228,0.96))] p-8 shadow-strong transition-[border-color,box-shadow] duration-200 md:min-h-[24rem]'

const displayShellDialogueBaseClass =
  'relative min-h-[18rem] overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(90,118,168,0.12),transparent_48%),linear-gradient(160deg,rgba(255,255,255,0.95),rgba(238,242,250,0.96))] p-8 shadow-strong transition-[border-color,box-shadow] duration-200 md:min-h-[24rem]'

const displayShellPausedClass = `${displayShellBaseClass} border border-[rgba(49,38,33,0.08)]`
const displayShellPlayingClass = `${displayShellBaseClass} border border-[rgba(201,92,58,0.32)] ring-2 ring-[rgba(201,92,58,0.14)]`
const displayShellDialoguePausedClass = `${displayShellDialogueBaseClass} border border-[rgba(65,95,140,0.28)]`
const displayShellDialoguePlayingClass = `${displayShellDialogueBaseClass} border border-[rgba(65,95,140,0.42)] ring-2 ring-[rgba(65,95,140,0.18)]`

const displayFrameBaseClass =
  "relative isolate grid min-h-[20rem] w-full place-items-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:-translate-y-1/2 before:content-[''] after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:-translate-x-1/2 after:content-[''] transition-colors duration-200"

const displayFramePausedClass = `${displayFrameBaseClass} before:bg-[rgba(49,38,33,0.08)] after:bg-[rgba(49,38,33,0.08)]`
const displayFramePlayingClass = `${displayFrameBaseClass} before:bg-[rgba(201,92,58,0.24)] after:bg-[rgba(201,92,58,0.24)]`
const displayFrameDialoguePausedClass = `${displayFrameBaseClass} before:bg-[rgba(65,95,140,0.14)] after:bg-[rgba(65,95,140,0.14)]`
const displayFrameDialoguePlayingClass = `${displayFrameBaseClass} before:bg-[rgba(65,95,140,0.26)] after:bg-[rgba(65,95,140,0.26)]`

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

  return (
    <section className={shellClass} aria-live="polite">
      <div className={frameClass}>
        <span
          className={`relative z-10 font-display italic leading-none tracking-[-0.05em] ${isPlaying ? 'text-heading' : 'text-heading/82'}`}
          style={
            {
              fontSize: `${rsvpDisplayFontSizePx(fontScale)}px`,
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
