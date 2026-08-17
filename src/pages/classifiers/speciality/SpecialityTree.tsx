import { useEffect, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Folder, FolderOpen, Eye, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import type { SpecialityNode } from '@/api/speciality.api'
import { specialityLevelKey } from './speciality-tree.util'

interface SpecialityTreeProps {
  nodes: SpecialityNode[]
  /** Ids of expanded parents (controlled by the page). */
  openIds: Set<string>
  /** Id of the currently selected row — its detail shows in the side panel. */
  selectedId: string | null
  onToggle: (id: string) => void
  /** Select a row (drives the highlight + keyboard navigation). */
  onSelect: (id: string) => void
  /** Open the "Ko'rish" detail+edit modal for a row. */
  onOpenDetail: (id: string) => void
  /** Active search term — used to highlight matched text. */
  query?: string
}

// Level-differentiated typography: depth is encoded with weight/size/tint, not
// just indentation — so the 4 levels read as a hierarchy and a code that repeats
// across levels (e.g. 60110100 on a folder and its leaves) is distinguishable.
const NAME_CLASS = [
  'text-sm font-semibold uppercase tracking-wide', // L1
  'text-sm font-medium', // L2
  'text-[13px]', // L3
  'text-[13px] text-foreground/80', // L4+
]
const CHIP_CLASS = [
  'border border-primary/30 bg-primary/5 text-primary', // L1
  'bg-muted text-foreground', // L2
  'bg-muted text-muted-foreground', // L3
  'bg-transparent text-muted-foreground/70', // L4+
]
const levelClass = (arr: string[], depth: number) => arr[Math.min(depth, arr.length - 1)]

interface FlatNode {
  id: string
  depth: number
  hasChildren: boolean
  open: boolean
}

/** Currently-visible nodes in display order — the model keyboard nav walks. */
function flattenVisible(
  nodes: SpecialityNode[],
  openIds: Set<string>,
  depth = 0,
  acc: FlatNode[] = [],
): FlatNode[] {
  for (const node of nodes) {
    const hasChildren = !!(node.children && node.children.length > 0)
    const open = hasChildren && openIds.has(node.id)
    acc.push({ id: node.id, depth, hasChildren, open })
    if (open) flattenVisible(node.children, openIds, depth + 1, acc)
  }
  return acc
}

/**
 * Recursive, controlled-expansion classifier tree (parent_id hierarchy) with
 * roving keyboard navigation over the visible rows: ↑/↓ move the selection,
 * →/← expand/collapse (or step into child / up to parent), Home/End jump to the
 * ends. The selected row is always scrolled into view (keyboard or breadcrumb).
 */
export function SpecialityTree({
  nodes,
  openIds,
  selectedId,
  onToggle,
  onSelect,
  onOpenDetail,
  query,
}: SpecialityTreeProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!selectedId) return
    document.getElementById(`spec-node-${selectedId}`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  const handleKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    // Enter / Space open the detail modal for the selected row. Always swallow
    // Space so a keyboard user on a freshly-focused tree (nothing selected yet)
    // never scrolls the page — the browser's default Space-scroll would otherwise
    // fire on this focusable <ul>.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (selectedId) onOpenDetail(selectedId)
      return
    }
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const flat = flattenVisible(nodes, openIds)
    if (flat.length === 0) return
    e.preventDefault()
    const idx = flat.findIndex((n) => n.id === selectedId)
    const cur = idx >= 0 ? flat[idx] : undefined

    switch (e.key) {
      case 'ArrowDown':
        onSelect(flat[idx < 0 ? 0 : Math.min(idx + 1, flat.length - 1)].id)
        break
      case 'ArrowUp':
        onSelect(flat[idx < 0 ? 0 : Math.max(idx - 1, 0)].id)
        break
      case 'Home':
        onSelect(flat[0].id)
        break
      case 'End':
        onSelect(flat[flat.length - 1].id)
        break
      case 'ArrowRight':
        if (!cur) onSelect(flat[0].id)
        else if (cur.hasChildren && !cur.open) onToggle(cur.id)
        else if (cur.hasChildren && cur.open && idx + 1 < flat.length) onSelect(flat[idx + 1].id)
        break
      case 'ArrowLeft':
        if (!cur) break
        if (cur.hasChildren && cur.open) {
          onToggle(cur.id) // collapse
        } else {
          for (let i = idx - 1; i >= 0; i--) {
            if (flat[i].depth === cur.depth - 1) {
              onSelect(flat[i].id) // step up to parent
              break
            }
          }
        }
        break
    }
  }

  return (
    <ul
      role="tree"
      tabIndex={0}
      aria-label={t('Speciality classifier')}
      aria-activedescendant={selectedId ? `spec-node-${selectedId}` : undefined}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-ring space-y-0.5 rounded focus-visible:ring-2 focus-visible:outline-none"
    >
      {nodes.map((node) => (
        <TreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          isLast={false}
          openIds={openIds}
          selectedId={selectedId}
          onToggle={onToggle}
          onSelect={onSelect}
          onOpenDetail={onOpenDetail}
          query={query}
        />
      ))}
    </ul>
  )
}

