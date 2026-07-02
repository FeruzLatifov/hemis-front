import { useSearchParams } from 'react-router-dom'
import { useScientificRating } from '@/hooks/useRatings'
import { ReportView } from '@/pages/reports/components/ReportView'

export default function ScientificRatingPage() {
  const [searchParams] = useSearchParams()
  const universityCode = searchParams.get('universityCode') ?? undefined

  const { data, isLoading, isError, refetch } = useScientificRating({
    universityCode,
  })

  return (
    <ReportView
      title="Scientific rating"
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      filters={{ educationYear: false, university: true }}
    />
  )
}
