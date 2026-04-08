import type { RsvpToken, SpineSection } from '../../types'

interface PreviewPaneProps {
  token?: RsvpToken
  section: SpineSection
}

export function PreviewPane({ token, section }: PreviewPaneProps) {
  const text = section.text
  const highlightStart = token && !token.isBreak ? token.charStart : -1
  const highlightEnd = token && !token.isBreak ? token.charEnd : -1

  return (
    <section className="rounded-[1.5rem] border border-[rgba(49,38,33,0.1)] bg-panel p-4 shadow-soft md:p-5">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h3>Preview</h3>
        <p className="text-sm text-muted">{section.label}</p>
      </header>
      <div className="max-h-[70vh] overflow-auto whitespace-pre-wrap text-base leading-[1.8] text-body">
        {highlightStart >= 0 ? (
          <>
            <span>{text.slice(0, highlightStart)}</span>
            <mark className="rounded-[0.3rem] bg-[rgba(201,92,58,0.16)] px-[0.2rem] py-[0.12rem] text-inherit">
              {text.slice(highlightStart, highlightEnd)}
            </mark>
            <span>{text.slice(highlightEnd)}</span>
          </>
        ) : (
          text
        )}
      </div>
    </section>
  )
}
