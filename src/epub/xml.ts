export function childElements(node: ParentNode): Element[] {
  return Array.from(node.children)
}

export function childElementsByLocalName(node: ParentNode, localName: string): Element[] {
  return childElements(node).filter((child) => child.localName === localName)
}

export function firstChildByLocalName(node: ParentNode, localName: string): Element | null {
  return childElementsByLocalName(node, localName)[0] ?? null
}

export function descendantElementsByLocalName(node: ParentNode, localName: string): Element[] {
  const matches: Element[] = []

  for (const element of Array.from(node.querySelectorAll('*'))) {
    if (element.localName === localName) {
      matches.push(element)
    }
  }

  return matches
}

export function firstDescendantByLocalName(node: ParentNode, localName: string): Element | null {
  return descendantElementsByLocalName(node, localName)[0] ?? null
}

export function textFromFirstDescendant(node: ParentNode, names: string[]): string {
  for (const name of names) {
    const match = firstDescendantByLocalName(node, name)
    const value = match?.textContent?.trim()

    if (value) {
      return value
    }
  }

  return ''
}
