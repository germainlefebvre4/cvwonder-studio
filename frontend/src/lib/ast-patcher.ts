import { Document, isSeq } from 'yaml'

/**
 * Surgically updates a field in the AST document.
 * If the value is undefined, null, or empty string, we can either delete it or set it empty.
 * For required/essential fields, we preserve empty values. For others, we delete them to keep the YAML tidy.
 */
export function setASTField(doc: Document, path: (string | number)[], value: any) {
  if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
    // If it's a required field like 'name' under 'person' or 'companyName' under 'career',
    // we may want to keep an empty string rather than deleting the key entirely.
    const lastKey = path[path.length - 1]
    if (lastKey === 'name' || lastKey === 'companyName' || lastKey === 'position' || lastKey === 'company') {
      doc.setIn(path, '')
    } else {
      doc.deleteIn(path)
    }
  } else {
    doc.setIn(path, value)
  }
}

/**
 * Appends a new item to a sequence in the AST.
 */
export function appendASTListItem(doc: Document, path: (string | number)[], item: any) {
  let seq = doc.getIn(path)
  if (!seq) {
    doc.setIn(path, [])
    seq = doc.getIn(path)
  }
  if (isSeq(seq)) {
    seq.items.push(doc.createNode(item))
  }
}

/**
 * Removes an item from a sequence in the AST by its index.
 */
export function removeASTListItem(doc: Document, path: (string | number)[], index: number) {
  const seq = doc.getIn(path)
  if (isSeq(seq)) {
    seq.items.splice(index, 1)
  }
}

/**
 * Moves an item in a sequence in the AST from sourceIndex to destinationIndex.
 */
export function moveASTListItem(doc: Document, path: (string | number)[], sourceIndex: number, destinationIndex: number) {
  const seq = doc.getIn(path)
  if (isSeq(seq)) {
    const items = seq.items
    if (sourceIndex >= 0 && sourceIndex < items.length && destinationIndex >= 0 && destinationIndex < items.length) {
      const [moved] = items.splice(sourceIndex, 1)
      items.splice(destinationIndex, 0, moved)
    }
  }
}
