import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/theme-provider'
import { queryClient } from './lib/queryClient'
import MainLayout from './components/layouts/MainLayout'
import { useAuthStore } from './stores/authStore'
import { useTokenRefresh } from './hooks/useTokenRefresh'
import { useMenuInit } from './hooks/useMenuInit'
import './i18n/config'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Students from './pages/students/Students'
import Teachers from './pages/teachers/Teachers'
import Universities from './pages/universities/Universities'
import Reports from './pages/reports/Reports'
import { TranslationsPage, TranslationFormPage } from './pages/admin/translations'
import { UniversitiesPage } from './pages/registry/university'
import FacultiesPage from './pages/registry/faculty/FacultiesPage'

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()

  // ✅ Token is in HTTPOnly cookie - backend validates
  // Frontend only checks if user is authenticated in Zustand
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { initialize } = useAuthStore()

  // Initialize auth state on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // ✅ BEST PRACTICE: Proactive token refresh
  // Automatically refreshes token before it expires
  // No server load on every F5, only when token is about to expire
  // Only runs when user is authenticated
  useTokenRefresh()

  // ✅ BEST PRACTICE: Proactive menu loading
  // Loads menu from backend on app startup (with 1-hour cache)
  // Menu is permission-filtered by backend
  // Only runs when user is authenticated (checked inside hook)
  useMenuInit()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hemis-theme">
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="universities" element={<Universities />} />
            <Route path="registry">
              <Route path="e-reestr">
                <Route path="university" element={<UniversitiesPage />} />
                <Route path="faculty" element={<FacultiesPage />} />
              </Route>
            </Route>
              <Route path="reports" element={<Reports />} />
              <Route path="system">
                <Route path="translation" element={<TranslationsPage />} />
                <Route path="translation/create" element={<TranslationFormPage />} />
                <Route path="translation/:id/edit" element={<TranslationFormPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>

        {/* Toast Notifications (same as univer-front) */}
        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
