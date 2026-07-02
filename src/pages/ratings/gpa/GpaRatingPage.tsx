import { useSearchParams } from 'react-router-dom'
import { useGpaRating } from '@/hooks/useRatings'
import { ReportView } from '@/pages/reports/components/ReportView'

/**
 * Student GPA leaderboard. Per the design system, GPA is the accent-gold (#F2C94C)
 * surface, so we scope a gold tint onto the headline KPI card's value. The gold
 * lives on a thin wrapper (ReportView/ReportKpiCards stay shared + unchanged):
 * the arbitrary variant targets only the first KPI card's animated value.
 */
export default function GpaRatingPage() {
  const [searchParams] = useSearchParams()
  const universityCode = searchParams.get('universityCode') ?? undefined

  const { data, isLoading, isError, refetch } = useGpaRating({
    universityCode,
  })

  return (
    <div className="[&_.grid>*:first-child_.text-2xl]:!text-[#F2C94C]">
      <ReportView
        title="Student GPA"
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        filters={{ educationYear: false, university: true }}
      />
    </div>
  )
}
