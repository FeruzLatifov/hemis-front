import { lazy, Suspense, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from './components/ThemeProvider'
import { queryClient } from './lib/queryClient'
import MainLayout from './components/layouts/MainLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { useAuthStore } from './stores/authStore'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import './i18n/config'

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const StudentsPage = lazy(() => import('./pages/students/StudentsPage'))
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage'))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'))
const TranslationsPage = lazy(() =>
  import('./pages/system/translations').then((m) => ({ default: m.TranslationsPage })),
)
const TranslationFormPage = lazy(() =>
  import('./pages/system/translations').then((m) => ({ default: m.TranslationFormPage })),
)
const UniversitiesPage = lazy(() =>
  import('./pages/institutions/universities').then((m) => ({ default: m.UniversitiesPage })),
)
const UniversityDetailPage = lazy(
  () => import('./pages/institutions/universities/UniversityDetailPage'),
)
const UniversityFormPage = lazy(
  () => import('./pages/institutions/universities/UniversityFormPage'),
)
const FacultiesPage = lazy(() =>
  import('./pages/institutions/faculties').then((m) => ({ default: m.FacultiesPage })),
)
const LogsPage = lazy(() => import('./pages/system/logs/LogsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Loading fallback
const PageLoader = () => {
  const { t } = useTranslation()
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-color-secondary text-sm">{t('Loading...')}</p>
      </div>
    </div>
  )
}

// Placeholder page for new routes
const PlaceholderPage = ({ title }: { title: string }) => {
  const { t } = useTranslation()
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <h2 className="text-color-primary mb-2 text-xl font-semibold">{title}</h2>
        <p className="text-color-secondary text-sm">{t('This page is under development')}</p>
      </div>
    </div>
  )
}

