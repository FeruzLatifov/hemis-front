import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GraduationCap,
  Hash,
  Calendar,
  Network,
  Info,
  Pencil,
  Fingerprint,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useSpecialityDetail } from '@/hooks/useSpeciality'
import { specialityLevelKey } from './speciality-tree.util'

function Field({ icon, label, value }: { icon: ReactNode; label: string; value?: ReactNode }) {
  return (
    <div>
      <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </label>
      <p className="text-base font-medium">{value ?? '-'}</p>
    </div>
  )
}

/**
 * Read-only detail body for a single speciality — rendered inside the SpecialityDetailDialog
 * (opened from both the tree and list views). Works for ANY hierarchy level (L1–L4).
 *
 * <p>Editing no longer happens inline here: the Edit button calls {@link onEdit}, which opens the
 * dedicated {@link SpecialityEditDialog} form (mirrors the Add form). Edit is gated by `canEdit`.</p>
 */
export function SpecialityDetailContent({
  specialityId,
  canEdit,
  onEdit,
  hideStatusCard = false,
}: {
  specialityId: string
  canEdit: boolean
  /** Open the dedicated edit form for this row. */
  onEdit: () => void
  /** The dialog renders level/status in its identity header, so it hides the
   *  redundant status card here. */
  hideStatusCard?: boolean
}) {
  const { t } = useTranslation()
  const { data: node, isLoading, error } = useSpecialityDetail(specialityId)

  // Level number + its taxonomy name (e.g. "1 — Bilim sohasi") — a bare number is
  // opaque, so we spell out the step when it's one of the known 1–4 levels.
  const levelKey = specialityLevelKey(node?.hierarchyLevel)

  return (
    // min-w-0: this is a grid item of DialogContent (display:grid). Without it the item's
    // min-width:auto lets a wide unbreakable child (a `truncate`/nowrap sub-speciality name)
    // expand the whole modal, pushing the justify-end Edit toolbar past the right edge.
    <div className="animate-fade-in min-w-0 space-y-4">
      {/* Action toolbar — a single Edit button; the form opens as a dedicated dialog. */}
      {canEdit && node ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {t('Edit')}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="mb-2 h-5 w-32" />
              <Skeleton className="h-6 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
          <p className="text-red-600 dark:text-red-400">{t('Failed to load data')}</p>
        </Card>
      ) : node ? (
        <>
          {!hideStatusCard ? (
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={node.educationType === '11' ? 'default' : 'secondary'}>
                  {node.educationTypeName ??
                    (node.educationType === '11' ? t('Bachelor') : t('Master'))}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    node.reviewStatus === 'NEEDS_REVIEW'
                      ? 'border-[#F2C94C] bg-[#FEF7E0] text-[#B7791F]'
                      : 'border-[#27AE60] bg-[#E9F9EF] text-[#1E8449]'
                  }
                >
                  {node.reviewStatus === 'NEEDS_REVIEW' ? t('Needs review') : t('Approved')}
                </Badge>
              </div>
            </Card>
          ) : null}

          <Card className="space-y-4 p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {t('Basic information')}
            </h3>
            <Field icon={<Hash className="h-4 w-4" />} label={t('Code')} value={node.code} />
            <Field
              icon={<GraduationCap className="h-4 w-4" />}
              label={`${t('Name')} (UZ)`}
              value={node.nameUz}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={`${t('Name')} (OZ)`}
              value={node.nameOz}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={`${t('Name')} (RU)`}
              value={node.nameRu}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={`${t('Name')} (EN)`}
              value={node.nameEn}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Years')}
              value={node.years && node.years.length > 0 ? node.years.join(', ') : '-'}
            />
            <Field
              icon={<Network className="h-4 w-4" />}
              label={t('Hierarchy level')}
              value={
                node.hierarchyLevel != null
                  ? levelKey
                    ? `${node.hierarchyLevel} — ${t(levelKey)}`
                    : node.hierarchyLevel
                  : '-'
              }
            />
            <Field icon={<Tag className="h-4 w-4" />} label={t('Version')} value={node.version} />
            <Field
              icon={<Fingerprint className="h-4 w-4" />}
              label={t('UUID')}
              value={<span className="font-mono text-xs break-all">{node.id}</span>}
            />
          </Card>

          {node.children && node.children.length > 0 ? (
            <Card className="space-y-2 p-4">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {t('Sub-specialities')} ({node.children.length})
              </h3>
              <ul className="space-y-1">
                {node.children.map((c) => (
                  <li key={c.id} className="flex min-w-0 items-center gap-2 text-sm">
                    {c.code ? (
                      <span className="shrink-0 font-mono text-xs text-[#6B7280]">{c.code}</span>
                    ) : null}
                    <span className="min-w-0 truncate">{c.nameUz}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
