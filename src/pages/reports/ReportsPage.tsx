import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Building2,
  Target,
  GraduationCap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

export default function Reports() {
  const { t } = useTranslation()

  const reportCategories = [
    {
      name: t('Student reports'),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      reports: [
        {
          name: t('Student statistics'),
          description: t('Total students count and distribution'),
          count: t('{{count}} parameters', { count: 12 }),
        },
        {
          name: t('By education type'),
          description: t('Bachelor, Master, PhD distribution'),
          count: t('{{count}} parameters', { count: 8 }),
        },
        {
          name: t('By payment type'),
          description: t('Grant and contract students'),
          count: t('{{count}} parameters', { count: 6 }),
        },
        {
          name: t('By region'),
          description: t('Distribution by regions'),
          count: t('{{count}} parameters', { count: 14 }),
        },
      ],
    },
    {
      name: t('Teacher reports'),
      icon: GraduationCap,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      reports: [
        {
          name: t('By scientific degrees'),
          description: t('Doctor of Science, PhD, DSc'),
          count: t('{{count}} parameters', { count: 10 }),
        },
        {
          name: t('By academic titles'),
          description: t('Professor, Associate professor statistics'),
          count: t('{{count}} parameters', { count: 8 }),
        },
        {
          name: t('By experience'),
          description: t('By work experience'),
          count: t('{{count}} parameters', { count: 5 }),
        },
        {
          name: t('By departments'),
          description: t('Department employees'),
          count: t('{{count}} parameters', { count: 12 }),
        },
      ],
    },
    {
      name: t('University reports'),
      icon: Building2,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      reports: [
        {
          name: t('General indicators'),
          description: t('Main HEI statistics'),
          count: t('{{count}} parameters', { count: 15 }),
        },
        {
          name: t('By rating'),
          description: t('HEI rating and comparison'),
          count: t('{{count}} parameters', { count: 20 }),
        },
        {
          name: t('By organizational form'),
          description: t('Institute, University, Academy'),
          count: t('{{count}} parameters', { count: 8 }),
        },
        {
          name: t('Form of ownership'),
          description: t('State, Private, Joint'),
          count: t('{{count}} parameters', { count: 6 }),
        },
      ],
    },
    {
      name: t('Scientific activity'),
      icon: Target,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      reports: [
        {
          name: t('Scientific publications'),
          description: t('Scopus, Web of Science publications'),
          count: t('{{count}} parameters', { count: 18 }),
        },
        {
          name: t('Scientific projects'),
          description: t('Local and international projects'),
          count: t('{{count}} parameters', { count: 12 }),
        },
        {
          name: t('Dissertation defenses'),
          description: t('Candidate of Sciences, Doctor of Sciences'),
          count: t('{{count}} parameters', { count: 10 }),
        },
        {
          name: t('Intellectual property'),
          description: t('Patents, licenses'),
          count: t('{{count}} parameters', { count: 8 }),
        },
      ],
    },
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
            {t('Reports')}
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">{t('Reports subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            {t('Select academic year')}
          </Button>
          <Button className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
            <Download className="h-4 w-4" />
            {t('All reports')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  {t('General reports')}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">156</p>
              </div>
              <FileText className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  {t('Monthly reports')}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">24</p>
              </div>
              <Calendar className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  {t('Downloaded')}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">3,456</p>
              </div>
              <Download className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  {t('Last update')}
                </p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {t('Today, {{time}}', { time: '08:00' })}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {reportCategories.map((category, index) => (
          <Card
            key={index}
            className="group border-0 shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${category.color} text-white shadow-sm`}
                >
                  <category.icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>
                    {category.reports.length} {t('reports')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {category.reports.map((report, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{report.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      {report.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {report.count}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {t('View')}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
