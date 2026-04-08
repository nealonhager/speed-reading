import { normalizePath } from './path'
import { firstDescendantByLocalName } from './xml'

export function parseContainerXml(containerXml: string): string {
  const document = new DOMParser().parseFromString(containerXml, 'application/xml')
  const rootfile = firstDescendantByLocalName(document, 'rootfile')
  const fullPath = rootfile?.getAttribute('full-path')

  if (!fullPath) {
    throw new Error('The EPUB is missing an OPF package reference in META-INF/container.xml.')
  }

  return normalizePath(fullPath)
}
