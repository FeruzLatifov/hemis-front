/**
 * Enhanced Modern Login Page
 *
 * Ultra-modern design with AI animations, data visualization, and interactive elements
 * Theme: Higher Education + Digital Transformation + AI Technology
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import ParticleBackground from '../components/ParticleBackground';
import hemisLogo from '../assets/images/hemis-logo-new.png';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Globe,
  Shield,
  Loader2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

const LoginEnhanced = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLang, setCurrentLang] = useState<'uz' | 'ru' | 'en'>(
    (i18n.language as 'uz' | 'ru' | 'en') || 'uz'
  );
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Load dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: 'uz' | 'ru' | 'en') => {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('locale', lang);
    setIsLangDropdownOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
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
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        t('login.errors.invalidCredentials');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { code: 'uz', name: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];


  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Background - WCAG AA Compliant */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}></div>

      {/* Particle Neural Network */}
      <ParticleBackground />

      {/* Floating Gradient Orbs - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main Brain Orb - Purple */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-violet-300/60 to-purple-200/50 rounded-full blur-3xl animate-float"></div>

        {/* Analytics Orb - Blue */}
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/60 to-cyan-200/50 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>

        {/* Education Orb - Emerald */}
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-emerald-300/60 to-teal-200/50 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '4s' }}
        ></div>

        {/* Innovation Orb - Pink */}
        <div
          className="absolute top-1/3 right-1/3 w-[450px] h-[450px] bg-gradient-to-br from-pink-300/50 to-rose-200/40 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        ></div>

        {/* Extra highlight orb - Top right */}
        <div
          className="absolute top-10 right-10 w-[300px] h-[300px] bg-gradient-to-br from-cyan-300/40 to-blue-200/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '3s' }}
        ></div>
      </div>

      {/* Tech Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMzksMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60"></div>

      {/* Top Right Controls - Theme & Language */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex items-center space-x-3 animate-slide-up">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
            isDarkMode
              ? 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-700'
              : 'bg-white hover:bg-slate-50 border-2 border-slate-200 shadow-lg'
          }`}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700" />
          )}
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className={`flex items-center space-x-2 backdrop-blur-xl rounded-xl px-4 py-2.5 border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                : 'bg-white border-slate-200'
            }`}
            disabled={isLoading}
          >
            <Globe className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} />
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              {languages.find(l => l.code === currentLang)?.flag} {languages.find(l => l.code === currentLang)?.name}
            </span>
            <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isLangDropdownOpen && (
            <div className={`absolute top-full right-0 mt-2 w-48 backdrop-blur-xl rounded-xl border-2 shadow-2xl overflow-hidden animate-slide-up ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            }`}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code as 'uz' | 'ru' | 'en')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 transition-all ${
                    currentLang === lang.code
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  disabled={isLoading}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                  {currentLang === lang.code && (
                    <Sparkles className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Login Card */}
          <div className="w-full animate-slide-up">
            {/* Glass Card */}
            <div className="relative group">
              {/* Glow Effect - WCAG AA Compliant */}
              <div className={`absolute inset-0 rounded-3xl blur-3xl transition-all duration-500 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-blue-500/30 to-slate-700/30 opacity-50 group-hover:opacity-70'
                  : 'bg-gradient-to-br from-blue-400/40 to-slate-300/40 opacity-60 group-hover:opacity-80'
              }`}></div>

              {/* Glass Card */}
              <div className={`relative backdrop-blur-3xl rounded-3xl border-2 shadow-2xl hover:shadow-3xl p-8 md:p-10 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
              }`}>
                {/* Logo and Title */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl border-2 p-2 ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600'
                          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 border-slate-200'
                      }`}>
                        <img
                          src={hemisLogo}
                          alt="HEMIS Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500 animate-pulse" />
                    </div>
                  </div>
                  <h1 className={`text-4xl font-bold font-display mb-2 ${
                    isDarkMode
                      ? 'text-white'
                      : 'bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent'
                  }`}>
                    HEMIS
                  </h1>
                  <p className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Oliy Ta'lim Boshqaruv Tizimi
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Error Message - WCAG AA Compliant */}
                    {error && (
                      <div className={`border-2 rounded-xl p-4 text-sm animate-slide-up flex items-start space-x-3 ${
                        isDarkMode
                          ? 'bg-red-900/30 border-red-700 text-red-300'
                          : 'bg-red-50 border-red-300 text-red-700'
                      }`}>
                        <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Username - WCAG AA Compliant */}
                    <div className="space-y-2">
                      <label className={`text-sm font-semibold flex items-center space-x-2 ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        <User className="w-4 h-4" />
                        <span>{t('login.username')}</span>
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={t('login.usernamePlaceholder')}
                          className={`relative w-full border-2 rounded-xl px-4 py-3.5 pl-12 transition-all shadow-sm ${
                            isDarkMode
                              ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300'
                          } focus:outline-none`}
                          disabled={isLoading}
                        />
                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                          isDarkMode
                            ? 'text-slate-400 group-focus-within:text-blue-400'
                            : 'text-slate-400 group-focus-within:text-blue-600'
                        }`} />
                      </div>
                    </div>

                    {/* Password - WCAG AA Compliant */}
                    <div className="space-y-2">
                      <label className={`text-sm font-semibold flex items-center space-x-2 ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        <Lock className="w-4 h-4" />
                        <span>{t('login.password')}</span>
                      </label>
                      <div className="relative group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('login.passwordPlaceholder')}
                          className={`relative w-full border-2 rounded-xl px-4 py-3.5 pl-12 pr-12 transition-all shadow-sm ${
                            isDarkMode
                              ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-300'
                          } focus:outline-none`}
                          disabled={isLoading}
                        />
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                          isDarkMode
                            ? 'text-slate-400 group-focus-within:text-blue-400'
                            : 'text-slate-400 group-focus-within:text-blue-600'
                        }`} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                            isDarkMode
                              ? 'text-slate-400 hover:text-slate-300'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Login Button - Government Style WCAG AA */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
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
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginEnhanced;
