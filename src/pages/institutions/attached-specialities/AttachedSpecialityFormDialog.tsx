import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import {
  useAttachedSpecialityDictionaries,
  useCreateAttachedSpeciality,
  useUpdateAttachedSpeciality,
} from '@/hooks/useAttachedSpecialities'
import type { AttachedSpecialityRow, SpecialityLevel } from '@/api/attachedSpecialities.api'

const LEVEL_OPTIONS: { value: SpecialityLevel; label: string }[] = [
  { value: 'BACHELOR', label: 'Bachelor' },
  { value: 'MASTER', label: 'Master' },
  { value: 'ORDINATURA', label: 'Ordinatura' },
  { value: 'DOCTORAL', label: 'Doctoral' },
]

const schema = z.object({
  universityCode: z.string().min(1, { message: 'This field is required' }),
  educationType: z.string().min(1, { message: 'This field is required' }),
  educationForm: z.string().optional(),
  specialityLevel: z.enum(['BACHELOR', 'MASTER', 'ORDINATURA', 'DOCTORAL']),
  specialityId: z.string().min(1, { message: 'This field is required' }),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const DEFAULT_VALUES: FormValues = {
  universityCode: '',
  educationType: '',
  educationForm: '',
  specialityLevel: 'BACHELOR',
  specialityId: '',
  active: true,
}

interface AttachedSpecialityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: AttachedSpecialityRow | null
}

export default function AttachedSpecialityFormDialog({
  open,
  onOpenChange,
  editing,
}: AttachedSpecialityFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!editing

  const { data: dictionaries, isLoading: loadingDictionaries } = useAttachedSpecialityDictionaries()
  const createMutation = useCreateAttachedSpeciality()
  const updateMutation = useUpdateAttachedSpeciality()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  // Sync form values whenever the dialog opens (create → blank, edit → row values).
  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        universityCode: editing.universityCode,
        educationType: editing.educationType,
        educationForm: editing.educationForm ?? '',
        specialityLevel: editing.specialityLevel,
        specialityId: editing.specialityId,
        active: editing.active,
      })
    } else {
      reset(DEFAULT_VALUES)
    }
  }, [open, editing, reset])

  const selectedLevel = watch('specialityLevel')
  const specialityOptions = dictionaries?.specialities[selectedLevel] ?? []

  const onSubmit = async (data: FormValues) => {
    const payload = {
      universityCode: data.universityCode,
      educationType: data.educationType,
      educationForm: data.educationForm ? data.educationForm : null,
      specialityLevel: data.specialityLevel,
      specialityId: data.specialityId,
      active: data.active,
    }
    if (isEdit && editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('Edit attached speciality') : t('Add attached speciality')}
          </DialogTitle>
        </DialogHeader>

        {loadingDictionaries ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* University */}
            <div className="space-y-1.5">
              <Label htmlFor="universityCode">{t('University')}</Label>
              <Controller
                control={control}
                name="universityCode"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <SelectTrigger id="universityCode">
                      <SelectValue placeholder={t('University')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dictionaries?.universities ?? []).map((u) => (
                        <SelectItem key={u.code} value={u.code}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.universityCode && (
                <p className="text-destructive text-sm">{t(errors.universityCode.message ?? '')}</p>
              )}
            </div>

            {/* Education type */}
            <div className="space-y-1.5">
              <Label htmlFor="educationType">{t('Education type')}</Label>
              <Controller
                control={control}
                name="educationType"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="educationType">
                      <SelectValue placeholder={t('Education type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dictionaries?.educationTypes ?? []).map((e) => (
                        <SelectItem key={e.code} value={e.code}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.educationType && (
                <p className="text-destructive text-sm">{t(errors.educationType.message ?? '')}</p>
              )}
            </div>

            {/* Education form (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="educationForm">{t('Education form')}</Label>
              <Controller
                control={control}
                name="educationForm"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="educationForm">
                      <SelectValue placeholder={t('Education form')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dictionaries?.educationForms ?? []).map((e) => (
                        <SelectItem key={e.code} value={e.code}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Speciality level */}
            <div className="space-y-1.5">
              <Label htmlFor="specialityLevel">{t('Speciality level')}</Label>
              <Controller
                control={control}
                name="specialityLevel"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Clear the speciality when the level changes — the picker
                      // is sourced from dictionaries.specialities[level].
                      setValue('specialityId', '')
                    }}
                  >
                    <SelectTrigger id="specialityLevel">
                      <SelectValue placeholder={t('Speciality level')} />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {t(o.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Speciality */}
            <div className="space-y-1.5">
              <Label htmlFor="specialityId">{t('Speciality')}</Label>
              <Controller
                control={control}
                name="specialityId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="specialityId">
                      <SelectValue placeholder={t('Speciality')} />
                    </SelectTrigger>
                    <SelectContent>
                      {specialityOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.specialityId && (
                <p className="text-destructive text-sm">{t(errors.specialityId.message ?? '')}</p>
              )}
            </div>

            {/* Active */}
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-color-pro)] bg-[var(--table-row-alt)] p-3">
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Checkbox
                    id="active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <Label htmlFor="active" className="cursor-pointer text-sm font-medium">
                {t('Active')}
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
