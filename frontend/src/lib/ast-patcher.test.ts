import { describe, it, expect } from 'vitest'
import { parseDocument } from 'yaml'
import {
  setASTField,
  appendASTListItem,
  removeASTListItem,
  moveASTListItem,
} from './ast-patcher'

describe('AST Patcher Utilities', () => {
  it('updates a simple value and preserves comments', () => {
    const yaml = `
# Comment at top
person:
  name: Germain # inline comment
  profession: Dev
`
    const doc = parseDocument(yaml)
    setASTField(doc, ['person', 'name'], 'Germain Lefebvre')

    const result = doc.toString()
    expect(result).toContain('# Comment at top')
    expect(result).toContain('name: Germain Lefebvre # inline comment')
    expect(result).toContain('profession: Dev')
  })

  it('deletes a field if value is empty/null/undefined and not required', () => {
    const yaml = `
person:
  location: Paris
  citizenship: French
`
    const doc = parseDocument(yaml)
    // Non-required field is deleted when empty
    setASTField(doc, ['person', 'citizenship'], '')
    expect(doc.toString()).not.toContain('citizenship')

    // Required field is kept as empty string
    setASTField(doc, ['person', 'name'], '')
    expect(doc.toString()).toContain('name: ""')
  })

  it('appends an item to a list and preserves adjacent items', () => {
    const yaml = `
career:
  - companyName: Company A
    missions: []
`
    const doc = parseDocument(yaml)
    appendASTListItem(doc, ['career'], { companyName: 'Company B', missions: [] })

    const result = doc.toString()
    expect(result).toContain('companyName: Company A')
    expect(result).toContain('companyName: Company B')
  })

  it('removes an item from a list by index', () => {
    const yaml = `
career:
  - companyName: Company A
  - companyName: Company B
`
    const doc = parseDocument(yaml)
    removeASTListItem(doc, ['career'], 0)

    const result = doc.toString()
    expect(result).not.toContain('Company A')
    expect(result).toContain('Company B')
  })

  it('moves/re-orders items in a list', () => {
    const yaml = `
career:
  - companyName: Company A # first
  - companyName: Company B # second
`
    const doc = parseDocument(yaml)
    moveASTListItem(doc, ['career'], 1, 0) // move second to first

    const result = doc.toString()
    // Check that B is now above A
    const bIndex = result.indexOf('Company B')
    const aIndex = result.indexOf('Company A')
    expect(bIndex).toBeLessThan(aIndex)
    expect(result).toContain('# first')
    expect(result).toContain('# second')
  })

  it('verifies that extremely long strings are not wrapped when using lineWidth: 0', () => {
    const yaml = `
person:
  profession: Short title
`
    const doc = parseDocument(yaml)
    const longString = 'This is an extremely long title that would normally exceed any standard line width of eighty characters and trigger auto wrapping or fold lines in standard serializers'
    setASTField(doc, ['person', 'profession'], longString)

    const result = doc.toString({ lineWidth: 0 })
    expect(result).toContain(`profession: ${longString}`)
    expect(result).not.toContain('\n    ') // no folded indentation wraps
  })
})
