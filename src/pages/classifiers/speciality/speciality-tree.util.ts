import type { SpecialityNode } from '@/api/speciality.api'

/** Newest edition year of a node; nodes without years sort last. */
function newestYear(node: SpecialityNode): number {
  return node.years && node.years.length > 0 ? Math.max(...node.years) : Number.NEGATIVE_INFINITY
}

/** Numeric value of a classifier code; missing/non-numeric codes sort last. */
function codeValue(node: SpecialityNode): number {
  if (!node.code) return Number.POSITIVE_INFINITY
  const n = Number.parseInt(node.code, 10)
  return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n
}

/**
 * Canonical display order for the speciality tree: newest edition year first
 * (2021 above 2020), then ascending numeric code. The backend currently returns
 * nodes in string (lexicographic) order, which interleaves the two code
 * generations (`0100000`, `100000`, `1000000`, `200000`…). This deep-sorts every
 * sibling level and returns a NEW tree — the input is never mutated.
 *
 * Mirror of the backend ORDER BY spec in
 * docs/speciality-tree-ordering-2026-07-20.md; remove once the backend applies it.
 */
export function sortSpecialityNodes(nodes: SpecialityNode[]): SpecialityNode[] {
  return [...nodes]
    .sort((a, b) => {
      const yearDiff = newestYear(b) - newestYear(a) // newest year first
      if (yearDiff !== 0) return yearDiff
      const codeDiff = codeValue(a) - codeValue(b) // ascending numeric code
      if (codeDiff !== 0) return codeDiff
      return a.nameUz.localeCompare(b.nameUz) // stable tiebreak
    })
    .map((node) =>
      node.children && node.children.length > 0
        ? { ...node, children: sortSpecialityNodes(node.children) }
        : node,
    )
}

/** True when the node's name (uz/ru/en) or code contains the lowercased query. */
function nodeMatches(node: SpecialityNode, q: string): boolean {
  const haystack =
    `${node.nameUz} ${node.nameRu ?? ''} ${node.nameEn ?? ''} ${node.code ?? ''}`.toLowerCase()
  return haystack.includes(q)
}

/**
 * Keeps nodes matching `query` (with their whole subtree) plus the ancestors of
 * any match, so matched leaves stay reachable. Empty query returns the input
 * untouched. Returns a NEW tree for the filtered branches.
 */
export function filterSpecialityNodes(nodes: SpecialityNode[], query: string): SpecialityNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return nodes

  const result: SpecialityNode[] = []
  for (const node of nodes) {
    if (nodeMatches(node, q)) {
      result.push(node) // self matches → keep the full subtree
      continue
    }
    const kids =
      node.children && node.children.length > 0 ? filterSpecialityNodes(node.children, q) : []
    if (kids.length > 0) result.push({ ...node, children: kids })
  }
  return result
}

/** IDs of every node that has children (for expand-all). */
export function collectExpandableIds(nodes: SpecialityNode[]): string[] {
  const ids: string[] = []
  const walk = (list: SpecialityNode[]) => {
    for (const node of list) {
      if (node.children && node.children.length > 0) {
        ids.push(node.id)
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return ids
}
