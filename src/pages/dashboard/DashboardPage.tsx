import {
  Users,
  GraduationCap,
  Building2,
  Award,
  ArrowUpRight,
  BookOpen,
  FlaskConical,
  Target,
  Sparkles,
  Trophy,
  Calendar,
  DollarSign,
  Activity,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CountUp from 'react-countup'
import { cn } from '@/lib/utils'
import { useDashboardStats } from '@/hooks/useDashboard'
import { formatDistanceToNow } from 'date-fns'
import { uz } from 'date-fns/locale'
import { ru } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n/config'

const dateFnsLocales = { uz, ru, en: enUS } as const

export default function Dashboard() {
  const { t } = useTranslation()
  // Fetch real data from API
  const { data: dashboardData, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg text-red-600">{t('Failed to load data')}</p>
          <p className="text-sm text-slate-600">{t('Please refresh the page')}</p>
        </div>
      </div>
    )
  }

  // Prepare stats cards from API data (flat colors, no gradients)
  const stats = [
    {
      name: t('Currently studying'),
      value: dashboardData?.overview.activeStudents || 0,
      change: 0,
      trending: 'up' as const,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: t('Graduates'),
      value: dashboardData?.overview.graduatedStudents || 0,
      change: 0,
      trending: 'up' as const,
      icon: Award,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      name: t('Expelled'),
      value: dashboardData?.overview.expelledStudents || 0,
      change: 0,
      trending: 'down' as const,
      icon: Users,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      name: t('Total Teachers'),
      value: dashboardData?.overview.totalTeachers || 0,
      change: 0,
      trending: 'up' as const,
      icon: GraduationCap,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
  ]

  const secondaryStats = [
    {
      name: t('Academic Leave'),
      value: dashboardData?.overview.academicLeaveStudents || 0,
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      name: t('Cancelled'),
      value: dashboardData?.overview.cancelledStudents || 0,
      icon: Users,
      color: 'bg-gray-500',
    },
    {
      name: t('Total HEIs'),
      value: dashboardData?.overview.totalUniversities || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: t('Issued Diplomas'),
      value: dashboardData?.overview.totalDiplomas || 0,
      icon: Award,
      color: 'bg-blue-500',
    },
  ]

  // Map education types with icons
  const educationTypeIcons: Record<string, LucideIcon> = {
    Bakalavr: BookOpen,
    Magistr: Target,
    Ordinatura: Sparkles,
  }

  const educationTypeColors: Record<string, string> = {
    Bakalavr: 'bg-blue-500',
    Magistr: 'bg-blue-600',
    Ordinatura: 'bg-blue-400',
  }

  const totalStudents = dashboardData?.overview.activeStudents || 1 // Only active students for percentages
  const educationTypes =
    dashboardData?.educationTypes.map((et) => ({
      name: et.name,
      count: et.count,
      percent: Math.round((et.count / totalStudents) * 100),
      color: educationTypeColors[et.name] || 'bg-gray-500',
      icon: educationTypeIcons[et.name] || BookOpen,
    })) || []

  const topUniversities = dashboardData?.topUniversities || []
  const recentActivities =
    dashboardData?.recentActivities.map((activity) => ({
      ...activity,
      icon: Users,
      color: 'text-blue-600',
      timeFormatted: activity.time
        ? formatDistanceToNow(new Date(activity.time), {
            addSuffix: true,
            locale: dateFnsLocales[i18n.language as keyof typeof dateFnsLocales] || uz,
          })
        : t('unknown'),
    })) || []

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
            {t('STATISTICS')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('Monitoring and analysis of higher education system of the Republic of Uzbekistan')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            2024/2025 {t('academic year')}
          </Badge>
          <Button variant="default" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            {t('Get report')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.name}
            className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${stat.color} text-white shadow-lg`}
                >
                  <stat.icon className="h-7 w-7" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.name}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                <CountUp end={stat.value} duration={2.5} separator="," />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat) => (
          <Card
            key={stat.name}
            className="border-0 shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color} text-white shadow-md`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{stat.name}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    <CountUp end={stat.value} duration={2} separator="," />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Education Types */}
        <Card className="border-0 shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              {t('Education types')}
            </CardTitle>
            <CardDescription>{t('Distribution by education levels')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {educationTypes.map((type) => (
              <div key={type.name} className="group">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${type.color} text-white shadow-md`}
                    >
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{type.name}</p>
                      <p className="text-sm text-slate-500">
                        <CountUp end={type.count} duration={2} separator="," /> {t('student')}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {type.percent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full ${type.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${type.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Universities */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              {t('TOP Universities')}
            </CardTitle>
            <CardDescription>{t('Top 5 by rating')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUniversities.map((uni) => (
                <div
                  key={uni.rank}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg font-bold text-white shadow-lg',
                        uni.rank === 1
                          ? 'bg-yellow-500'
                          : uni.rank === 2
                            ? 'bg-gray-400'
                            : uni.rank === 3
                              ? 'bg-amber-600'
                              : 'bg-slate-500',
                      )}
                    >
                      {uni.rank === 1 ? <Trophy className="h-6 w-6" /> : `#${uni.rank}`}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 transition-colors group-hover:text-[var(--primary)] dark:text-white dark:group-hover:text-blue-400">
                        {uni.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          <Users className="mr-1 inline h-4 w-4" />
                          {uni.studentCount.toLocaleString()} {t('student')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {t('Grant:')} {uni.grantCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                <Activity className="h-5 w-5" />
              </div>
              {t('Recent activity')}
            </CardTitle>
            <CardDescription>{t('Changes in last 24 hours')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${activity.color} bg-opacity-10`}
                  >
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                      {activity.name}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-slate-500">
                    {activity.timeFormatted}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 bg-blue-50 shadow-lg dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {t('Quick info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-green-200 bg-white p-4 dark:border-green-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('Grant students')}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    <CountUp
                      end={dashboardData?.overview.grantStudents || 0}
                      duration={2}
                      separator=","
                    />
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="rounded-lg border-2 border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('Contract students')}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    <CountUp
                      end={dashboardData?.overview.contractStudents || 0}
                      duration={2}
                      separator=","
                    />
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="rounded-lg border-2 border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('Scientific projects')}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    <CountUp
                      end={dashboardData?.overview.totalProjects || 0}
                      duration={2}
                      separator=","
                    />
                  </p>
                </div>
                <FlaskConical className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="rounded-lg border-2 border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('Scientific publications')}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    <CountUp
                      end={dashboardData?.overview.totalPublications || 0}
                      duration={2}
                      separator=","
                    />
                  </p>
                </div>
                <BookOpen className="h-10 w-10 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