// Protected Route Wrapper
const ProtectedRoute = ({
  children,
  permission,
}: {
  children: React.ReactNode
  permission?: string
}) => {
  const { isAuthenticated, permissions } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Save the current location for redirect after login
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { t } = useTranslation()
  const { initialize, logout, refresh, isAuthenticated } = useAuthStore()

  // ✅ SECURITY: Auto-logout after idle timeout
  const handleIdleLogout = useCallback(() => {
    toast.warning(t('Session expired due to inactivity'))
    logout()
  }, [logout, t])

  useIdleTimeout({
    onIdle: handleIdleLogout,
    enabled: isAuthenticated,
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  // ✅ SECURITY: Periodic permission refresh (every 15 minutes)
  // Ensures permissions stay fresh even during long sessions
  useEffect(() => {
    if (!isAuthenticated) return

    const REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

    const intervalId = setInterval(() => {
      refresh().catch(() => {
        // Silent failure - if refresh fails, the next API call will handle it
      })
    }, REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [isAuthenticated, refresh])

  // Listen for auth:logout events from API interceptor
  useEffect(() => {
    const handleForceLogout = () => {
      logout()
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [logout])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hemis-theme">
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="dashboard"
                    element={
                      <RouteErrorBoundary>
                        <DashboardPage />
                      </RouteErrorBoundary>
                    }
                  />

                  {/* Institutions */}
                  <Route path="institutions">
                    <Route
                      path="universities"
                      element={
                        <RouteErrorBoundary>
                          <UniversitiesPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="universities/create"
                      element={
                        <RouteErrorBoundary>
                          <UniversityFormPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="universities/:code"
                      element={
                        <RouteErrorBoundary>
                          <UniversityDetailPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="universities/:code/edit"
                      element={
                        <RouteErrorBoundary>
                          <UniversityFormPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="faculties"
                      element={
                        <RouteErrorBoundary>
                          <FacultiesPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="departments"
                      element={<PlaceholderPage title={t('Departments')} />}
                    />
                    <Route
                      path="attached-specialities"
                      element={<PlaceholderPage title={t('University directions')} />}
                    />
                  </Route>

                  {/* Students */}
                  <Route
                    path="students"
                    element={
                      <RouteErrorBoundary>
                        <StudentsPage />
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="students/directions"
                    element={<PlaceholderPage title={t('Directions')} />}
                  />
                  <Route path="students/groups" element={<PlaceholderPage title={t('Groups')} />} />
                  <Route
                    path="students/diplomas"
                    element={<PlaceholderPage title={t('Diplomas')} />}
                  />
                  <Route
                    path="students/scholarships"
                    element={<PlaceholderPage title={t('Scholarships')} />}
                  />
                  <Route
                    path="students/certificates"
                    element={<PlaceholderPage title={t('Certificates')} />}
                  />

                  {/* Teachers */}
                  <Route
                    path="teachers"
                    element={
                      <RouteErrorBoundary>
                        <TeachersPage />
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="teachers/positions"
                    element={<PlaceholderPage title={t('Positions')} />}
                  />
                  <Route
                    path="teachers/qualifications"
                    element={<PlaceholderPage title={t('Qualifications')} />}
                  />

                  {/* Science */}
                  <Route path="science">
                    <Route
                      path="researchers"
                      element={<PlaceholderPage title={t('Researchers')} />}
                    />
                    <Route
                      path="projects"
                      element={<PlaceholderPage title={t('Scientific projects')} />}
                    />
                    <Route
                      path="publications"
                      element={<PlaceholderPage title={t('Publications')} />}
                    />
                    <Route
                      path="methodical"
                      element={<PlaceholderPage title={t('Methodical works')} />}
                    />
                    <Route
                      path="intellectual"
                      element={<PlaceholderPage title={t('Intellectual property')} />}
                    />
                  </Route>

                  {/* Reports */}
                  <Route
                    path="reports"
                    element={
                      <RouteErrorBoundary>
                        <ReportsPage />
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="reports/students"
                    element={<PlaceholderPage title={t('Students report')} />}
                  />
                  <Route
                    path="reports/teachers"
                    element={<PlaceholderPage title={t('Teachers report')} />}
                  />
                  <Route
                    path="reports/institutions"
                    element={<PlaceholderPage title={t('Institutions report')} />}
                  />
                  <Route
                    path="reports/academic"
                    element={<PlaceholderPage title={t('Academic report')} />}
                  />
                  <Route
                    path="reports/research"
                    element={<PlaceholderPage title={t('Scientific report')} />}
                  />
                  <Route
                    path="reports/economic"
                    element={<PlaceholderPage title={t('Economic report')} />}
                  />

                  {/* Rating */}
                  <Route path="rating">
                    <Route
                      path="administrative"
                      element={<PlaceholderPage title={t('Administrative rating')} />}
                    />
                    <Route
                      path="academic"
                      element={<PlaceholderPage title={t('Academic rating')} />}
                    />
                    <Route
                      path="scientific"
                      element={<PlaceholderPage title={t('Scientific rating')} />}
                    />
                    <Route path="gpa" element={<PlaceholderPage title={t('GPA rating')} />} />
                  </Route>

                  {/* Classifiers */}
                  <Route path="classifiers">
                    <Route
                      path="general"
                      element={<PlaceholderPage title={t('General classifiers')} />}
                    />
                    <Route path="structure" element={<PlaceholderPage title={t('Structure')} />} />
                    <Route path="employee" element={<PlaceholderPage title={t('Employees')} />} />
                    <Route path="student" element={<PlaceholderPage title={t('Students')} />} />
                    <Route path="education" element={<PlaceholderPage title={t('Education')} />} />
                    <Route path="study" element={<PlaceholderPage title={t('Study process')} />} />
                    <Route path="science" element={<PlaceholderPage title={t('Scientific')} />} />
                    <Route
                      path="organizational"
                      element={<PlaceholderPage title={t('Organizational')} />}
                    />
                  </Route>

                  {/* System */}
                  <Route path="system">
                    <Route
                      path="translations"
                      element={
                        <RouteErrorBoundary>
                          <TranslationsPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="translation/create"
                      element={
                        <RouteErrorBoundary>
                          <TranslationFormPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="translation/:id/edit"
                      element={
                        <RouteErrorBoundary>
                          <TranslationFormPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route path="users" element={<PlaceholderPage title={t('Users')} />} />
                    <Route
                      path="logs"
                      element={
                        <ProtectedRoute permission="audit.view">
                          <RouteErrorBoundary>
                            <LogsPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="report-updates"
                      element={<PlaceholderPage title={t('Report updates')} />}
                    />
                  </Route>

                  {/* Legacy routes (backward compatibility) */}
                  <Route
                    path="universities"
                    element={<Navigate to="/institutions/universities" replace />}
                  />
                  <Route
                    path="registry/e-reestr/university"
                    element={<Navigate to="/institutions/universities" replace />}
                  />
                  <Route
                    path="registry/e-reestr/faculty"
                    element={<Navigate to="/institutions/faculties" replace />}
                  />

                  {/* 404 for unknown routes within protected area */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Global 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>

        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
