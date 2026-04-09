import { cn } from '../../lib/utils'

export interface ChapterProgressSegment {
  id: string
  label: string
  available: boolean
  isActive: boolean
  isCompleted: boolean
  fillPercent: number
}

interface ChapterProgressStripProps {
  chapters: ChapterProgressSegment[]
  onSelectChapter(sectionId: string): void
}

function segmentFillClassName(segment: ChapterProgressSegment): string {
  if (!segment.available) {
    return 'bg-outline/35'
  }

  if (segment.isCompleted || segment.isActive) {
    return 'bg-[var(--accent)]'
  }

  return 'bg-outline/50'
}

function segmentButtonClassName(segment: ChapterProgressSegment): string {
  return cn(
    'group relative isolate flex h-3 min-w-2 basis-0 overflow-hidden rounded transition-[border-color,transform,opacity] duration-200',
    segment.isActive ? 'grow-[4] border-outline-strong bg-progress-track' : 'grow border-outline bg-progress-track',
    segment.available
      ? 'cursor-pointer'
      : 'cursor-not-allowed opacity-45',
  )
}

export function ChapterProgressStrip({
  chapters,
  onSelectChapter,
}: ChapterProgressStripProps) {
  return (
    <div
      className="relative left-1/2 grid w-screen -translate-x-1/2 pt-1"
      role="group"
      aria-label="Chapter progress"
    >
      <div className="flex items-center gap-1">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            title={chapter.label}
            className={segmentButtonClassName(chapter)}
            onClick={() => onSelectChapter(chapter.id)}
            disabled={!chapter.available}
            aria-current={chapter.isActive ? 'true' : undefined}
            aria-label={chapter.label}
          >
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded transition-[width] duration-200',
                segmentFillClassName(chapter),
              )}
              style={{ width: `${chapter.fillPercent}%` }}
              role="progressbar"
              aria-label={`${chapter.label} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(chapter.fillPercent)}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
