import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, GraduationCap, Hash, Calendar, Network, Info, Pencil, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSpecialityDetail, useUpdateSpeciality } from '@/hooks/useSpeciality'
import type { EducationLevel, ReviewStatus } from '@/api/speciality.api'

interface SpecialityDetailDrawerProps {
  specialityId: string
  canEdit: boolean
  onClose: () => void
}

interface EditState {
  code: string
  nameUz: string
  nameRu: string
  nameEn: string
  educationLevel: EducationLevel
  reviewStatus: ReviewStatus
  years: string
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
}) {
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

export default function SpecialityDetailDrawer({
  specialityId,
  canEdit,
  onClose,
}: SpecialityDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: node, isLoading, error } = useSpecialityDetail(specialityId)
  const updateMutation = useUpdateSpeciality()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditState | null>(null)

  useEffect(() => {
    if (node && editing && !form) {
      setForm({
        code: node.code ?? '',
        nameUz: node.nameUz,
        nameRu: node.nameRu ?? '',
        nameEn: node.nameEn ?? '',
        educationLevel: node.educationLevel,
        reviewStatus: node.reviewStatus,
        years: (node.years ?? []).join(', '),
      })
    }
  }, [node, editing, form])

  const startEdit = () => {
    setEditing(true)
    setForm(null)
  }

  const handleSave = async () => {
    if (!form) return
    const years = form.years
      .split(',')
      .map((y) => parseInt(y.trim(), 10))
      .filter((y) => !Number.isNaN(y))
    await updateMutation.mutateAsync({
      id: specialityId,
      payload: {
        code: form.code.trim() || undefined,
        nameUz: form.nameUz.trim(),
        nameRu: form.nameRu.trim() || undefined,
        nameEn: form.nameEn.trim() || undefined,
        educationLevel: form.educationLevel,
        reviewStatus: form.reviewStatus,
        years,
      },
    })
    setEditing(false)
    setForm(null)
  }

  const set = (patch: Partial<EditState>) => setForm((f) => (f ? { ...f, ...patch } : f))

  return (
    <div
      role="button"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className="bg-background h-full w-full max-w-2xl overflow-y-auto border-l shadow-lg duration-300">
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <GraduationCap className="text-primary h-6 w-6 shrink-0" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : node?.nameUz}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  `${t('Code')}: ${node?.code ?? '-'}`
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            {t('Close')}
          </Button>
        </div>

        <div className="space-y-6 p-6">
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
              <p className="text-red-600">{t('Failed to load data')}</p>
            </Card>
          ) : node ? (
            <>
              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Info className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={node.educationLevel === 'BACHELOR' ? 'default' : 'secondary'}>
                    {node.educationLevel === 'BACHELOR' ? t('Bachelor') : t('Master')}
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

              {editing && form ? (
                <Card className="space-y-4 p-4">
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    {t('Edit')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>{t('Code')}</Label>
                      <Input value={form.code} onChange={(e) => set({ code: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('Education level')}</Label>
                      <Select
                        value={form.educationLevel}
                        onValueChange={(v) => set({ educationLevel: v as EducationLevel })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BACHELOR">{t('Bachelor')}</SelectItem>
                          <SelectItem value="MASTER">{t('Master')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>{t('Name')} (UZ)</Label>
                    <Input value={form.nameUz} onChange={(e) => set({ nameUz: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>{t('Name')} (RU)</Label>
                      <Input
                        value={form.nameRu}
                        onChange={(e) => set({ nameRu: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('Name')} (EN)</Label>
                      <Input
                        value={form.nameEn}
                        onChange={(e) => set({ nameEn: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>{t('Years')}</Label>
                      <Input
                        value={form.years}
                        placeholder="2023, 2024, 2025"
                        onChange={(e) => set({ years: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('Review status')}</Label>
                      <Select
                        value={form.reviewStatus}
                        onValueChange={(v) => set({ reviewStatus: v as ReviewStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPROVED">{t('Approved')}</SelectItem>
                          <SelectItem value="NEEDS_REVIEW">{t('Needs review')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ) : (
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
                    value={node.hierarchyLevel ?? '-'}
                  />
                </Card>
              )}

              {node.children && node.children.length > 0 ? (
                <Card className="space-y-2 p-4">
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    {t('Sub-specialities')} ({node.children.length})
                  </h3>
                  <ul className="space-y-1">
                    {node.children.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 text-sm">
                        {c.code ? (
                          <span className="font-mono text-xs text-[#6B7280]">{c.code}</span>
                        ) : null}
                        <span className="truncate">{c.nameUz}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>

        {canEdit && node ? (
          <div className="bg-background sticky bottom-0 flex gap-2 border-t px-6 py-4">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditing(false)
                    setForm(null)
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={updateMutation.isPending || !form?.nameUz.trim()}
                >
                  <Save className="h-4 w-4" />
                  {t('Save')}
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={startEdit}>
                <Pencil className="h-4 w-4" />
                {t('Edit')}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
