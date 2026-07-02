import { useSearchParams } from 'react-router-dom'
import { useAdministrativeRating } from '@/hooks/useRatings'
import { ReportView } from '@/pages/reports/components/ReportView'

export default function AdministrativeRatingPage() {
  const [searchParams] = useSearchParams()
  const educationYear = searchParams.get('educationYear')
  const universityCode = searchParams.get('universityCode') ?? undefined

  const { data, isLoading, isError, refetch } = useAdministrativeRating({
    educationYear: educationYear ? Number(educationYear) : undefined,
    universityCode,
  })

  return (
    <ReportView
      title="Administrative rating"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ educationYear: true, university: true }}
    />
  )
}
