import type { RsvpToken, SpineSection } from '../../types'

interface PreviewPaneProps {
  currentTokenIndex: number
  onSelectToken(tokenIndex: number): void
  section: SpineSection
  tokens: RsvpToken[]
}

export function PreviewPane({
  currentTokenIndex,
  onSelectToken,
  section,
  tokens,
}: PreviewPaneProps) {
  const text = section.text
  const previewTokens = tokens.filter((token) => !token.isBreak)
  const fragments = previewTokens.reduce<
    Array<{ leadingText: string; token: RsvpToken; tokenIndex: number }>
  >((items, token, tokenIndex) => {
    const previous = items[items.length - 1]
    const previousEnd = previous ? previous.token.charEnd : 0

    items.push({
      leadingText: text.slice(previousEnd, token.charStart),
      token,
      tokenIndex,
    })

    return items
  }, [])
  const trailingText =
    previewTokens.length > 0 ? text.slice(previewTokens[previewTokens.length - 1]!.charEnd) : text

  return (
    <section className="rounded-[1.5rem] border border-outline bg-panel p-4 shadow-soft md:p-5">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted">{section.label}</p>
      </header>
      <div className="max-h-[70vh] overflow-auto whitespace-pre-wrap text-muted leading-[1.8] text-body  [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {fragments.map(({ leadingText, token, tokenIndex }) => {
          return (
            <span key={token.id}>
              {leadingText ? <span>{leadingText}</span> : null}
              <button
                aria-current={currentTokenIndex === tokenIndex ? 'true' : undefined}
                className={`cursor-pointer rounded-[0.3rem] px-[0.2rem] py-[0.12rem] text-inherit transition-colors ${
                  currentTokenIndex === tokenIndex ? 'bg-accent/16' : 'hover:bg-surface-strong'
                }`}
                type="button"
                onClick={() => onSelectToken(tokenIndex)}
              >
                {token.text}
              </button>
            </span>
          )
        })}
        {trailingText ? <span>{trailingText}</span> : null}
      </div>
    </section>
  )
}
