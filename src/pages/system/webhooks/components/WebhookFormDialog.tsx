import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateWebhook, useUpdateWebhook } from '@/hooks/useWebhooks'
import type { WebhookSecretResponse, WebhookTargetDto } from '@/types/webhook.types'

interface Props {
  mode: 'create' | 'edit'
  initial?: WebhookTargetDto
  onClose: () => void
  onCreated: (secret: WebhookSecretResponse) => void
}

export default function WebhookFormDialog({ mode, initial, onClose, onCreated }: Props) {
  const { t } = useTranslation()
  const createMutation = useCreateWebhook()
  const updateMutation = useUpdateWebhook()

  const [universityCode, setUniversityCode] = useState(initial?.universityCode ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [timeoutMs, setTimeoutMs] = useState<number>(initial?.timeoutMs ?? 30000)
  const [maxRetries, setMaxRetries] = useState<number>(initial?.maxRetries ?? 3)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isPending = createMutation.isPending || updateMutation.isPending

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (mode === 'create' && !/^\d{3,10}$/.test(universityCode)) {
      next.universityCode = t('University code must be 3–10 digits')
    }
    if (timeoutMs < 1000 || timeoutMs > 60000) {
      next.timeoutMs = t('Timeout must be 1000–60000 ms')
    }
    if (maxRetries < 0 || maxRetries > 10) {
      next.maxRetries = t('Max retries must be 0–10')
    }
    if (description && description.length > 255) {
      next.description = t('Description must be ≤ 255 chars')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (mode === 'create') {
      createMutation.mutate(
        {
          universityCode,
          description: description || undefined,
          timeoutMs,
          maxRetries,
        },
        {
          onSuccess: (secret) => onCreated(secret),
        },
      )
    } else if (initial) {
      updateMutation.mutate(
        {
          id: initial.id,
          data: {
            description: description || undefined,
            timeoutMs,
            maxRetries,
          },
        },
        {
          onSuccess: onClose,
        },
      )
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('Add Webhook Target') : t('Edit Webhook Target')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t(
                  'Callback URL is derived from hemishe_e_university.student_url — set it in the university registry first.',
                )
              : t('OTM code and callback URL cannot be changed here.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="universityCode">{t('OTM Code')}</Label>
            <Input
              id="universityCode"
              value={universityCode}
              onChange={(e) => setUniversityCode(e.target.value)}
              disabled={mode === 'edit'}
              placeholder="337"
              maxLength={10}
            />
            {errors.universityCode && (
              <p className="mt-1 text-xs text-red-600">{errors.universityCode}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">{t('Description')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Andijon davlat universiteti')}
              maxLength={255}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="timeoutMs">{t('Timeout (ms)')}</Label>
              <Input
                id="timeoutMs"
                type="number"
                min={1000}
                max={60000}
                step={1000}
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(parseInt(e.target.value, 10) || 0)}
              />
              {errors.timeoutMs && <p className="mt-1 text-xs text-red-600">{errors.timeoutMs}</p>}
            </div>
            <div>
              <Label htmlFor="maxRetries">{t('Max retries')}</Label>
              <Input
                id="maxRetries"
                type="number"
                min={0}
                max={10}
                step={1}
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value, 10) || 0)}
              />
              {errors.maxRetries && (
                <p className="mt-1 text-xs text-red-600">{errors.maxRetries}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mode === 'create' ? t('Create') : t('Save')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
