import { BarChart3, FileText, Download, Calendar, TrendingUp, Users, Building2, Target, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const reportCategories = [
  {
    name: 'Talabalar hisobotlari',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    reports: [
      { name: 'Talabalar statistikasi', description: 'Umumiy talabalar soni va taqsimlash', count: '12 parametr' },
      { name: 'Ta\'lim turlari bo\'yicha', description: 'Bakalavr, Magistr, PhD taqsimlash', count: '8 parametr' },
      { name: 'To\'lov shakli bo\'yicha', description: 'Grant va kontrakt talabalar', count: '6 parametr' },
      { name: 'Hududlar kesimida', description: 'Viloyatlar bo\'yicha taqsimlash', count: '14 parametr' },
    ],
  },
  {
    name: "O'qituvchilar hisobotlari",
    icon: GraduationCap,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    reports: [
      { name: 'Ilmiy darajalar kesimida', description: 'Fan doktori, PhD, DSc', count: '10 parametr' },
      { name: 'Ilmiy unvonlar bo\'yicha', description: 'Professor, Dotsent statistikasi', count: '8 parametr' },
      { name: 'Tajriba bo\'yicha', description: 'Ish staji kesimida', count: '5 parametr' },
      { name: 'Kafedraer bo\'yicha', description: 'Kafedralardagi xodimlar', count: '12 parametr' },
    ],
  },
  {
    name: 'Universitetlar hisobotlari',
    icon: Building2,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    reports: [
      { name: 'Umumiy ko\'rsatkichlar', description: 'OTMlar asosiy statistikasi', count: '15 parametr' },
      { name: 'Reyting bo\'yicha', description: 'OTMlar reytingi va taqqoslash', count: '20 parametr' },
      { name: 'Tashkiliy shakl bo\'yicha', description: 'Institut, Universitet, Akademiya', count: '8 parametr' },
      { name: 'Mulkchilik shakli', description: 'Davlat, Xususiy, Qo\'shma', count: '6 parametr' },
    ],
  },
  {
    name: 'Ilmiy faoliyat',
    icon: Target,
    color: 'from-orange-500 to-yellow-500',
    bgColor: 'from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
    reports: [
      { name: 'Ilmiy nashrlar', description: 'Scopus, Web of Science nashrlari', count: '18 parametr' },
      { name: 'Ilmiy loyihalar', description: 'Mahalliy va xalqaro loyihalar', count: '12 parametr' },
      { name: 'Dissertasiya himoyalari', description: 'Fan nomzodi, Fan doktori', count: '10 parametr' },
      { name: 'Intellektual mulk', description: 'Patentlar, litsenziyalar', count: '8 parametr' },
    ],
  },
]

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent dark:from-orange-400 dark:via-yellow-400 dark:to-amber-400">
            Hisobotlar
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Turli hisobotlar, tahlillar va statistik ma'lumotlar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            O'quv yilini tanlash
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700">
            <Download className="h-4 w-4" />
            Barcha hisobotlar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Umumiy hisobotlar</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">156</p>
              </div>
              <FileText className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Oy hisobotlari</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">24</p>
              </div>
              <Calendar className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Yuklab olindi</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">3,456</p>
              </div>
              <Download className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Oxirgi yangilanish</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">Bugun, 08:00</p>
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
            className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.bgColor} opacity-50 rounded-lg`}></div>
            
            <CardHeader className="relative pb-3">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                  <category.icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.reports.length} ta hisobot</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 relative">
              {category.reports.map((report, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{report.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{report.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {report.count}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Ko'rish
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
