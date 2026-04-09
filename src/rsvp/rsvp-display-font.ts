/** Typography aligned with `RsvpDisplay` word styling (italic display face); keep in sync when those styles change. */
const ROOT_REM_PX = 16

/** Matches `clamp(2.8rem, calc(2.6rem * fontScale), 5rem)` with 1rem = 16px. */
export const RSVP_DISPLAY_FONT_MIN_REM = 2.8
export const RSVP_DISPLAY_FONT_PREF_REM = 2.6
export const RSVP_DISPLAY_FONT_MAX_REM = 5

/** Section pause label: `clamp(1.2rem, calc(1.15rem * fontScale), 2rem)`. */
export const RSVP_PAUSE_FONT_MIN_REM = 1.2
export const RSVP_PAUSE_FONT_PREF_REM = 1.15
export const RSVP_PAUSE_FONT_MAX_REM = 2

/** Matches `tracking-[-0.05em]` on the RSVP word span. */
export const RSVP_DISPLAY_TRACKING_EM = -0.05

export const RSVP_DISPLAY_FONT_FAMILY =
  "'Fraunces', 'Iowan Old Style', Georgia, serif"

export function rsvpDisplayFontSizePx(fontScale: number): number {
  const preferred = RSVP_DISPLAY_FONT_PREF_REM * fontScale * ROOT_REM_PX
  return Math.max(
    RSVP_DISPLAY_FONT_MIN_REM * ROOT_REM_PX,
    Math.min(preferred, RSVP_DISPLAY_FONT_MAX_REM * ROOT_REM_PX),
  )
}

export function rsvpPauseFontSizePx(fontScale: number): number {
  const preferred = RSVP_PAUSE_FONT_PREF_REM * fontScale * ROOT_REM_PX
  return Math.max(
    RSVP_PAUSE_FONT_MIN_REM * ROOT_REM_PX,
    Math.min(preferred, RSVP_PAUSE_FONT_MAX_REM * ROOT_REM_PX),
  )
}

export function rsvpDisplayLetterSpacingPx(fontScale: number): number {
  return RSVP_DISPLAY_TRACKING_EM * rsvpDisplayFontSizePx(fontScale)
}

/** Canvas `font` string for Pretext / measureText, matching italic RSVP word styling. */
export function rsvpDisplayCanvasFont(fontScale: number): string {
  const sizePx = rsvpDisplayFontSizePx(fontScale)
  return `italic 400 ${sizePx}px ${RSVP_DISPLAY_FONT_FAMILY}`
}
