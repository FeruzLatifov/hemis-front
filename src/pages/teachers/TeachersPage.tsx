import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

export default function Teachers() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
            {t('Teachers')}
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">{t('Teacher list and monitoring')}</p>
        </div>
      </div>

      <Card className="border border-[var(--border-color-pro)] shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-24">
          <Users className="h-16 w-16 text-[var(--border-color-pro)]" />
          <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
            {t('This page is under development')}
          </h2>
          <p className="mt-2 max-w-md text-center text-sm text-[var(--text-secondary)]">
            {t('Teacher management features will be available once the backend API is ready')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
