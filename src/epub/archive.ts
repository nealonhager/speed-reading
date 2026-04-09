import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js'

import { normalizePath } from './path'

interface ArchiveFile {
  text(path: string): Promise<string>
  has(path: string): boolean
  close(): Promise<void>
}

interface ZipEntryLike {
  filename: string
  getData(writer: BlobWriter): Promise<Blob>
}

const archiveRegistry = new Map<string, ArchiveFile>()

export async function openArchive(file: File): Promise<ArchiveFile> {
  const zipReader = new ZipReader(new BlobReader(file))
  const entries = await zipReader.getEntries()
  const fileEntries = new Map<string, ZipEntryLike>()

  for (const entry of entries) {
    if (entry.directory) {
      continue
    }

    fileEntries.set(normalizePath(entry.filename), entry)
  }

  return {
    async text(path: string) {
      const normalized = normalizePath(path)
      const entry = fileEntries.get(normalized)

      if (!entry) {
        throw new Error(`Missing EPUB file: ${normalized}`)
      }

      const blob = await entry.getData(new BlobWriter('application/xhtml+xml'))
      const text = await blob.text()

      return text
    },
    has(path: string) {
      return fileEntries.has(normalizePath(path))
    },
    async close() {
      await zipReader.close()
    },
  }
}

export function registerBookArchive(bookId: string, archive: ArchiveFile): void {
  archiveRegistry.set(bookId, archive)
}

export function getRegisteredArchive(bookId: string): ArchiveFile {
  const archive = archiveRegistry.get(bookId)

  if (!archive) {
    throw new Error('This book is no longer loaded. Re-open the EPUB to continue.')
  }

  return archive
}

export async function clearRegisteredArchive(bookId: string): Promise<void> {
  const archive = archiveRegistry.get(bookId)

  if (!archive) {
    return
  }

  archiveRegistry.delete(bookId)
  await archive.close()
}

export async function clearAllRegisteredArchives(): Promise<void> {
  const archives = Array.from(archiveRegistry.entries())
  archiveRegistry.clear()

  await Promise.all(archives.map(([, archive]) => archive.close()))
}
