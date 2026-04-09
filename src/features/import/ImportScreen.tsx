import { useId, useState } from 'react'

const primaryButtonClass =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-contrast shadow-[0_12px_32px_rgba(59,130,246,0.28)] transition-[transform,background,color,border-color] duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none'

interface ImportScreenProps {
  error?: string
  loading: boolean
  loadingMessage?: string
  onFileSelected(file: File): void
}

export function ImportScreen({
  error,
  loading,
  loadingMessage,
  onFileSelected,
}: ImportScreenProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]

    if (!file) {
      return
    }

    onFileSelected(file)
  }

  return (
    <main className="mx-auto w-[min(1400px,calc(100vw-2rem))] pt-8 pb-20 md:pt-16">
      <section className="mb-10 max-w-[56rem]">
        <div className="max-w-[56rem]">
          <h1 className="max-w-[14ch] text-[clamp(3.2rem,8vw,6.4rem)]">
            Load an EPUB and read one word at a time.
          </h1>
          <p className="mt-5 max-w-[42rem] text-[1.1rem] text-muted">
            Parse a local EPUB in the browser, strip the noise, then move through
            each chapter with adaptive RSVP playback and a live text preview.
          </p>
        </div>
      </section>

      <section
        className={`relative rounded-[2rem] border border-outline bg-[image:var(--import-shell-background)] p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-200 ${
          isDragging ? '-translate-y-0.5 border-accent/55 shadow-strong' : ''
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
      >
        <div className="grid justify-items-start gap-4 rounded-[1.5rem] border border-dashed border-outline-strong bg-surface p-4 md:p-12">
          <p className="text-2xl text-heading">Drop an `.epub` here</p>
          <p className="text-muted">
            Reflowable EPUB 2 and EPUB 3 only. Fixed-layout and DRM-protected
            files are rejected.
          </p>
          <label className={primaryButtonClass} htmlFor={inputId}>
            {loading ? 'Processing EPUB...' : 'Choose EPUB'}
          </label>
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept=".epub,application/epub+zip"
            disabled={loading}
            onChange={(event) => handleFiles(event.currentTarget.files)}
          />
          <p className="text-muted">
            Progress and settings are stored locally in this browser.
          </p>
          {loadingMessage ? (
            <p className="rounded-2xl bg-surface-soft px-4 py-3.5 text-muted" role="status">
              {loadingMessage}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-warning-soft px-4 py-3.5 text-warning" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
