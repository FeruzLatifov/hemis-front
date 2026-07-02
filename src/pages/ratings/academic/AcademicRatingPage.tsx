import { useSearchParams } from 'react-router-dom'
import { useAcademicRating } from '@/hooks/useRatings'
import { ReportView } from '@/pages/reports/components/ReportView'

export default function AcademicRatingPage() {
  const [searchParams] = useSearchParams()
  const educationYear = searchParams.get('educationYear')
  const universityCode = searchParams.get('universityCode') ?? undefined

  const { data, isLoading, isError, refetch } = useAcademicRating({
    educationYear: educationYear ? Number(educationYear) : undefined,
    universityCode,
  })

  return (
    <ReportView
      title="Academic rating"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ educationYear: true, university: true }}
    />
  )
}
