import { useState } from 'react'
import { ChevronRight, FolderTree, Dot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { SpecialityNode } from '@/api/speciality.api'

interface SpecialityTreeProps {
  nodes: SpecialityNode[]
  onSelect: (id: string) => void
}

/** Recursive, lazily-expanded classifier tree (parent_id hierarchy). */
export function SpecialityTree({ nodes, onSelect }: SpecialityTreeProps) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNodeRow key={node.id} node={node} depth={0} onSelect={onSelect} />
      ))}
    </ul>
  )
}

function TreeNodeRow({
  node,
  depth,
  onSelect,
}: {
  node: SpecialityNode
  depth: number
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <li>
      <div
        className="dark:hover:bg-muted flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-[#F5F6FA]"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#6B7280] hover:bg-[#E5E7EB]"
            aria-label={open ? 'Collapse' : 'Expand'}
            aria-expanded={open}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#B0B7C3]">
            <Dot className="h-4 w-4" />
          </span>
        )}

        {hasChildren ? <FolderTree className="h-4 w-4 shrink-0 text-[#2F80ED]" /> : null}

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {node.code ? (
            <span className="shrink-0 font-mono text-xs text-[#6B7280]">{node.code}</span>
          ) : null}
          <span className="dark:text-foreground truncate text-sm text-[#1E2124]">
            {node.nameUz}
          </span>
          {node.years && node.years.length > 0 ? (
            <span className="shrink-0 text-xs text-[#B0B7C3]">{node.years.join(', ')}</span>
          ) : null}
          {node.reviewStatus === 'NEEDS_REVIEW' ? (
            <Badge
              variant="outline"
              className="shrink-0 border-[#F2C94C] bg-[#FEF7E0] text-[10px] text-[#B7791F]"
            >
              ●
            </Badge>
          ) : null}
        </button>
      </div>

      {open && hasChildren ? (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNodeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
