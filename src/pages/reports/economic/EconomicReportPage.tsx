import { useSearchParams } from 'react-router-dom'
import { useEconomicReport } from '@/hooks/useReports'
import { ReportView } from '../components/ReportView'

export default function EconomicReportPage() {
  const [searchParams] = useSearchParams()
  const educationYear = searchParams.get('educationYear')
  const universityCode = searchParams.get('universityCode') ?? undefined

  const { data, isLoading, isError, refetch } = useEconomicReport({
    educationYear: educationYear ? Number(educationYear) : undefined,
    universityCode,
  })

  return (
    <ReportView
      title="Economic report"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ educationYear: true, university: true }}
    />
  )
}
