import { useSearchParams } from 'react-router-dom'
import { useStudentsReport } from '@/hooks/useReports'
import { ReportView } from '../components/ReportView'

export default function StudentsReportPage() {
  const [searchParams] = useSearchParams()
  const educationYear = searchParams.get('educationYear')
  const universityCode = searchParams.get('universityCode') ?? undefined
  const educationType = searchParams.get('educationType') ?? undefined

  const { data, isLoading, isError, refetch } = useStudentsReport({
    educationYear: educationYear ? Number(educationYear) : undefined,
    universityCode,
    educationType,
  })

  return (
    <ReportView
      title="Students report"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ educationYear: true, university: true }}
    />
  )
}
