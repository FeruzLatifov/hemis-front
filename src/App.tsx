import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/theme-provider'
import MainLayout from './components/layouts/MainLayout'
import { useAuthStore } from './stores/authStore'
import './i18n/config'

// Pages
import Login from './pages/LoginEnhanced'
import Dashboard from './pages/dashboard/Dashboard'
import Students from './pages/students/Students'
import Teachers from './pages/teachers/Teachers'
import Universities from './pages/universities/Universities'
import Reports from './pages/reports/Reports'

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()

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
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast Notifications */}
        <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
