import { useState } from 'react'
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Award,
  Star,
  BookOpen,
  FlaskConical,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from 'react-i18next'

const teachers = [
  {
    id: 1,
    code: 'TC2024001',
    fullName: 'Prof. Rahimov Anvar Shavkatovich',
    pinfl: '12345678901234',
    university: 'TDTU',
    department: 'Dasturiy injiniring',
    position: 'Professor',
    degree: 'Fan doktori',
    rank: 'Professor',
    experience: 25,
    publications: 45,
    projects: 12,
  },
  {
    id: 2,
    code: 'TC2024002',
    fullName: 'Dots. Karimova Dilbar Azizovna',
    pinfl: '23456789012345',
    university: "O'zMU",
    department: 'Matematika',
    position: 'Dotsent',
    degree: 'Fan nomzodi',
    rank: 'Dotsent',
    experience: 18,
    publications: 32,
    projects: 8,
  },
  {
    id: 3,
    code: 'TC2024003',
    fullName: 'Dr. Aliyev Javohir Murodovich',
    pinfl: '34567890123456',
    university: 'TATU',
    department: 'Axborot xavfsizligi',
    position: "Katta o'qituvchi",
    degree: 'PhD',
    rank: null,
    experience: 8,
    publications: 15,
    projects: 5,
  },
  {
    id: 4,
    code: 'TC2024004',
    fullName: 'Tursunov Bobur Akmalovich',
    pinfl: '45678901234567',
    university: 'SamDU',
    department: 'Fizika',
    position: 'Assistent',
    degree: null,
    rank: null,
    experience: 3,
    publications: 6,
    projects: 2,
  },
  {
    id: 5,
    code: 'TC2024005',
    fullName: 'Prof. Abdullayeva Nodira Karimovna',
    pinfl: '56789012345678',
    university: 'TDTU',
    department: "Sun'iy intellekt",
    position: 'Professor',
    degree: 'DSc',
    rank: 'Professor',
    experience: 30,
    publications: 78,
    projects: 20,
  },
]

export default function Teachers() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const getDegreeColor = (degree: string | null) => {
    if (!degree) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    if (degree.includes('doktori') || degree === 'DSc')
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
    if (degree.includes('nomzodi') || degree === 'PhD')
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
            {t('Teachers')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('Teacher list and monitoring')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('Export')}
          </Button>
          <Button className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" />
            {t('New teacher')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('Total')}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">45,234</p>
          </CardContent>
        </Card>
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t('Professors')}
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">3,456</p>
          </CardContent>
        </Card>
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t('Associate professors')}
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">8,923</p>
          </CardContent>
        </Card>
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t('Doctor of science')}
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2,145</p>
          </CardContent>
        </Card>
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('PhD/DSc')}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">5,678</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-[var(--primary)]" />
            {t('Search and filter')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={t('Search by full name, PINFL, department...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder={t('Academic degree')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
                <SelectItem value="dsc">{t('Doctor of science')} (DSc)</SelectItem>
                <SelectItem value="phd">{t('PhD')}</SelectItem>
                <SelectItem value="none">{t('No degree')}</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder={t('Academic title')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
                <SelectItem value="professor">{t('Professor')}</SelectItem>
                <SelectItem value="docent">{t('Associate professor')}</SelectItem>
                <SelectItem value="none">{t('No title')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('Teacher list')}</CardTitle>
              <CardDescription>
                {teachers.length} {t('teachers found')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>{t('Code')}</TableHead>
                  <TableHead>{t('Full name')}</TableHead>
                  <TableHead>{t('Universities')}</TableHead>
                  <TableHead>{t('Department')}</TableHead>
                  <TableHead>{t('Position')}</TableHead>
                  <TableHead>{t('Academic degree')}</TableHead>
                  <TableHead>{t('Academic title')}</TableHead>
                  <TableHead>{t('Experience')}</TableHead>
                  <TableHead>{t('Publications')}</TableHead>
                  <TableHead>{t('Projects')}</TableHead>
                  <TableHead className="text-right">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-mono font-medium text-[var(--primary)] dark:text-blue-400">
                      {teacher.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] font-semibold text-white">
                          {teacher.fullName.split(' ')[1][0]}
                          {teacher.fullName.split(' ')[2][0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {teacher.fullName}
                          </p>
                          <p className="text-xs text-slate-500">{teacher.pinfl}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{teacher.university}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{teacher.department}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{teacher.position}</Badge>
                    </TableCell>
                    <TableCell>
                      {teacher.degree ? (
                        <Badge className={getDegreeColor(teacher.degree)}>
                          <Award className="mr-1 h-3 w-3" />
                          {teacher.degree}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.rank ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          <Star className="mr-1 h-3 w-3" />
                          {teacher.rank}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {teacher.experience} {t('years')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{teacher.publications}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[var(--primary)] dark:text-blue-400">
                        <FlaskConical className="h-4 w-4" />
                        <span className="font-medium">{teacher.projects}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('View')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('Edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('Showing {{from}}-{{to}} of {{total}} teachers', {
                from: 1,
                to: 5,
                total: '45,234',
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                {t('Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
              >
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <span className="px-2">...</span>
              <Button variant="outline" size="sm">
                9,047
              </Button>
              <Button variant="outline" size="sm">
                {t('Next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
