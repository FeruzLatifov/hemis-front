import { useTranslation } from 'react-i18next'
import { GraduationCap, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useSpecialityDetail } from '@/hooks/useSpeciality'
import type { SpecialityNode, SpecialityRow } from '@/api/speciality.api'
import { SpecialityDetailContent } from './SpecialityDetailContent'
import { specialityLevelKey } from './speciality-tree.util'

/**
 * Centered "Ko'rish / Tahrirlash" modal for a single speciality — opened from the
 * per-row action button (tree view). Replaces the always-docked master-detail
 * panel: the classifier stays full-width and details pop over on demand.
 *
 * Header mirrors the old panel identity block (breadcrumb ancestry + name · code ·
 * level/status), so `SpecialityDetailContent` hides its redundant status card. The
 * breadcrumb navigates in place (`onNavigate` swaps the shown node without closing).
 */
export function SpecialityDetailDialog({
  specialityId,
  canEdit,
  canDelete,
  path,
  headerFallback,
  onNavigate,
  onEdit,
  onDelete,
  onOpenChange,
}: {
  /** Node to show; `null` keeps the dialog closed. */
  specialityId: string | null
  canEdit: boolean
  canDelete: boolean
  /** Root→shown chain (from the in-memory tree) — drives the breadcrumb. */
  path: SpecialityNode[]
  /** Instant header data when `path` is empty (list view — the tree isn't loaded);
   *  the fetched detail replaces it once ready, avoiding a placeholder-header flash. */
  headerFallback?: SpecialityRow
  /** Jump to an ancestor from the breadcrumb (swaps content, stays open). */
  onNavigate: (id: string) => void
  /** Open the dedicated edit form for the currently shown node. */
  onEdit: (id: string) => void
  /** Open the delete confirmation for the currently shown node. */
  onDelete: (id: string) => void
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  // Fresh node (reflects edits after invalidation); the tree node is the instant
  // fallback while the detail query loads. Deduped by TanStack — no extra request.
  const { data: detail } = useSpecialityDetail(specialityId)

  const node = detail ?? path[path.length - 1] ?? headerFallback
  const ancestors = path.slice(0, -1)
  const levelKey = specialityLevelKey(node?.hierarchyLevel)

  return (
    <Dialog open={specialityId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-2 pr-6">
            <GraduationCap className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="leading-snug break-words">
                {node?.nameUz ?? t('Speciality')}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                {`${t('Code')}: ${node?.code ?? '-'}`}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {node ? (
                  <Badge variant={node.educationType === '11' ? 'default' : 'secondary'}>
                    {node.educationTypeName ??
                      (node.educationType === '11' ? t('Bachelor') : t('Master'))}
                  </Badge>
                ) : null}
                {node ? (
                  <Badge
                    variant="outline"
                    className={
                      node.reviewStatus === 'NEEDS_REVIEW'
                        ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }
                  >
                    {node.reviewStatus === 'NEEDS_REVIEW' ? t('Needs review') : t('Approved')}
                  </Badge>
                ) : null}
                {levelKey ? (
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                    {t(levelKey)}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {ancestors.length > 0 ? (
            <nav
              aria-label={t('Location')}
              className="text-muted-foreground mt-2 flex flex-wrap items-center gap-y-1 border-t pt-2 text-xs"
            >
              {ancestors.map((a, i) => (
                <span key={a.id} className="flex items-center">
                  {i > 0 ? (
                    <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onNavigate(a.id)}
                    className="hover:text-foreground max-w-[220px] truncate rounded px-1 py-0.5 hover:underline"
                    title={a.nameUz}
                  >
                    {a.nameUz}
                  </button>
                </span>
              ))}
            </nav>
          ) : null}
        </DialogHeader>

        {/* key → reset edit state when the shown node changes (breadcrumb jump). */}
        {specialityId ? (
          <SpecialityDetailContent
            key={specialityId}
            specialityId={specialityId}
            canEdit={canEdit}
            onEdit={() => onEdit(specialityId)}
            canDelete={canDelete}
            onDelete={() => onDelete(specialityId)}
            hideStatusCard
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default SpecialityDetailDialog
