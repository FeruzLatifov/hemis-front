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

/**
 * Prunes the tree to a single edition `year`: keeps a leaf whose `years` include it,
 * and any ancestor of such a leaf (so the path stays reachable). Empty branches drop out.
 * Mirrors the backend `retainYearBranches` — only leaves carry years, so a branch survives
 * solely through kept descendants. Returns a NEW tree; composes with the text filter.
 */
export function filterSpecialityNodesByYear(
  nodes: SpecialityNode[],
  year: number,
): SpecialityNode[] {
  const result: SpecialityNode[] = []
  for (const node of nodes) {
    const kids =
      node.children && node.children.length > 0
        ? filterSpecialityNodesByYear(node.children, year)
        : []
    const selfMatches = node.years?.includes(year) ?? false
    if (kids.length > 0) {
      result.push({ ...node, children: kids })
    } else if (selfMatches) {
      result.push(node)
    }
  }
  return result
}

/**
 * Root→…→node chain for `id` (inclusive), or `[]` when absent. Walks the nested
 * tree once. Powers the detail-panel breadcrumb — the only reliable way to tell
 * apart a code that repeats across levels (e.g. `60110100` on a folder and its
 * leaves), since name+code alone are ambiguous but the ancestry path is unique.
 */
export function findNodePath(nodes: SpecialityNode[], id: string): SpecialityNode[] {
  for (const node of nodes) {
    if (node.id === id) return [node]
    if (node.children && node.children.length > 0) {
      const sub = findNodePath(node.children, id)
      if (sub.length > 0) return [node, ...sub]
    }
  }
  return []
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
