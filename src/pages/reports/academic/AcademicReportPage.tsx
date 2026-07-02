import { useSearchParams } from 'react-router-dom'
import { useAcademicReport } from '@/hooks/useReports'
import { ReportView } from '../components/ReportView'

export default function AcademicReportPage() {
  const [searchParams] = useSearchParams()
  const educationYear = searchParams.get('educationYear')
  const universityCode = searchParams.get('universityCode') ?? undefined
  const educationType = searchParams.get('educationType') ?? undefined

  const { data, isLoading, isError, refetch } = useAcademicReport({
    educationYear: educationYear ? Number(educationYear) : undefined,
    universityCode,
    educationType,
  })

  return (
    <ReportView
      title="Academic report"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ educationYear: true, university: true }}
    />
  )
}
