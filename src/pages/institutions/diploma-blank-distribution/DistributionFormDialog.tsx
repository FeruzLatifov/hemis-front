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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import {
  useDiplomaBlankDistributionDictionaries,
  useCreateDiplomaBlankDistribution,
  useUpdateDiplomaBlankDistribution,
} from '@/hooks/useDiplomaBlankDistribution'
import type { DiplomaBlankDistributionRow } from '@/api/diplomaBlankDistribution.api'

const schema = z
  .object({
    universityCode: z.string().min(1, { message: 'This field is required' }),
    educationYear: z.string().optional(),
    educationType: z.string().optional(),
    blankCategory: z.string().optional(),
    blankSeria: z.string().min(1, { message: 'This field is required' }),
    blankStartNumber: z.number({ message: 'This field is required' }).int().min(0),
    blankEndNumber: z.number({ message: 'This field is required' }).int().min(0),
    generateStatusCode: z.string().optional(),
    distributionDate: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((data) => data.blankEndNumber >= data.blankStartNumber, {
    message: 'End number must be greater than or equal to start number',
    path: ['blankEndNumber'],
  })

type FormValues = z.infer<typeof schema>

const DEFAULT_VALUES: FormValues = {
  universityCode: '',
  educationYear: '',
  educationType: '',
  blankCategory: '',
  blankSeria: '',
  blankStartNumber: 0,
  blankEndNumber: 0,
  generateStatusCode: '',
  distributionDate: '',
  note: '',
}

interface DistributionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: DiplomaBlankDistributionRow | null
}

export default function DistributionFormDialog({
  open,
  onOpenChange,
  editing,
}: DistributionFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!editing

  const { data: dictionaries, isLoading: loadingDictionaries } =
    useDiplomaBlankDistributionDictionaries()
  const createMutation = useCreateDiplomaBlankDistribution()
  const updateMutation = useUpdateDiplomaBlankDistribution()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        universityCode: editing.universityCode,
        educationYear: editing.educationYear ?? '',
        educationType: editing.educationType ?? '',
        blankCategory: editing.blankCategory ?? '',
        blankSeria: editing.blankSeria,
        blankStartNumber: editing.blankStartNumber,
        blankEndNumber: editing.blankEndNumber,
        generateStatusCode: editing.generateStatusCode ?? '',
        distributionDate: editing.distributionDate ?? '',
        note: editing.note ?? '',
      })
    } else {
      reset(DEFAULT_VALUES)
    }
  }, [open, editing, reset])

  const onSubmit = async (data: FormValues) => {
    const payload = {
      universityCode: data.universityCode,
      educationYear: data.educationYear ? data.educationYear : null,
      educationType: data.educationType ? data.educationType : null,
      blankCategory: data.blankCategory ? data.blankCategory : null,
      blankSeria: data.blankSeria,
      blankStartNumber: data.blankStartNumber,
      blankEndNumber: data.blankEndNumber,
      generateStatusCode: data.generateStatusCode ? data.generateStatusCode : null,
      distributionDate: data.distributionDate ? data.distributionDate : null,
      note: data.note ? data.note : null,
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('Edit distribution') : t('Add distribution')}</DialogTitle>
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

            {/* Education year */}
            <div className="space-y-1.5">
              <Label htmlFor="educationYear">{t('Education year')}</Label>
              <Controller
                control={control}
                name="educationYear"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="educationYear">
                      <SelectValue placeholder={t('Education year')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dictionaries?.educationYears ?? []).map((e) => (
                        <SelectItem key={e.code} value={e.code}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
            </div>

            {/* Blank category */}
            <div className="space-y-1.5">
              <Label htmlFor="blankCategory">{t('Blank category')}</Label>
              <Controller
                control={control}
                name="blankCategory"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="blankCategory">
                      <SelectValue placeholder={t('Blank category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dictionaries?.blankCategories ?? []).map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Series */}
            <div className="space-y-1.5">
              <Label htmlFor="blankSeria">{t('Series')}</Label>
              <Input id="blankSeria" {...register('blankSeria')} />
              {errors.blankSeria && (
                <p className="text-destructive text-sm">{t(errors.blankSeria.message ?? '')}</p>
              )}
            </div>

            {/* Start / End number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="blankStartNumber">{t('Start number')}</Label>
                <Input
                  id="blankStartNumber"
                  type="number"
                  {...register('blankStartNumber', { valueAsNumber: true })}
                />
                {errors.blankStartNumber && (
                  <p className="text-destructive text-sm">
                    {t(errors.blankStartNumber.message ?? '')}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blankEndNumber">{t('End number')}</Label>
                <Input
                  id="blankEndNumber"
                  type="number"
                  {...register('blankEndNumber', { valueAsNumber: true })}
                />
                {errors.blankEndNumber && (
                  <p className="text-destructive text-sm">
                    {t(errors.blankEndNumber.message ?? '')}
                  </p>
                )}
              </div>
            </div>

            {/* Generate status */}
            <div className="space-y-1.5">
              <Label htmlFor="generateStatusCode">{t('Status')}</Label>
              <Controller
                control={control}
                name="generateStatusCode"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="generateStatusCode">
                      <SelectValue placeholder={t('Status')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dictionaries?.generateStatuses ?? []).map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Distribution date */}
            <div className="space-y-1.5">
              <Label htmlFor="distributionDate">{t('Distribution date')}</Label>
              <Input id="distributionDate" type="date" {...register('distributionDate')} />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note">{t('Note')}</Label>
              <Textarea id="note" rows={3} {...register('note')} />
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
