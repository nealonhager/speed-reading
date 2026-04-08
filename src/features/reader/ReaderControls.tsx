import type { ReaderSettings } from '../../types'

const ghostButtonClass =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(49,38,33,0.12)] bg-white/65 px-4 text-heading transition-[transform,background,color,border-color] duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none'

const primaryButtonClass =
  'inline-flex min-h-12 min-w-28 items-center justify-center rounded-full bg-accent px-5 font-semibold text-accent-contrast shadow-[0_12px_32px_rgba(194,95,65,0.24)] transition-[transform,background,color,border-color] duration-200 hover:-translate-y-px'

const settingCardClass =
  'grid gap-3 rounded-[1.2rem] border border-[rgba(49,38,33,0.08)] bg-white/62 p-4 text-heading'

interface ReaderControlsProps {
  canGoNext: boolean
  canGoPrevious: boolean
  isPlaying: boolean
  onFontScaleChange(value: number): void
  onJump(step: number): void
  onNextChapter(): void
  onPlayPause(): void
  onPreviousChapter(): void
  onThemeChange(theme: ReaderSettings['theme']): void
  onWpmChange(value: number): void
  settings: ReaderSettings
}

export function ReaderControls({
  canGoNext,
  canGoPrevious,
  isPlaying,
  onFontScaleChange,
  onJump,
  onNextChapter,
  onPlayPause,
  onPreviousChapter,
  onThemeChange,
  onWpmChange,
  settings,
}: ReaderControlsProps) {
  return (
    <section className="grid gap-4 rounded-[1.5rem] border border-[rgba(49,38,33,0.1)] bg-panel p-4 shadow-soft md:p-5">
      <div className="flex flex-wrap gap-3">
        <button
          className={ghostButtonClass}
          type="button"
          onClick={onPreviousChapter}
          disabled={!canGoPrevious}
        >
          Prev chapter
        </button>
        <button className={ghostButtonClass} type="button" onClick={() => onJump(-10)}>
          -10
        </button>
        <button className={primaryButtonClass} type="button" onClick={onPlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className={ghostButtonClass} type="button" onClick={() => onJump(10)}>
          +10
        </button>
        <button
          className={ghostButtonClass}
          type="button"
          onClick={onNextChapter}
          disabled={!canGoNext}
        >
          Next chapter
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={settingCardClass}>
          <span className="text-sm text-muted">Words per minute</span>
          <strong className="text-[1.1rem]">{settings.wpm}</strong>
          <input
            className="w-full cursor-pointer accent-accent"
            type="range"
            min="100"
            max="1000"
            step="25"
            value={settings.wpm}
            onChange={(event) => onWpmChange(Number(event.currentTarget.value))}
          />
        </label>

        <label className={settingCardClass}>
          <span className="text-sm text-muted">Frame scale</span>
          <strong className="text-[1.1rem]">{settings.fontScale.toFixed(2)}x</strong>
          <input
            className="w-full cursor-pointer accent-accent"
            type="range"
            min="0.85"
            max="1.4"
            step="0.05"
            value={settings.fontScale}
            onChange={(event) => onFontScaleChange(Number(event.currentTarget.value))}
          />
        </label>

        <label className={settingCardClass}>
          <span className="text-sm text-muted">Theme</span>
          <select
            className="min-h-11 rounded-[0.9rem] border border-[rgba(49,38,33,0.12)] bg-white/72 px-3.5 text-heading"
            value={settings.theme}
            onChange={(event) => onThemeChange(event.currentTarget.value as ReaderSettings['theme'])}
          >
            <option value="light">Light</option>
            <option value="dusk">Dusk</option>
          </select>
        </label>
      </div>
    </section>
  )
}
