import type { SpecialityNode, ReviewStatus } from '@/api/speciality.api'

/** Newest edition year of a node; nodes without years sort last within a code tie. */
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
 * Classifier edition rank. The legacy (2020) top-level codes carry a leading zero
 * (`0100000`…); the current (2021) edition does not (`100000`…). The current edition
 * sorts first. Keying the generation split on the CODE — not on the newest year in the
 * branch — is what keeps it stable: a branch that happens to hold newer (2023/2024/2026)
 * rows must NOT float above its same-edition siblings (the bug where Magistr `300000`,
 * which carries 2024 rows, jumped above `100000`/`200000`).
 */
function editionRank(node: SpecialityNode): number {
  return node.code?.startsWith('0') ? 1 : 0
}

/**
 * Canonical display order for the speciality tree: current edition first (the
 * `100000…` codes above the legacy `0100000…` ones), then ascending numeric code —
 * so the top level always reads in code order (100000, 200000, 300000, …) regardless
 * of which branch contains the newest admission years. Year only breaks a same-code
 * tie (newest edition first). The backend returns nodes in string (lexicographic)
 * order, which interleaves the two code generations (`0100000`, `100000`, `1000000`,
 * `200000`…); this deep-sorts every sibling level and returns a NEW tree — the input
 * is never mutated.
 *
 * Mirror of the backend ORDER BY spec in
 * docs/speciality-tree-ordering-2026-07-20.md; remove once the backend applies it.
 */
export function sortSpecialityNodes(nodes: SpecialityNode[]): SpecialityNode[] {
  return [...nodes]
    .sort((a, b) => {
      const genDiff = editionRank(a) - editionRank(b) // current edition (100000…) before legacy (0100000…)
      if (genDiff !== 0) return genDiff
      const codeDiff = codeValue(a) - codeValue(b) // ascending numeric code
      if (codeDiff !== 0) return codeDiff
      const yearDiff = newestYear(b) - newestYear(a) // same code → newest edition first
      if (yearDiff !== 0) return yearDiff
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
 * Prunes the tree to a single `reviewStatus`: keeps a node whose own status matches,
 * plus any ancestor of such a node (so the path stays reachable). Empty branches drop out.
 * Unlike the year prune (only leaves carry years), EVERY row carries a status — so a matched
 * folder keeps ONLY its matching descendants, never its non-matching subtree: picking
 * "Needs review" shows exactly the NEEDS_REVIEW rows and the folders that reach them, not the
 * APPROVED rows underneath a flagged parent. Returns a NEW tree; composes with the year/text filters.
 */
export function filterSpecialityNodesByStatus(
  nodes: SpecialityNode[],
  reviewStatus: ReviewStatus,
): SpecialityNode[] {
  const result: SpecialityNode[] = []
  for (const node of nodes) {
    const kids =
      node.children && node.children.length > 0
        ? filterSpecialityNodesByStatus(node.children, reviewStatus)
        : []
    if (node.reviewStatus === reviewStatus || kids.length > 0) {
      result.push({ ...node, children: kids })
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

/**
 * i18n key naming the taxonomy step of a stored `hierarchyLevel` (1-based):
 * 1 → Field of knowledge (Bilim sohasi), 2 → Field of education (Ta'lim sohasi),
 * 3 → Direction (Yo'nalish), 4 → Sub-direction (Ichki yo'nalish). Every seeded
 * `h_speciality` row is 1–4; returns null outside that range so callers degrade
 * gracefully (show the bare number / omit the label). Caller wraps in t().
 */
export function specialityLevelKey(level: number | null | undefined): string | null {
  switch (level) {
    case 1:
      return 'Field of knowledge'
    case 2:
      return 'Field of education'
    case 3:
      return 'Direction'
    case 4:
      return 'Sub-direction'
    default:
      return null
  }
}

export interface FlatSpecialityOption {
  id: string
  code?: string
  nameUz: string
  hierarchyLevel?: number
}

/**
 * Pre-order (parent-before-children) flattening of the tree into a flat option list —
 * the source for the create form's searchable parent picker. Keeps the caller's node
 * order, so sort/filter upstream if a specific order is wanted.
 */
export function flattenSpecialityTree(
  nodes: SpecialityNode[],
  acc: FlatSpecialityOption[] = [],
): FlatSpecialityOption[] {
  for (const node of nodes) {
    acc.push({
      id: node.id,
      code: node.code,
      nameUz: node.nameUz,
      hierarchyLevel: node.hierarchyLevel,
    })
    if (node.children && node.children.length > 0) flattenSpecialityTree(node.children, acc)
  }
  return acc
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
