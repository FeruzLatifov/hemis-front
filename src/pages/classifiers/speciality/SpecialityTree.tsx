import { useTranslation } from 'react-i18next'
import { ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SpecialityNode } from '@/api/speciality.api'

interface SpecialityTreeProps {
  nodes: SpecialityNode[]
  /** Ids of expanded parents (controlled by the page). */
  openIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  /** Active search term — used to highlight matched text. */
  query?: string
}

/** Recursive, controlled-expansion classifier tree (parent_id hierarchy). */
export function SpecialityTree({ nodes, openIds, onToggle, onSelect, query }: SpecialityTreeProps) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNodeRow
          key={node.id}
          node={node}
          nested={false}
          isLast={false}
          openIds={openIds}
          onToggle={onToggle}
          onSelect={onSelect}
          query={query}
        />
      ))}
    </ul>
  )
}

function TreeNodeRow({
  node,
  nested,
  isLast,
  openIds,
  onToggle,
  onSelect,
  query,
}: {
  node: SpecialityNode
  /** True for every node below the root — draws the ├─/└─ connector. */
  nested: boolean
  /** Last sibling → the vertical guide stops at the elbow (└─ instead of ├─). */
  isLast: boolean
  openIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  query?: string
}) {
  const { t } = useTranslation()
  const hasChildren = node.children && node.children.length > 0
  const open = hasChildren && openIds.has(node.id)

  return (
    <li
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
      <div className="group hover:bg-muted flex items-center gap-1.5 rounded-md py-1 pr-2 transition-colors">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded"
            aria-label={open ? t('Collapse') : t('Expand')}
            aria-expanded={open}
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

        {hasChildren ? (
          open ? (
            <FolderOpen className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Folder className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
          )
        ) : null}

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded py-0.5 text-left focus-visible:outline-none"
        >
          {node.code ? (
            <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]">
              {node.code}
            </span>
          ) : null}
          <span className="text-foreground truncate text-sm">
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
      </div>

      {open && hasChildren ? (
        <ul className="ml-3 pl-3">
          {node.children.map((child, i) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              nested
              isLast={i === node.children.length - 1}
              openIds={openIds}
              onToggle={onToggle}
              onSelect={onSelect}
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
