import { describe, it, expect } from 'vitest'
import {
  sortSpecialityNodes,
  filterSpecialityNodes,
  collectExpandableIds,
} from '../speciality-tree.util'
import type { SpecialityNode } from '@/api/speciality.api'

function node(partial: Partial<SpecialityNode> & { id: string }): SpecialityNode {
  return {
    code: undefined,
    nameUz: partial.id,
    educationLevel: 'BACHELOR',
    reviewStatus: 'APPROVED',
    active: true,
    isChecked: false,
    years: [],
    children: [],
    ...partial,
  }
}

describe('sortSpecialityNodes', () => {
  it('orders by newest year first, then ascending numeric code', () => {
    const input = [
      node({ id: 'a', code: '0100000', years: [2020] }),
      node({ id: 'b', code: '200000', years: [2021] }),
      node({ id: 'c', code: '5350800', years: [2020] }),
      node({ id: 'd', code: '100000', years: [2021] }),
      node({ id: 'e', code: '1000000', years: [2021] }),
    ]

    const codes = sortSpecialityNodes(input).map((n) => n.code)

    // 2021 group first (100000, 200000, 1000000), then 2020 group (0100000→100000, 5350800)
    expect(codes).toEqual(['100000', '200000', '1000000', '0100000', '5350800'])
  })

  it('does not mutate the input array', () => {
    const input = [
      node({ id: 'a', code: '200000', years: [2021] }),
      node({ id: 'b', code: '100000', years: [2021] }),
    ]
    const snapshot = input.map((n) => n.id)
    sortSpecialityNodes(input)
    expect(input.map((n) => n.id)).toEqual(snapshot)
  })

  it('sorts nested children recursively', () => {
    const input = [
      node({
        id: 'root',
        code: '100000',
        years: [2021],
        children: [
          node({ id: 'c2', code: '110200', years: [2021] }),
          node({ id: 'c1', code: '110100', years: [2021] }),
        ],
      }),
    ]
    const childCodes = sortSpecialityNodes(input)[0].children.map((n) => n.code)
    expect(childCodes).toEqual(['110100', '110200'])
  })

  it('places nodes without years or code last', () => {
    const input = [
      node({ id: 'noyear', code: '100000', years: [] }),
      node({ id: 'withyear', code: '900000', years: [2021] }),
    ]
    expect(sortSpecialityNodes(input).map((n) => n.id)).toEqual(['withyear', 'noyear'])
  })
})

describe('filterSpecialityNodes', () => {
  const tree = [
    node({
      id: 'root',
      nameUz: 'Gumanitar soha',
      code: '0100000',
      children: [node({ id: 'child', nameUz: 'Filologiya', code: '0100100' })],
    }),
    node({ id: 'other', nameUz: 'Xizmatlar', code: '1000000' }),
  ]

  it('returns the input unchanged for an empty query', () => {
    expect(filterSpecialityNodes(tree, '   ')).toBe(tree)
  })

  it('keeps ancestors of a matching descendant', () => {
    const result = filterSpecialityNodes(tree, 'filolog')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('root')
    expect(result[0].children.map((n) => n.id)).toEqual(['child'])
  })

  it('matches on code and keeps the whole matched subtree', () => {
    const result = filterSpecialityNodes(tree, '0100000')
    expect(result).toHaveLength(1)
    expect(result[0].children).toHaveLength(1)
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterSpecialityNodes(tree, 'zzz-nomatch')).toEqual([])
  })
})

describe('collectExpandableIds', () => {
  it('returns only ids of nodes that have children', () => {
    const tree = [
      node({ id: 'p1', children: [node({ id: 'leaf1' })] }),
      node({ id: 'leaf2' }),
      node({ id: 'p2', children: [node({ id: 'p3', children: [node({ id: 'leaf3' })] })] }),
    ]
    expect(collectExpandableIds(tree).sort()).toEqual(['p1', 'p2', 'p3'])
  })
})
