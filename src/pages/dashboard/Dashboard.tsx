import { Users, GraduationCap, Building2, Award, TrendingUp, TrendingDown, ArrowUpRight, BookOpen, FlaskConical, Target, Sparkles, Star, Trophy, Calendar, DollarSign, Activity, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CountUp from 'react-countup'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/api/dashboard.api'
import { formatDistanceToNow } from 'date-fns'
import { uz } from 'date-fns/locale'

export default function Dashboard() {
  // Fetch real data from API
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">Ma'lumotlarni yuklashda xatolik</p>
          <p className="text-sm text-slate-600">Iltimos, sahifani yangilang</p>
        </div>
      </div>
    )
  }

  // Prepare stats cards from API data
  const stats = [
    {
      name: 'Hozir O\'qimoqda',
      value: dashboardData?.overview.activeStudents || 0,
      change: 0,
      trending: 'up' as const,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Bitirganlar',
      value: dashboardData?.overview.graduatedStudents || 0,
      change: 0,
      trending: 'up' as const,
      icon: Award,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      name: 'Chetlashganlar',
      value: dashboardData?.overview.expelledStudents || 0,
      change: 0,
      trending: 'down' as const,
      icon: Users,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      name: "Jami O'qituvchilar",
      value: dashboardData?.overview.totalTeachers || 0,
      change: 0,
      trending: 'up' as const,
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  const secondaryStats = [
    {
      name: 'Akademik Ta\'til',
      value: dashboardData?.overview.academicLeaveStudents || 0,
      icon: Calendar,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      name: 'Bekor Qilingan',
      value: dashboardData?.overview.cancelledStudents || 0,
      icon: Users,
      color: 'from-gray-500 to-slate-500',
    },
    {
      name: 'Jami OTMlar',
      value: dashboardData?.overview.totalUniversities || 0,
      icon: Building2,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      name: 'Berilgan Diplomlar',
      value: dashboardData?.overview.totalDiplomas || 0,
      icon: Award,
      color: 'from-cyan-500 to-teal-500',
    },
  ]

  // Map education types with icons
  const educationTypeIcons: Record<string, any> = {
    'Bakalavr': BookOpen,
    'Magistr': Target,
    'Ordinatura': Sparkles,
  }

  const educationTypeColors: Record<string, string> = {
    'Bakalavr': 'bg-blue-500',
    'Magistr': 'bg-purple-500',
    'Ordinatura': 'bg-pink-500',
  }

  const totalStudents = dashboardData?.overview.activeStudents || 1  // Only active students for percentages
  const educationTypes = dashboardData?.educationTypes.map(et => ({
    name: et.name,
    count: et.count,
    percent: Math.round((et.count / totalStudents) * 100),
    color: educationTypeColors[et.name] || 'bg-gray-500',
    icon: educationTypeIcons[et.name] || BookOpen,
  })) || []

  const topUniversities = dashboardData?.topUniversities || []
  const recentActivities = dashboardData?.recentActivities.map(activity => ({
    ...activity,
    icon: Users,
    color: 'text-blue-600',
    timeFormatted: activity.time ? formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: uz }) : 'noma\'lum',
  })) || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400">
            СТАТИСТИКА
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            O'zbekiston Respublikasi Oliy Ta'lim Vazirligi - Oliy ta'lim tizimi monitoring va tahlil
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            2024/2025 o'quv yili
          </Badge>
          <Button variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Hisobot olish
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.name}
            className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute right-0 top-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  <stat.icon className="h-7 w-7" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{stat.name}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                <CountUp end={stat.value} duration={2.5} separator="," />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat, index) => (
          <Card
            key={stat.name}
            className="border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-md`}>
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
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              Ta'lim turlari
            </CardTitle>
            <CardDescription>Ta'lim bosqichlari bo'yicha taqsimlash</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {educationTypes.map((type) => (
              <div key={type.name} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${type.color} text-white shadow-md`}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{type.name}</p>
                      <p className="text-sm text-slate-500">
                        <CountUp end={type.count} duration={2} separator="," /> talaba
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{type.percent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              TOP Universitetlar
            </CardTitle>
            <CardDescription>Reyting bo'yicha eng yaxshi 5 ta OTM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUniversities.map((uni) => (
                <div
                  key={uni.rank}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-lg font-bold text-white shadow-lg',
                      uni.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      uni.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      uni.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                      'bg-gradient-to-br from-slate-400 to-slate-500'
                    )}>
                      {uni.rank === 1 ? <Trophy className="h-6 w-6" /> : `#${uni.rank}`}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {uni.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          <Users className="inline h-4 w-4 mr-1" />
                          {uni.studentCount.toLocaleString()} talaba
                        </span>
                        <span className="text-xs text-slate-500">
                          Grant: {uni.grantCount.toLocaleString()}
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
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                <Activity className="h-5 w-5" />
              </div>
              So'nggi faoliyat
            </CardTitle>
            <CardDescription>Oxirgi 24 soatdagi o'zgarishlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${activity.color} bg-opacity-10`}>
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {activity.name}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{activity.timeFormatted}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Tezkor ma'lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Grant talabalar</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    <CountUp end={dashboardData?.overview.grantStudents || 0} duration={2} separator="," />
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Kontrakt talabalar</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    <CountUp end={dashboardData?.overview.contractStudents || 0} duration={2} separator="," />
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-orange-500" />
              </div>
            </div>

            <div className="rounded-lg border-2 border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Ilmiy loyihalar</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    <CountUp end={dashboardData?.overview.totalProjects || 0} duration={2} separator="," />
                  </p>
                </div>
                <FlaskConical className="h-10 w-10 text-cyan-500" />
              </div>
            </div>

            <div className="rounded-lg border-2 border-pink-200 dark:border-pink-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Ilmiy nashrlar</p>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    <CountUp end={dashboardData?.overview.totalPublications || 0} duration={2} separator="," />
                  </p>
                </div>
                <BookOpen className="h-10 w-10 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
