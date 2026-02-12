/**
 * Clear Cache Confirmation Dialog
 *
 * Modal for confirming cache clearing operation
 */

import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface ClearCacheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ClearCacheDialog({ open, onOpenChange, onConfirm }: ClearCacheDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Trash2 className="h-6 w-6 text-yellow-500" />
            {t('Clear cache')}
          </DialogTitle>
          <DialogDescription className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-300">
            {t(
              'Do you want to clear translations cache? This will force reload translations from backend.',
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
            className="rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-yellow-600 hover:shadow-xl"
          >
            {t('Yes, clear')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
