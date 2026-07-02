import { useSearchParams } from 'react-router-dom'
import { useInstitutionsReport } from '@/hooks/useReports'
import { ReportView } from '../components/ReportView'

export default function InstitutionsReportPage() {
  const [searchParams] = useSearchParams()
  const universityCode = searchParams.get('universityCode') ?? undefined

  const { data, isLoading, isError, refetch } = useInstitutionsReport({ universityCode })

  return (
    <ReportView
      title="Institutions report"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ university: true }}
    />
  )
}
