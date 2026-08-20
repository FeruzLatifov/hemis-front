import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AlertTriangle, ExternalLink, Info, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useDeleteSpeciality,
  useSpecialityAttachedUniversities,
  useSpecialityDetail,
} from '@/hooks/useSpeciality'

/**
 * Delete confirmation for a single speciality — deliberately four-state (blocked by status,
 * blocked by children, blocked by OTM attachments, or confirmable), because a classifier row is
 * shared reference data and only a NEEDS_REVIEW leaf nobody is attached to may ever go.
 *
 * <p>The backend re-checks every one of these guards and answers 422, so this is not the
 * enforcement point: it exists so the admin sees WHY a row cannot be deleted and what to do next
 * (delete the sub-directions, move each one under another parent, or revoke the attachments)
 * without spending a round trip. The node is re-fetched here rather than passed in, so the UI
 * judges the same data the server does — the UI explains up front, the server still has the last
 * word.</p>
 */
export function SpecialityDeleteDialog({
  specialityId,
  onOpenChange,
  onDeleted,
  onMoveChild,
}: {
  /** Row to delete; `null` keeps the dialog closed. */
  specialityId: string | null
  onOpenChange: (open: boolean) => void
  /** The row is gone — the page drops its selection/detail state. */
  onDeleted: () => void
  /** Re-parent one child instead of deleting it: opens that child's edit form (level + parent
   *  are changed there). */
  onMoveChild: (childId: string) => void
}) {
  const { t } = useTranslation()
  const { data: node, isLoading, error } = useSpecialityDetail(specialityId)
  const deleteMutation = useDeleteSpeciality()

  const children = node?.children ?? []
  const wrongStatus = node != null && node.reviewStatus !== 'NEEDS_REVIEW'
  // Only ask about attachments once the earlier blockers are ruled out — a status/children block
  // already tells the admin what to do, so the extra request would explain nothing.
  const attachmentsEnabled = node != null && !wrongStatus && children.length === 0
  const { data: attached, isLoading: attachedLoading } = useSpecialityAttachedUniversities(
    specialityId,
    attachmentsEnabled,
  )
  const universities = attached ?? []
  // Some OTM holds a revoked attachment — worth a footnote, because "0 live" still blocks.
  const hasRevoked = universities.some((u) => u.total > u.live)
  // Everything must be true at once — a loaded, NEEDS_REVIEW, childless, unattached row. While
  // the attachment lookup is in flight the blocker is still unknown, so no Delete button yet.
  // A failed lookup leaves the list empty and lets the attempt through: the server guards it.
  const canConfirm = attachmentsEnabled && !attachedLoading && universities.length === 0
  const pending = deleteMutation.isPending

  // Deep link into the attachment registry, pre-filtered to THIS speciality (and, per row, to that
  // one OTM) — the admin lands on exactly the rows that block the delete instead of the whole
  // registry. Built from the `specialityId` prop, which is what the dialog is already keyed on.
  const attachmentsHref = (universityCode?: string) => {
    const params = new URLSearchParams()
    if (universityCode) params.set('universityCode', universityCode)
    if (specialityId) params.set('specialityId', specialityId)
    return `/institutions/speciality-attachments?${params.toString()}`
  }

  return (
    <AlertDialog open={specialityId != null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Delete speciality')}</AlertDialogTitle>
          <AlertDialogDescription>
            {node ? (
              <>
                {node.code ? <span className="font-mono">{node.code} — </span> : null}
                {node.nameUz}
              </>
            ) : error ? (
              t('Failed to load data')
            ) : (
              t('Loading...')
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading || error ? null : wrongStatus ? (
          <p className="flex items-start gap-2 rounded-[6px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t('Only a speciality with the "Needs review" status can be deleted')}
          </p>
        ) : children.length > 0 ? (
          <div className="min-w-0 space-y-3">
            <p className="flex items-start gap-2 rounded-[6px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t(
                'This speciality has sub-directions. Delete them first, or move them under another parent.',
              )}
            </p>
            <div className="min-w-0 space-y-1">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {t('Sub-specialities')} ({children.length})
              </h3>
              <ul className="max-h-56 space-y-1 overflow-y-auto">
                {children.map((c) => (
                  <li key={c.id} className="flex min-w-0 items-center gap-2 text-sm">
                    {c.code ? (
                      <span className="text-muted-foreground shrink-0 font-mono text-xs">
                        {c.code}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate" title={c.nameUz}>
                      {c.nameUz}
                    </span>
                    {/* A deactivated child blocks the delete just as an active one does (the FK
                        ignores `active`) — label it so the list explains itself. */}
                    {!c.active ? (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {t('Inactive')}
                      </Badge>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => onMoveChild(c.id)}
                    >
                      {t('Move')}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : attachedLoading ? (
          <p className="text-muted-foreground text-sm">{t('Loading...')}</p>
        ) : universities.length > 0 ? (
          <div className="min-w-0 space-y-3">
            <p className="flex items-start gap-2 rounded-[6px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t('This speciality is attached to universities. Remove those attachments first.')}
            </p>
            <div className="min-w-0 space-y-1">
              {/* The heading doubles as the way out: attachments are revoked on the registry
                  page — this jump narrows it to this speciality across every OTM. */}
              <h3 className="text-sm font-semibold tracking-wide uppercase">
                <Link
                  to={attachmentsHref()}
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                >
                  {t('Attached to universities')} ({universities.length})
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </h3>
              <ul className="max-h-56 space-y-1 overflow-y-auto">
                {universities.map((u) => (
                  <li key={u.universityCode} className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      {u.universityCode}
                    </span>
                    <span className="min-w-0 flex-1 truncate" title={u.universityName}>
                      {u.universityName}
                    </span>
                    {/* live / total — one number when they agree, else both: the gap is the
                        revoked rows, which the FK counts just the same. */}
                    <span
                      className="text-muted-foreground shrink-0 text-xs tabular-nums"
                      title={
                        u.total > u.live ? t('Revoked attachments also block deletion') : undefined
                      }
                    >
                      {u.total > u.live ? `${u.live} / ${u.total}` : u.total}
                    </span>
                    {/* Per-OTM jump — the registry filtered to this speciality AND this OTM.
                        Ghost button so the row balances the "Move" action in the children list. */}
                    <Button variant="ghost" size="sm" className="shrink-0" asChild>
                      <Link
                        to={attachmentsHref(u.universityCode)}
                        onClick={() => onOpenChange(false)}
                        title={t('Attached to universities')}
                        aria-label={`${t('Attached to universities')} — ${u.universityName}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
              {hasRevoked ? (
                <p className="text-muted-foreground flex items-start gap-1.5 pt-1 text-xs">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t('Revoked attachments also block deletion')}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t('This action cannot be undone')}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t('Cancel')}</AlertDialogCancel>
          {canConfirm ? (
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={pending}
              onClick={(e) => {
                // Keep the dialog open while the request is in flight (Radix closes it on click):
                // a 422 from a guard that changed under us must stay visible next to its toast.
                e.preventDefault()
                deleteMutation.mutate(node.id, { onSuccess: onDeleted })
              }}
            >
              {pending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t('Delete')}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default SpecialityDeleteDialog
