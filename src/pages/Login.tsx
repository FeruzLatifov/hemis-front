/**
 * Modern Login Page
 *
 * AI-inspired design with glassmorphism and animations
 * Theme: Higher Education + Digital Transformation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  Globe,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  Sparkles,
  Brain,
  Shield,
  Loader2,
} from 'lucide-react';

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Language state
  const [currentLang, setCurrentLang] = useState<'uz' | 'ru' | 'en'>(
    (i18n.language as 'uz' | 'ru' | 'en') || 'uz'
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle language change
  const handleLanguageChange = (lang: 'uz' | 'ru' | 'en') => {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('locale', lang);
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim()) {
      setError(t('login.errors.required'));
      return;
    }

    if (!password.trim()) {
      setError(t('login.errors.required'));
      return;
    }

    if (password.length < 6) {
      setError(t('login.errors.minLength', { count: 6 }));
      return;
    }

    setIsLoading(true);

    try {
      await login({
        username: username.trim(),
        password: password.trim(),
        locale: currentLang,
      });
      // Success - redirect handled by useEffect
    } catch (err: any) {
      console.error('Login error:', err);

      // Parse error message
      const errorMessage =
        err.response?.data?.error?.message ||
        t('login.errors.invalidCredentials');

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Language options
  const languages = [
    { code: 'uz', name: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  // Stats data
  const stats = [
    { icon: GraduationCap, label: t('login.stats.universities'), value: '250+' },
    { icon: Users, label: t('login.stats.students'), value: '500K+' },
    { icon: Brain, label: t('login.stats.analytics'), value: 'AI' },
    { icon: FileText, label: t('login.stats.reports'), value: '∞' },
  ];

  // Features
  const features = [
    { icon: TrendingUp, text: t('login.features.realtime') },
    { icon: Brain, text: t('login.features.ai') },
    { icon: Sparkles, text: t('login.features.digital') },
    { icon: Shield, text: t('login.features.secure') },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Branding & Features */}
            <div className="hidden md:block space-y-8 animate-slide-up">
              {/* Logo & Title */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white font-display">
                      {t('login.title')}
                    </h1>
                    <p className="text-blue-200 text-sm">
                      {t('login.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-blue-300">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>{t('login.poweredBy')}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all hover:scale-105 cursor-default"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <stat.icon className="w-8 h-8 text-blue-300 mb-2" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-blue-200">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Features List */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 text-white animate-fade-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/10">
                      <feature.icon className="w-5 h-5 text-blue-300" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10">
                {/* Mobile Logo */}
                <div className="md:hidden flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {t('login.welcomeBack')}
                  </h2>
                  <p className="text-blue-200 text-sm">
                    {t('login.subtitle')}
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm animate-slide-up">
                      {error}
                    </div>
                  )}

                  {/* Username Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{t('login.username')}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('login.usernamePlaceholder')}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        disabled={isLoading}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>{t('login.password')}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('login.passwordPlaceholder')}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 pr-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        disabled={isLoading}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>{t('login.language')}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageChange(lang.code as 'uz' | 'ru' | 'en')}
                          className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                            currentLang === lang.code
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                          disabled={isLoading}
                        >
                          <span className="mr-1">{lang.flag}</span>
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('login.loggingIn')}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>{t('login.loginButton')}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Mobile Stats */}
                <div className="md:hidden mt-8 grid grid-cols-2 gap-3">
                  {stats.slice(0, 2).map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl p-3 border border-white/10 text-center"
                    >
                      <stat.icon className="w-6 h-6 text-blue-300 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-blue-200">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
