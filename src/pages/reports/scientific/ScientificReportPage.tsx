import { useSearchParams } from 'react-router-dom'
import { useScientificReport } from '@/hooks/useReports'
import { ReportView } from '../components/ReportView'

export default function ScientificReportPage() {
  const [searchParams] = useSearchParams()
  const educationYear = searchParams.get('educationYear')
  const universityCode = searchParams.get('universityCode') ?? undefined

  const { data, isLoading, isError, refetch } = useScientificReport({
    educationYear: educationYear ? Number(educationYear) : undefined,
    universityCode,
  })

  return (
    <ReportView
      title="Scientific report"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ educationYear: true, university: true }}
    />
  )
}
