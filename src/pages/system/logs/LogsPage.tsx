import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuditStats } from '@/hooks/useAuditLogs'
import { UI } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { LogsStatsCards, ActivityLogsTab, ErrorLogsTab, LoginLogsTab } from './components'

export default function LogsPage() {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const search = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)

  const statsParams = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [dateFrom, dateTo],
  )

  const { data: stats, isLoading: statsLoading } = useAuditStats(statsParams)

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <ScrollText className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">{t('Audit Logs')}</h1>
            <p className="text-muted-foreground">{t('Audit information')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <LogsStatsCards data={stats} isLoading={statsLoading} />

      {/* Global filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('Search...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[160px]"
          placeholder={t('Date from')}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[160px]"
          placeholder={t('Date to')}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">{t('Activity')}</TabsTrigger>
          <TabsTrigger value="errors">{t('Errors')}</TabsTrigger>
          <TabsTrigger value="login">{t('Login')}</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <ActivityLogsTab search={search} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorLogsTab search={search} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="login">
          <LoginLogsTab search={search} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
