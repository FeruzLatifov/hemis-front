import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from './components/ThemeProvider'
import { queryClient } from './lib/queryClient'
import MainLayout from './components/layouts/MainLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthStore } from './stores/authStore'
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
const FacultiesPage = lazy(() =>
  import('./pages/institutions/faculties').then((m) => ({ default: m.FacultiesPage })),
)

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { t } = useTranslation()
  const { initialize, logout } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

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
                  <Route path="dashboard" element={<DashboardPage />} />

                  {/* Institutions */}
                  <Route path="institutions">
                    <Route path="universities" element={<UniversitiesPage />} />
                    <Route path="faculties" element={<FacultiesPage />} />
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
                  <Route path="students" element={<StudentsPage />} />
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
                  <Route path="teachers" element={<TeachersPage />} />
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
                  <Route path="reports" element={<ReportsPage />} />
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
                    <Route path="translations" element={<TranslationsPage />} />
                    <Route path="translation/create" element={<TranslationFormPage />} />
                    <Route path="translation/:id/edit" element={<TranslationFormPage />} />
                    <Route path="users" element={<PlaceholderPage title={t('Users')} />} />
                    <Route path="logs" element={<PlaceholderPage title={t('System logs')} />} />
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

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
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
