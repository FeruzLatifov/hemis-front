import { useSearchParams } from 'react-router-dom'
import { useTeachersReport } from '@/hooks/useReports'
import { ReportView } from '../components/ReportView'

export default function TeachersReportPage() {
  const [searchParams] = useSearchParams()
  const universityCode = searchParams.get('universityCode') ?? undefined
  const academicDegree = searchParams.get('academicDegree') ?? undefined

  const { data, isLoading, isError, refetch } = useTeachersReport({
    universityCode,
    academicDegree,
  })

  return (
    <ReportView
      title="Teachers report"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ university: true }}
    />
  )
}
