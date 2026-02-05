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
      name: t('Talabalar hisobotlari'),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      reports: [
        {
          name: t('Talabalar statistikasi'),
          description: t('Umumiy talabalar soni va taqsimlash'),
          count: t('12 parametr'),
        },
        {
          name: t("Ta'lim turlari bo'yicha"),
          description: t('Bakalavr, Magistr, PhD taqsimlash'),
          count: t('8 parametr'),
        },
        {
          name: t("To'lov shakli bo'yicha"),
          description: t('Grant va kontrakt talabalar'),
          count: t('6 parametr'),
        },
        {
          name: t('Hududlar kesimida'),
          description: t("Viloyatlar bo'yicha taqsimlash"),
          count: t('14 parametr'),
        },
      ],
    },
    {
      name: t("O'qituvchilar hisobotlari"),
      icon: GraduationCap,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      reports: [
        {
          name: t('Ilmiy darajalar kesimida'),
          description: t('Fan doktori, PhD, DSc'),
          count: t('10 parametr'),
        },
        {
          name: t("Ilmiy unvonlar bo'yicha"),
          description: t('Professor, Dotsent statistikasi'),
          count: t('8 parametr'),
        },
        {
          name: t("Tajriba bo'yicha"),
          description: t('Ish staji kesimida'),
          count: t('5 parametr'),
        },
        {
          name: t("Kafedralar bo'yicha"),
          description: t('Kafedralardagi xodimlar'),
          count: t('12 parametr'),
        },
      ],
    },
    {
      name: t('Universitetlar hisobotlari'),
      icon: Building2,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      reports: [
        {
          name: t("Umumiy ko'rsatkichlar"),
          description: t('OTMlar asosiy statistikasi'),
          count: t('15 parametr'),
        },
        {
          name: t("Reyting bo'yicha"),
          description: t('OTMlar reytingi va taqqoslash'),
          count: t('20 parametr'),
        },
        {
          name: t("Tashkiliy shakl bo'yicha"),
          description: t('Institut, Universitet, Akademiya'),
          count: t('8 parametr'),
        },
        {
          name: t('Mulkchilik shakli'),
          description: t("Davlat, Xususiy, Qo'shma"),
          count: t('6 parametr'),
        },
      ],
    },
    {
      name: t('Ilmiy faoliyat'),
      icon: Target,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      reports: [
        {
          name: t('Ilmiy nashrlar'),
          description: t('Scopus, Web of Science nashrlari'),
          count: t('18 parametr'),
        },
        {
          name: t('Ilmiy loyihalar'),
          description: t('Mahalliy va xalqaro loyihalar'),
          count: t('12 parametr'),
        },
        {
          name: t('Dissertasiya himoyalari'),
          description: t('Fan nomzodi, Fan doktori'),
          count: t('10 parametr'),
        },
        {
          name: t('Intellektual mulk'),
          description: t('Patentlar, litsenziyalar'),
          count: t('8 parametr'),
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
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('Reports subtitle')}</p>
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Last update')}
                </p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  Bugun, 08:00
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
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{report.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{report.description}</p>
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