function TreeNodeRow({
  node,
  depth,
  isLast,
  openIds,
  selectedId,
  onToggle,
  onSelect,
  onOpenDetail,
  query,
}: {
  node: SpecialityNode
  /** 0 at the root; drives level typography, aria-level, and the ├─/└─ connector. */
  depth: number
  /** Last sibling → the vertical guide stops at the elbow (└─ instead of ├─). */
  isLast: boolean
  openIds: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onOpenDetail: (id: string) => void
  query?: string
}) {
  const { t } = useTranslation()
  const hasChildren = node.children && node.children.length > 0
  const open = hasChildren && openIds.has(node.id)
  const isSelected = selectedId === node.id
  const nested = depth > 0
  // Taxonomy step for this row — prefer the authoritative stored level, fall back
  // to tree depth (they align: a root is level 1). Names the row's place in the
  // 4-level hierarchy (Bilim sohasi → Ta'lim sohasi → Yo'nalish → Ichki yo'nalish).
  const rowLevel = node.hierarchyLevel ?? depth + 1
  const levelKey = specialityLevelKey(rowLevel)

  // Single click selects the row; a folder also expands/collapses. Double-click
  // opens the detail modal (a folder's two toggles cancel out — net-zero flicker).
  const handleClick = () => {
    onSelect(node.id)
    if (hasChildren) onToggle(node.id)
  }

  return (
    <li
      id={`spec-node-${node.id}`}
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? open : undefined}
      className={cn(
        // Vertical guide + horizontal elbow, drawn with pseudo-elements so the
        // last sibling gets a proper └─ (guide clipped to the row) not a ├─.
        nested && [
          'relative',
          'before:absolute before:top-0 before:left-[-12px] before:w-px before:bg-slate-400 dark:before:bg-slate-500',
          isLast ? 'before:h-4' : 'before:h-full',
          'after:absolute after:top-4 after:left-[-12px] after:h-px after:w-3 after:bg-slate-400 dark:after:bg-slate-500',
        ],
      )}
    >
      <div
        className={cn(
          // Reserve the left accent (transparent) on every row so selecting one
          // never shifts the layout; the active row fills it + a soft background.
          'group flex items-center gap-1.5 rounded-md border-l-2 py-1 pr-2 transition-colors',
          isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted border-transparent',
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onToggle(node.id)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded"
            aria-label={open ? t('Collapse') : t('Expand')}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <span
              className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-500"
              aria-hidden="true"
            />
          </span>
        )}

        {/* Folder icon only on the top two taxonomy levels (Bilim sohasi, Ta'lim sohasi); levels 3+
            (Yo'nalish / Ichki yo'nalish) drop it so their code column aligns cleanly on one line. */}
        {hasChildren && rowLevel <= 2 ? (
          open ? (
            <FolderOpen className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Folder className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
          )
        ) : null}

        <button
          type="button"
          tabIndex={-1}
          onClick={handleClick}
          onDoubleClick={() => onOpenDetail(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded py-0.5 text-left focus-visible:outline-none"
        >
          {node.code ? (
            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]',
                levelClass(CHIP_CLASS, depth),
              )}
            >
              {node.code}
            </span>
          ) : null}
          <span className={cn('truncate', levelClass(NAME_CLASS, depth))} title={node.nameUz}>
            <Highlight text={node.nameUz} query={query} />
          </span>
          {hasChildren ? (
            <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-1.5 text-[11px]">
              {node.children.length}
            </span>
          ) : null}
          {node.years && node.years.length > 0 ? (
            <span className="text-muted-foreground/70 shrink-0 text-[11px]">
              {node.years.join(', ')}
            </span>
          ) : null}
          {node.reviewStatus === 'NEEDS_REVIEW' ? (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
              title={t('Needs review')}
              aria-label={t('Needs review')}
            />
          ) : null}
        </button>

        {/* Version + active state — inline metadata so the user reads them straight off
            the row (no need to open the detail). Compact chips, right-aligned before the
            level pill: a muted mono "v{n}" and a green/red active pill. */}
        <span
          className="bg-muted text-muted-foreground ml-1 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
          title={t('Version')}
        >
          v{node.version}
        </span>
        {/* UUID — short prefix + copy icon; click copies the FULL id (stopPropagation so
            it never toggles/selects the row). Tooltip shows the whole UUID. */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation()
            void copyToClipboard(node.id).then((ok) =>
              ok ? toast.success(t('Copied')) : toast.error(t('Copy failed')),
            )
          }}
          title={node.id}
          aria-label={`${t('Copy')} — ${node.id}`}
          className="text-muted-foreground/80 hover:text-foreground hover:bg-muted flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]"
        >
          <span>{node.id}</span>
          <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />
        </button>
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap',
            node.active
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400',
          )}
          title={node.active ? t('Active') : t('Inactive')}
        >
          {node.active ? t('Active') : t('Inactive')}
        </span>

        {/* Taxonomy-level name — fills the row's open right area on wide screens
            (gated at lg so it never crushes the primary name at narrow/medium
            widths, where indentation + the level-tinted code chip already convey
            rank). bg-foreground/10 keeps the pill visible in BOTH themes — plain
            bg-muted equals the card in dark mode, so it would vanish there. */}
        {levelKey ? (
          <span
            className="bg-foreground/10 text-muted-foreground ml-2 hidden shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap lg:inline-block"
            title={t('Hierarchy level')}
          >
            {t(levelKey)}
          </span>
        ) : null}

        {/* Per-row action — labelled + always visible (quiet at rest, emphasised on
            row hover) so it is discoverable. Double-click the row, or Enter/Space on
            the selected row (roving-tabindex tree), open the same modal. */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${t('View')} — ${node.nameUz}`}
          onClick={() => onOpenDetail(node.id)}
          className="text-primary border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground hover:border-primary flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium opacity-90 transition-all group-hover:opacity-100 hover:shadow-sm"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="whitespace-nowrap">{t('View')}</span>
        </button>
      </div>

      {open && hasChildren ? (
        <ul role="group" className="ml-3 pl-3">
          {node.children.map((child, i) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.length - 1}
              openIds={openIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onOpenDetail={onOpenDetail}
              query={query}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/** Highlights the first case-insensitive occurrence of `query` inside `text`. */
function Highlight({ text, query }: { text: string; query?: string }) {
  const q = query?.trim()
  if (!q) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-200/60 text-inherit dark:bg-amber-500/30">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}
