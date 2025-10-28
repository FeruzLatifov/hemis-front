import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Award, Users, Building2, Microscope, Brain, Database, Globe, Laptop, FlaskConical, Sparkles, TrendingUp, Target, Cpu, Atom, Dna, Stethoscope, Calculator, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        navigate('/dashboard')
      } else {
        alert('Login yoki parol noto\'g\'ri!')
        setLoading(false)
      }
    }, 1000)
  }

  const educationFields = [
    { icon: Brain, label: 'Sun\'iy Intellekt', color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-950/30' },
    { icon: Microscope, label: 'Biologiya', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-950/30' },
    { icon: Cpu, label: 'Dasturlash', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-950/30' },
    { icon: Atom, label: 'Fizika', color: 'text-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-950/30' },
    { icon: Database, label: 'Ma\'lumotlar bazasi', color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-950/30' },
    { icon: Stethoscope, label: 'Tibbiyot', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-950/30' },
    { icon: Calculator, label: 'Matematika', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-950/30' },
    { icon: Palette, label: 'San\'at', color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-950/30' },
    { icon: Globe, label: 'Geografiya', color: 'text-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-950/30' },
    { icon: Dna, label: 'Biotexnologiya', color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-950/30' },
    { icon: FlaskConical, label: 'Kimyo', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-950/30' },
    { icon: Laptop, label: 'IT Texnologiya', color: 'text-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-950/30' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/30 to-yellow-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '3s' }}></div>
      </div>

      {/* Floating Education Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {educationFields.map((field, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            <div className={`${field.bgColor} p-3 rounded-xl opacity-20 backdrop-blur-sm`}>
              <field.icon className={`h-6 w-6 ${field.color}`} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(20px) rotate(-5deg); }
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Info */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Logo & Title */}
            <div className="space-y-4">
              <div className="flex justify-center lg:justify-start">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative">
                        <GraduationCap className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                        <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 mb-2">
                  HEMIS
                </h1>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                  O'zbekiston Respublikasi
                </p>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Oliy Ta'lim Vazirligi
                </p>
                <div className="inline-block mt-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Axborot Tizimi
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-xl">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">127</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">OTM</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-purple-600 dark:bg-purple-500 rounded-xl">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">453K+</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Talaba</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-green-600 dark:bg-green-500 rounded-xl">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">45K+</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">O'qituvchi</p>
                </CardContent>
              </Card>
            </div>

            {/* Education Fields */}
            <div className="hidden lg:block">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Ta'lim yo'nalishlari
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {educationFields.slice(0, 8).map((field, index) => (
                  <div
                    key={index}
                    className={`${field.bgColor} p-3 rounded-xl hover:scale-110 transition-transform cursor-pointer border border-transparent hover:border-current`}
                    title={field.label}
                  >
                    <field.icon className={`h-6 w-6 ${field.color} mx-auto`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Mission Statement */}
            <div className="p-6 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10 rounded-xl border border-blue-200 dark:border-blue-800 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Maqsad
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Oliy ta'lim tizimini zamonaviy raqamli texnologiyalar orqali boshqarish va monitoring qilish
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
              <CardContent className="p-8">
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Tizimga kirish
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    HEMIS platformasiga xush kelibsiz
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium">
                      Foydalanuvchi nomi
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        placeholder="admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-12 pl-4 pr-4 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
                      Parol
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pl-4 pr-4 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Yuklanmoqda...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Kirish</span>
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Demo Info */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    <span className="font-medium text-blue-600 dark:text-blue-400">Demo:</span> admin / admin123
                  </p>
                </div>

                {/* Features */}
                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Brain className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">AI & ML</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Database className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">Big Data</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Award className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">Sertifikat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
