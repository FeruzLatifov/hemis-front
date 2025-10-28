import { useState } from 'react'
import { Building2, Users, GraduationCap, MapPin, Trophy, Star, Search, Plus, Grid, List, Award, Target, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const universities = [
  {
    id: 1,
    code: 'TDTU',
    name: 'Toshkent Davlat Texnika Universiteti',
    shortName: 'TDTU',
    region: 'Toshkent sh.',
    type: 'Davlat',
    students: 15420,
    teachers: 1234,
    rating: 98.5,
    rank: 1,
    faculties: 8,
    specialties: 42,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    code: 'OZMU',
    name: "O'zbekiston Milliy Universiteti",
    shortName: "O'zMU",
    region: 'Toshkent sh.',
    type: 'Davlat',
    students: 14850,
    teachers: 1180,
    rating: 97.8,
    rank: 2,
    faculties: 12,
    specialties: 56,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    code: 'TATU',
    name: 'Toshkent Axborot Texnologiyalari Universiteti',
    shortName: 'TATU',
    region: 'Toshkent sh.',
    type: 'Davlat',
    students: 12340,
    teachers: 987,
    rating: 96.2,
    rank: 3,
    faculties: 6,
    specialties: 28,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    code: 'SAMDU',
    name: 'Samarqand Davlat Universiteti',
    shortName: 'SamDU',
    region: 'Samarqand vil.',
    type: 'Davlat',
    students: 11200,
    teachers: 945,
    rating: 95.4,
    rank: 4,
    faculties: 10,
    specialties: 48,
    color: 'from-orange-500 to-yellow-500',
  },
  {
    id: 5,
    code: 'BUXDU',
    name: 'Buxoro Davlat Universiteti',
    shortName: 'BuxDU',
    region: 'Buxoro vil.',
    type: 'Davlat',
    students: 9870,
    teachers: 823,
    rating: 94.1,
    rank: 5,
    faculties: 9,
    specialties: 38,
    color: 'from-red-500 to-pink-500',
  },
  {
    id: 6,
    code: 'ANDDU',
    name: 'Andijon Davlat Universiteti',
    shortName: 'AndDU',
    region: 'Andijon vil.',
    type: 'Davlat',
    students: 8750,
    teachers: 756,
    rating: 92.8,
    rank: 6,
    faculties: 7,
    specialties: 32,
    color: 'from-indigo-500 to-purple-500',
  },
]

export default function Universities() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-green-400 dark:via-emerald-400 dark:to-teal-400">
            Universitetlar
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            O'zbekiston Respublikasi Oliy Ta'lim Muassasalari
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <Plus className="h-4 w-4" />
            Yangi OTM
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Jami OTMlar</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">127</p>
              </div>
              <Building2 className="h-12 w-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Davlat OTM</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">98</p>
              </div>
              <Award className="h-12 w-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Xususiy OTM</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">29</p>
              </div>
              <Target className="h-12 w-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Yo'nalishlar</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">342</p>
              </div>
              <Sparkles className="h-12 w-12 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="OTM nomi, kodi, hudud bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Universities Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {universities.map((uni, index) => (
          <Card
            key={uni.id}
            className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${uni.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
            
            {/* Rank Badge */}
            {uni.rank <= 3 && (
              <div className="absolute top-4 right-4 z-10">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ${
                  uni.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  uni.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  'bg-gradient-to-br from-amber-600 to-amber-700'
                }`}>
                  {uni.rank === 1 ? (
                    <Trophy className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-white font-bold">#{uni.rank}</span>
                  )}
                </div>
              </div>
            )}

            <CardHeader className="relative pb-3">
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${uni.color} text-white shadow-lg mb-3`}>
                <Building2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {uni.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {uni.region}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 relative">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium">Talabalar</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {uni.students.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-xs font-medium">O'qituvchilar</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {uni.teachers.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between rounded-lg border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Reyting</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{uni.rating}</span>
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500">Fakultetlar:</span>
                    <span className="ml-1 font-semibold text-slate-900 dark:text-white">{uni.faculties}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Yo'nalishlar:</span>
                    <span className="ml-1 font-semibold text-slate-900 dark:text-white">{uni.specialties}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ko'rish
                </Button>
                <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  Batafsil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              1-6 dan 127 ta universitet ko'rsatilmoqda
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Oldingi</Button>
              <Button variant="outline" size="sm" className="bg-green-600 text-white">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <span className="px-2">...</span>
              <Button variant="outline" size="sm">22</Button>
              <Button variant="outline" size="sm">Keyingi</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
