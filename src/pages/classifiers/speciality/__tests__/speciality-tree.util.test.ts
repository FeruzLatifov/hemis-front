import { describe, it, expect } from 'vitest'
import {
  sortSpecialityNodes,
  filterSpecialityNodes,
  filterSpecialityNodesByStatus,
  collectExpandableIds,
  findNodePath,
} from '../speciality-tree.util'
import type { SpecialityNode } from '@/api/speciality.api'

function node(partial: Partial<SpecialityNode> & { id: string }): SpecialityNode {
  return {
    code: undefined,
    nameUz: partial.id,
    educationType: '11',
    reviewStatus: 'APPROVED',
    active: true,
    isChecked: false,
    years: [],
    children: [],
    ...partial,
  }
}

describe('sortSpecialityNodes', () => {
  it('orders the current edition (no leading-zero code) first, then ascending numeric code', () => {
    const input = [
      node({ id: 'a', code: '0100000', years: [2020] }),
      node({ id: 'b', code: '200000', years: [2021] }),
      node({ id: 'c', code: '5350800', years: [2020] }),
      node({ id: 'd', code: '100000', years: [2021] }),
      node({ id: 'e', code: '1000000', years: [2021] }),
    ]

    const codes = sortSpecialityNodes(input).map((n) => n.code)

    // Current edition (no leading zero) by numeric code, THEN the legacy leading-zero codes.
    // Independent of years: a branch's newest year never reorders the top level.
    expect(codes).toEqual(['100000', '200000', '1000000', '5350800', '0100000'])
  })

  it('keeps a branch with newer inner years in its code position (no float to the top)', () => {
    // Regression: Magistr 300000 carries 2021/2023/2024 rows; it must stay after 200000,
    // not jump above the other 2021-edition branches on account of its 2024 rows.
    const input = [
      node({ id: 'a', code: '100000', years: [2021] }),
      node({ id: 'b', code: '200000', years: [2021] }),
      node({ id: 'c', code: '300000', years: [2021, 2023, 2024] }),
      node({ id: 'd', code: '400000', years: [2021] }),
    ]
    expect(sortSpecialityNodes(input).map((n) => n.code)).toEqual([
      '100000',
      '200000',
      '300000',
      '400000',
    ])
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

  it('sorts by code and places a code-less node last', () => {
    const input = [
      node({ id: 'nocode', code: undefined, years: [2021] }),
      node({ id: 'lo', code: '100000', years: [] }),
      node({ id: 'hi', code: '900000', years: [2021] }),
    ]
    // Code order (100000 before 900000, regardless of years); the code-less node sorts last.
    expect(sortSpecialityNodes(input).map((n) => n.id)).toEqual(['lo', 'hi', 'nocode'])
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

describe('filterSpecialityNodesByStatus', () => {
  it('keeps NEEDS_REVIEW rows and the ancestors reaching them, dropping approved-only branches', () => {
    const tree = [
      node({
        id: 'root',
        reviewStatus: 'APPROVED',
        children: [
          node({ id: 'needs', reviewStatus: 'NEEDS_REVIEW' }),
          node({ id: 'ok', reviewStatus: 'APPROVED' }),
        ],
      }),
      node({ id: 'approvedRoot', reviewStatus: 'APPROVED' }),
    ]
    const result = filterSpecialityNodesByStatus(tree, 'NEEDS_REVIEW')
    // approvedRoot (no matching descendant) is dropped; the ancestor 'root' survives to reach 'needs'.
    expect(result.map((n) => n.id)).toEqual(['root'])
    // Sibling 'ok' (APPROVED) is pruned — only the matching child remains.
    expect(result[0].children.map((n) => n.id)).toEqual(['needs'])
  })

  it('isolates a matched folder from its non-matching children', () => {
    const tree = [
      node({
        id: 'folder',
        reviewStatus: 'NEEDS_REVIEW',
        children: [node({ id: 'child', reviewStatus: 'APPROVED' })],
      }),
    ]
    const result = filterSpecialityNodesByStatus(tree, 'NEEDS_REVIEW')
    expect(result.map((n) => n.id)).toEqual(['folder'])
    // A flagged parent shows alone — its APPROVED subtree is not dragged into the review view.
    expect(result[0].children).toEqual([])
  })

  it('does not mutate the input array', () => {
    const tree = [node({ id: 'a', reviewStatus: 'NEEDS_REVIEW' })]
    const snapshot = tree[0]
    filterSpecialityNodesByStatus(tree, 'NEEDS_REVIEW')
    expect(tree[0]).toBe(snapshot)
  })

  it('returns an empty array when nothing matches', () => {
    const tree = [node({ id: 'a', reviewStatus: 'APPROVED' })]
    expect(filterSpecialityNodesByStatus(tree, 'NEEDS_REVIEW')).toEqual([])
  })
})

describe('findNodePath', () => {
  const tree = [
    node({
      id: 'l1',
      code: '100000',
      children: [
        node({
          id: 'l2',
          code: '110000',
          children: [
            node({
              id: 'folder',
              code: '60110100',
              children: [node({ id: 'leaf', code: '60110100' })],
            }),
          ],
        }),
      ],
    }),
    node({ id: 'other', code: '200000' }),
  ]

  it('returns the full root→node chain (inclusive)', () => {
    expect(findNodePath(tree, 'leaf').map((n) => n.id)).toEqual(['l1', 'l2', 'folder', 'leaf'])
  })

  it('disambiguates a code repeated across levels by its unique path', () => {
    // folder and leaf share code 60110100 but resolve to different paths
    expect(findNodePath(tree, 'folder').map((n) => n.id)).toEqual(['l1', 'l2', 'folder'])
    expect(findNodePath(tree, 'leaf').map((n) => n.id)).toEqual(['l1', 'l2', 'folder', 'leaf'])
  })

  it('returns a single-element chain for a root node', () => {
    expect(findNodePath(tree, 'other').map((n) => n.id)).toEqual(['other'])
  })

  it('returns an empty array when the id is absent', () => {
    expect(findNodePath(tree, 'zzz')).toEqual([])
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
