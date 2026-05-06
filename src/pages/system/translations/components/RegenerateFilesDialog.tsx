/**
 * Regenerate Properties Files Dialog
 *
 * Modal for confirming properties file regeneration
 */

import { useTranslation } from 'react-i18next'
import { FileCode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface RegenerateFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function RegenerateFilesDialog({
  open,
  onOpenChange,
  onConfirm,
}: RegenerateFilesDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--card-bg)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <FileCode className="h-6 w-6 text-[var(--primary)]" />
            {t('Regenerate properties files')}
          </DialogTitle>
          <DialogDescription className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
            {t(
              'Do you want to regenerate properties files for all languages? This may take a few seconds.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border-2 border-[var(--border-color-pro)] px-6 py-3 font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--hover-bg)]"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-[var(--primary-hover)] hover:shadow-xl"
          >
            {t('Yes, generate')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
