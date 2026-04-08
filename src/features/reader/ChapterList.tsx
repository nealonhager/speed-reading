import type { ChapterStatus } from '../../types'

const ghostButtonClass =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(49,38,33,0.12)] bg-white/65 px-4 text-heading transition-[transform,background,color,border-color] duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none'

interface ChapterListProps {
  activeSectionId: string
  chapters: ChapterStatus[]
  isOpen: boolean
  onClose(): void
  onSelect(sectionId: string): void
}

export function ChapterList({
  activeSectionId,
  chapters,
  isOpen,
  onClose,
  onSelect,
}: ChapterListProps) {
  return (
    <>
      <aside
        className={`fixed inset-y-4 left-4 z-20 w-[min(24rem,calc(100vw-2rem))] rounded-[1.5rem] border border-[rgba(49,38,33,0.1)] bg-panel p-4 shadow-soft transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'
        } lg:translate-x-0`}
      >
        <header className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h3>Chapters</h3>
            <p className="text-sm text-muted">
              {chapters.filter((chapter) => chapter.available).length} readable sections
            </p>
          </div>
          <button className={`${ghostButtonClass} lg:hidden`} type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="grid max-h-[calc(100vh-8rem)] gap-3 overflow-auto">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              className={`flex w-full items-center justify-between gap-3 rounded-[1.1rem] border border-[rgba(49,38,33,0.08)] bg-white/72 px-4 py-4 text-left text-heading transition-[transform,background,color,border-color] duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none ${
                chapter.id === activeSectionId
                  ? 'border-[rgba(201,92,58,0.45)] bg-[rgba(201,92,58,0.1)]'
                  : ''
              }`}
              type="button"
              disabled={!chapter.available}
              onClick={() => {
                onSelect(chapter.id)
                onClose()
              }}
            >
              <span>{chapter.label}</span>
              {chapter.warning ? (
                <span className="rounded-full bg-[rgba(182,58,37,0.1)] px-2.5 py-1 text-xs text-[#8d3828]">
                  Skipped
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </aside>
      {isOpen ? (
        <button
          className="fixed inset-0 z-10 border-0 bg-[rgba(38,29,24,0.36)] lg:hidden"
          type="button"
          onClick={onClose}
        />
      ) : null}
    </>
  )
}
