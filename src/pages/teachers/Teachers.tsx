import { useState } from 'react'
import { Search, Plus, Filter, Download, MoreHorizontal, Eye, Edit, Trash2, Award, Star, BookOpen, FlaskConical } from 'lucide-react'
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

const teachers = [
  { id: 1, code: 'TC2024001', fullName: 'Prof. Rahimov Anvar Shavkatovich', pinfl: '12345678901234', university: 'TDTU', department: 'Dasturiy injiniring', position: 'Professor', degree: 'Fan doktori', rank: 'Professor', experience: 25, publications: 45, projects: 12 },
  { id: 2, code: 'TC2024002', fullName: 'Dots. Karimova Dilbar Azizovna', pinfl: '23456789012345', university: 'O\'zMU', department: 'Matematika', position: 'Dotsent', degree: 'Fan nomzodi', rank: 'Dotsent', experience: 18, publications: 32, projects: 8 },
  { id: 3, code: 'TC2024003', fullName: 'Dr. Aliyev Javohir Murodovich', pinfl: '34567890123456', university: 'TATU', department: 'Axborot xavfsizligi', position: 'Katta o\'qituvchi', degree: 'PhD', rank: null, experience: 8, publications: 15, projects: 5 },
  { id: 4, code: 'TC2024004', fullName: 'Tursunov Bobur Akmalovich', pinfl: '45678901234567', university: 'SamDU', department: 'Fizika', position: 'Assistent', degree: null, rank: null, experience: 3, publications: 6, projects: 2 },
  { id: 5, code: 'TC2024005', fullName: 'Prof. Abdullayeva Nodira Karimovna', pinfl: '56789012345678', university: 'TDTU', department: 'Sun\'iy intellekt', position: 'Professor', degree: 'DSc', rank: 'Professor', experience: 30, publications: 78, projects: 20 },
]

export default function Teachers() {
  const [searchQuery, setSearchQuery] = useState('')

  const getDegreeColor = (degree: string | null) => {
    if (!degree) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    if (degree.includes('doktori') || degree === 'DSc') return 'bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400'
    if (degree.includes('nomzodi') || degree === 'PhD') return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-orange-400">
            O'qituvchilar
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Professor-o'qituvchilar ro'yxati va ilmiy faoliyat monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Plus className="h-4 w-4" />
            Yangi o'qituvchi
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Jami</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">45,234</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Professorlar</p>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">3,456</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Dotsentlar</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">8,923</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Fan doktori</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2,145</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">PhD/DSc</p>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">5,678</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600" />
            Qidiruv va filtrlash
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="FIO, PINFL, kafedra bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Ilmiy daraja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="dsc">Fan doktori (DSc)</SelectItem>
                <SelectItem value="phd">Fan nomzodi (PhD)</SelectItem>
                <SelectItem value="none">Ilmiy daraja yo'q</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Ilmiy unvon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="docent">Dotsent</SelectItem>
                <SelectItem value="none">Unvon yo'q</SelectItem>
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
              <CardTitle>O'qituvchilar ro'yxati</CardTitle>
              <CardDescription>{teachers.length} ta o'qituvchi topildi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>FIO</TableHead>
                  <TableHead>OTM</TableHead>
                  <TableHead>Kafedra</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Ilmiy daraja</TableHead>
                  <TableHead>Ilmiy unvon</TableHead>
                  <TableHead>Tajriba</TableHead>
                  <TableHead>Nashrlar</TableHead>
                  <TableHead>Loyihalar</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-mono font-medium text-purple-600 dark:text-purple-400">
                      {teacher.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                          {teacher.fullName.split(' ')[1][0]}{teacher.fullName.split(' ')[2][0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{teacher.fullName}</p>
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
                      <span className="font-medium">{teacher.experience} yil</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{teacher.publications}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
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
                            Ko'rish
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              1-5 dan 45,234 ta o'qituvchi ko'rsatilmoqda
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Oldingi</Button>
              <Button variant="outline" size="sm" className="bg-purple-600 text-white">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <span className="px-2">...</span>
              <Button variant="outline" size="sm">9,047</Button>
              <Button variant="outline" size="sm">Keyingi</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
