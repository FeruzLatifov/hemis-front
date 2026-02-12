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
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <FileCode className="h-6 w-6" style={{ color: 'var(--primary)' }} />
            {t('Regenerate properties files')}
          </DialogTitle>
          <DialogDescription className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-300">
            {t(
              'Do you want to regenerate properties files for all languages? This may take a few seconds.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)'
            }}
          >
            {t('Yes, generate')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
