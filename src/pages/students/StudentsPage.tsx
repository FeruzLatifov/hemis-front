import { useState } from 'react'
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Award,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
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

// Mock data
const students = [
  {
    id: 1,
    code: 'ST2024001',
    fullName: 'Ahmadov Sardor Akmalovich',
    pinfl: '12345678901234',
    university: 'TDTU',
    faculty: 'Informatika',
    specialty: 'Dasturiy injiniring',
    course: 2,
    educationType: 'Bakalavr',
    paymentForm: 'Grant',
    status: 'active',
  },
  {
    id: 2,
    code: 'ST2024002',
    fullName: 'Karimova Nilufar Shavkatovna',
    pinfl: '23456789012345',
    university: "O'zMU",
    faculty: 'Matematika',
    specialty: 'Amaliy matematika',
    course: 3,
    educationType: 'Bakalavr',
    paymentForm: 'Kontrakt',
    status: 'active',
  },
  {
    id: 3,
    code: 'ST2024003',
    fullName: 'Rahimov Bobur Olimovich',
    pinfl: '34567890123456',
    university: 'TATU',
    faculty: 'AT va TS',
    specialty: 'Axborot xavfsizligi',
    course: 1,
    educationType: 'Bakalavr',
    paymentForm: 'Grant',
    status: 'active',
  },
  {
    id: 4,
    code: 'ST2024004',
    fullName: 'Tursunova Madina Azizovna',
    pinfl: '45678901234567',
    university: 'SamDU',
    faculty: 'Fizika',
    specialty: 'Yadro fizikasi',
    course: 4,
    educationType: 'Bakalavr',
    paymentForm: 'Grant',
    status: 'active',
  },
  {
    id: 5,
    code: 'MA2024001',
    fullName: 'Aliyev Javohir Murodovich',
    pinfl: '56789012345678',
    university: 'TDTU',
    faculty: 'Informatika',
    specialty: "Sun'iy intellekt",
    course: 1,
    educationType: 'Magistr',
    paymentForm: 'Kontrakt',
    status: 'active',
  },
]

export default function Students() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUniversity, setFilterUniversity] = useState('all')
  const [filterEducationType, setFilterEducationType] = useState('all')
  const [filterPaymentForm, setFilterPaymentForm] = useState('all')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t('Active')}
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            {t('Inactive')}
          </Badge>
        )
      case 'vacation':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
            <Clock className="mr-1 h-3 w-3" />
            {t('On leave')}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentBadge = (form: string) => {
    return form === 'Grant' ? (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
        <GraduationCap className="mr-1 h-3 w-3" />
        {t('Grant')}
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
        <span className="mr-1">💰</span>
        {t('Contract')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
            {t('Students')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('Student list and management')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {t('Import')}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('Export')}
          </Button>
          <Button className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" />
            {t('New student')}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Total')}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">453,678</p>
              </div>
              <Users className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Grant recipients')}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">245,830</p>
              </div>
              <GraduationCap className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Contract students')}
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">207,848</p>
              </div>
              <span className="text-4xl opacity-50">💰</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Graduates')}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">89,456</p>
              </div>
              <Award className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-[var(--primary)]" />
            {t('Search and filter')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={t('Search by full name, code, PINFL...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterUniversity} onValueChange={setFilterUniversity}>
              <SelectTrigger>
                <SelectValue placeholder={t('University')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All HEIs')}</SelectItem>
                <SelectItem value="tdtu">TDTU</SelectItem>
                <SelectItem value="ozmu">O'zMU</SelectItem>
                <SelectItem value="tatu">TATU</SelectItem>
                <SelectItem value="samdu">SamDU</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEducationType} onValueChange={setFilterEducationType}>
              <SelectTrigger>
                <SelectValue placeholder={t('Education type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
                <SelectItem value="bachelor">{t('Bachelor')}</SelectItem>
                <SelectItem value="master">{t('Master')}</SelectItem>
                <SelectItem value="phd">{t('PhD/DSc')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentForm} onValueChange={setFilterPaymentForm}>
              <SelectTrigger>
                <SelectValue placeholder={t('Payment form')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
                <SelectItem value="grant">{t('Grant')}</SelectItem>
                <SelectItem value="contract">{t('Contract')}</SelectItem>
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
              <CardTitle>{t('Student list')}</CardTitle>
              <CardDescription>
                {students.length} {t('students found')}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {t('Configure columns')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>{t('Code')}</TableHead>
                  <TableHead>{t('Full name')}</TableHead>
                  <TableHead>PINFL</TableHead>
                  <TableHead>{t('Universities')}</TableHead>
                  <TableHead>{t('Specialty')}</TableHead>
                  <TableHead>{t('Course')}</TableHead>
                  <TableHead>{t('Education type')}</TableHead>
                  <TableHead>{t('Payment')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-right">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell className="font-mono font-medium text-blue-600 dark:text-blue-400">
                      {student.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] font-semibold text-white">
                          {student.fullName.split(' ')[0][0]}
                          {student.fullName.split(' ')[1][0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-slate-500">{student.faculty}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">
                      {student.pinfl}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {student.university}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {student.specialty}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {student.course}-{t('course')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          student.educationType === 'Bakalavr'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                            : student.educationType === 'Magistr'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                        }
                      >
                        {student.educationType}
                      </Badge>
                    </TableCell>
                    <TableCell>{getPaymentBadge(student.paymentForm)}</TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
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

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('Showing {{from}}-{{to}} of {{total}} students', {
                from: 1,
                to: 5,
                total: '453,678',
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
                90,736
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
