import { useTranslation } from 'react-i18next'
import { Activity, AlertTriangle, LogIn, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AuditStats } from '@/types/audit.types'

interface LogsStatsCardsProps {
  data: AuditStats | undefined
  isLoading: boolean
}

export function LogsStatsCards({ data, isLoading }: LogsStatsCardsProps) {
  const { t } = useTranslation()

  const cards = [
    {
      label: t('Total activities'),
      value: data?.totalActivities ?? 0,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('Total errors'),
      value: data?.totalErrors ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: t('Total logins'),
      value: data?.totalLogins ?? 0,
      icon: LogIn,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t('Top user'),
      value: data?.topUsers?.[0]?.username ?? '-',
      subtitle: data?.topUsers?.[0] ? `${data.topUsers[0].count} ${t('actions')}` : undefined,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{card.label}</p>
                <p className="text-xl font-semibold">{card.value}</p>
                {card.subtitle && <p className="text-muted-foreground text-xs">{card.subtitle}</p>}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
