import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, User, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { extractApiErrorMessage } from '@/utils/error.util'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login({
        username,
        password,
        locale: 'uz'
      })
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(
        extractApiErrorMessage(
          err,
          'Login yoki parol noto\'g\'ri!'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Left Side - Branding */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <div className="flex justify-center lg:justify-start">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl">
                    <GraduationCap className="h-16 w-16 text-blue-600 dark:text-blue-400" />
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
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">127</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">OTM</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">453K+</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Talaba</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">45K+</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">O'qituvchi</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
              <CardContent className="p-8">
                {/* Form Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Tizimga kirish
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    HEMIS platformasi
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Input */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Foydalanuvchi"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 text-base border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 rounded-lg transition-colors outline-none"
                      required
                      autoComplete="username"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Parol"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 text-base border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 rounded-lg transition-colors outline-none"
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400 text-center">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Yuklanmoqda...</span>
                      </div>
                    ) : (
                      'Kirish'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
