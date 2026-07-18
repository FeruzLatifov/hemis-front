import { describe, it, expect } from 'vitest'
import { toCsv } from '../csv'

describe('toCsv', () => {
  it('joins cells with commas and rows with CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 'd'],
      ]),
    ).toBe('a,b\r\nc,d')
  })

  it('quotes cells containing commas, quotes, or newlines', () => {
    expect(toCsv([['a,b', 'c"d', 'e\nf']])).toBe('"a,b","c""d","e\nf"')
  })

  it('renders null/undefined as empty cells', () => {
    expect(toCsv([[null, undefined, 0]])).toBe(',,0')
  })

  it('preserves numbers', () => {
    expect(toCsv([['count', 42]])).toBe('count,42')
  })
})
