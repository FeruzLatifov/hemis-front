import { Suspense, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { captureError } from './lib/sentry'
import { lazyWithRetry } from './lib/lazy-with-retry'
import { authBroadcaster } from './lib/auth-broadcast'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from './components/ThemeProvider'
import { queryClient } from './lib/queryClient'
import MainLayout from './components/layouts/MainLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PageLoader } from './components/PageLoader'
import { useAuthStore } from './stores/authStore'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import './i18n/config'

// Lazy-loaded pages
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'))
const DashboardPage = lazyWithRetry(() => import('./pages/dashboard/DashboardPage'))
const StudentsLayout = lazyWithRetry(() => import('./pages/students/StudentsLayout'))
const StudentsPage = lazyWithRetry(() => import('./pages/students/StudentsPage'))
const StudentDuplicatesPage = lazyWithRetry(() => import('./pages/students/StudentDuplicatesPage'))
const StudentDirectionsPage = lazyWithRetry(() => import('./pages/students/StudentDirectionsPage'))
const GroupsPage = lazyWithRetry(() =>
  import('./pages/students/groups').then((m) => ({ default: m.GroupsPage })),
)
const DiplomasPage = lazyWithRetry(() =>
  import('./pages/students/diplomas').then((m) => ({ default: m.DiplomasPage })),
)
const ScholarshipsPage = lazyWithRetry(() =>
  import('./pages/students/scholarships').then((m) => ({ default: m.ScholarshipsPage })),
)
const CertificatesPage = lazyWithRetry(() =>
  import('./pages/students/certificates').then((m) => ({ default: m.CertificatesPage })),
)
const ResearchersPage = lazyWithRetry(() =>
  import('./pages/science/researchers').then((m) => ({ default: m.ResearchersPage })),
)
const ScientificProjectsPage = lazyWithRetry(() =>
  import('./pages/science/projects').then((m) => ({ default: m.ScientificProjectsPage })),
)
const PublicationsPage = lazyWithRetry(() =>
  import('./pages/science/publications').then((m) => ({ default: m.PublicationsPage })),
)
const MethodicalPage = lazyWithRetry(() =>
  import('./pages/science/methodical').then((m) => ({ default: m.MethodicalPage })),
)
const IntellectualPropertyPage = lazyWithRetry(() =>
  import('./pages/science/intellectual').then((m) => ({ default: m.IntellectualPropertyPage })),
)
const DissertationDefensePage = lazyWithRetry(() =>
  import('./pages/science/dissertation-defense').then((m) => ({
    default: m.DissertationDefensePage,
  })),
)
const ResearchActivityPage = lazyWithRetry(() =>
  import('./pages/science/research-activity').then((m) => ({ default: m.ResearchActivityPage })),
)
const EmployeeJobsPage = lazyWithRetry(() =>
  import('./pages/teachers/employee-jobs').then((m) => ({ default: m.EmployeeJobsPage })),
)
const UniversitySpecialitiesPage = lazyWithRetry(() =>
  import('./pages/institutions/university-specialities').then((m) => ({
    default: m.UniversitySpecialitiesPage,
  })),
)
const TeachersPage = lazyWithRetry(() => import('./pages/teachers/TeachersPage'))
const ReportsPage = lazyWithRetry(() => import('./pages/reports/ReportsPage'))
const StudentsReportPage = lazyWithRetry(() =>
  import('./pages/reports/students').then((m) => ({ default: m.StudentsReportPage })),
)
const InstitutionsReportPage = lazyWithRetry(() =>
  import('./pages/reports/institutions').then((m) => ({ default: m.InstitutionsReportPage })),
)
const ScientificReportPage = lazyWithRetry(() =>
  import('./pages/reports/scientific').then((m) => ({ default: m.ScientificReportPage })),
)
const TeachersReportPage = lazyWithRetry(() =>
  import('./pages/reports/teachers').then((m) => ({ default: m.TeachersReportPage })),
)
const AcademicReportPage = lazyWithRetry(() =>
  import('./pages/reports/academic').then((m) => ({ default: m.AcademicReportPage })),
)
const EconomicReportPage = lazyWithRetry(() =>
  import('./pages/reports/economic').then((m) => ({ default: m.EconomicReportPage })),
)
const AdministrativeRatingPage = lazyWithRetry(() =>
  import('./pages/ratings/administrative').then((m) => ({ default: m.AdministrativeRatingPage })),
)
const AcademicRatingPage = lazyWithRetry(() =>
  import('./pages/ratings/academic').then((m) => ({ default: m.AcademicRatingPage })),
)
const ScientificRatingPage = lazyWithRetry(() =>
  import('./pages/ratings/scientific').then((m) => ({ default: m.ScientificRatingPage })),
)
const GpaRatingPage = lazyWithRetry(() =>
  import('./pages/ratings/gpa').then((m) => ({ default: m.GpaRatingPage })),
)
const TranslationsPage = lazyWithRetry(() =>
  import('./pages/system/translations').then((m) => ({ default: m.TranslationsPage })),
)
const TranslationFormPage = lazyWithRetry(() =>
  import('./pages/system/translations').then((m) => ({ default: m.TranslationFormPage })),
)
const LogsPage = lazyWithRetry(() => import('./pages/system/logs/LogsPage'))
const UsersPage = lazyWithRetry(() =>
  import('./pages/system/users').then((m) => ({ default: m.UsersPage })),
)
const UserFormPage = lazyWithRetry(() =>
  import('./pages/system/users').then((m) => ({ default: m.UserFormPage })),
)
const OAuthClientsPage = lazyWithRetry(() =>
  import('./pages/system/oauth-clients').then((m) => ({ default: m.OAuthClientsPage })),
)
const UniversitiesPage = lazyWithRetry(() =>
  import('./pages/institutions/universities').then((m) => ({ default: m.UniversitiesPage })),
)
const UniversityDetailPage = lazyWithRetry(
  () => import('./pages/institutions/universities/UniversityDetailPage'),
)
const UniversityInfoPage = lazyWithRetry(() => import('./pages/university/UniversityInfoPage'))
const UniversityFormPage = lazyWithRetry(
  () => import('./pages/institutions/universities/UniversityFormPage'),
)
const FacultiesPage = lazyWithRetry(() =>
  import('./pages/institutions/faculties').then((m) => ({ default: m.FacultiesPage })),
)
const DepartmentsPage = lazyWithRetry(() =>
  import('./pages/institutions/departments').then((m) => ({ default: m.DepartmentsPage })),
)
const SpecialityAttachmentsPage = lazyWithRetry(() =>
  import('./pages/institutions/speciality-attachments').then((m) => ({
    default: m.SpecialityAttachmentsPage,
  })),
)
const DiplomaBlanksPage = lazyWithRetry(() =>
  import('./pages/institutions/diploma-blanks').then((m) => ({
    default: m.DiplomaBlanksPage,
  })),
)
const DiplomaBlankDistributionPage = lazyWithRetry(() =>
  import('./pages/institutions/diploma-blank-distribution').then((m) => ({
    default: m.DistributionPage,
  })),
)
const ClassifierCategoryPage = lazyWithRetry(
  () => import('./pages/classifiers/ClassifierCategoryPage'),
)
const SpecialityClassifierPage = lazyWithRetry(() => import('./pages/classifiers/speciality'))
const PositionsPage = lazyWithRetry(() => import('./pages/teachers/positions'))
const QualificationsPage = lazyWithRetry(() => import('./pages/teachers/qualifications'))
const RolesPage = lazyWithRetry(() =>
  import('./pages/system/roles').then((m) => ({ default: m.RolesPage })),
)
const RoleFormPage = lazyWithRetry(() =>
  import('./pages/system/roles').then((m) => ({ default: m.RoleFormPage })),
)
const WebhooksPage = lazyWithRetry(() =>
  import('./pages/system/webhooks').then((m) => ({ default: m.WebhooksPage })),
)
const OutboxPage = lazyWithRetry(() =>
  import('./pages/system/outbox').then((m) => ({ default: m.OutboxPage })),
)
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/ResetPasswordPage'))
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'))

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
      refresh().catch((error: unknown) => {
        // Log non-401 errors to Sentry for visibility
        const status = error instanceof Error ? (error as { status?: number }).status : undefined
        if (status !== 401) {
          captureError(error instanceof Error ? error : new Error('Permission refresh failed'), {
            tags: { context: 'permission_refresh' },
            level: 'warning',
          })
        }
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

  // Cross-tab auth sync. When another tab signs in/out, mirror that here
  // so a single logout closes every open tab and a login in tab A makes
  // tab B stop showing the "Please sign in" screen on next render.
  useEffect(() => {
    return authBroadcaster.subscribe((event) => {
      if (event.type === 'logout') {
        // Local-only — don't re-broadcast, don't call /auth/logout (the
        // originating tab already did).
        useAuthStore.setState({
          user: null,
          university: null,
          permissions: [],
          isAuthenticated: false,
        })
      } else if (event.type === 'login' || event.type === 'refresh') {
        // Pull fresh server state — cookie is shared across tabs.
        refresh().catch(() => {
          // Silent: if refresh fails, the logout-on-401 path will fire.
        })
      }
    })
  }, [refresh])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hemis-theme">
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                        <ProtectedRoute permission="institutions.universities.view">
                          <RouteErrorBoundary>
                            <UniversitiesPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="universities/create"
                      element={
                        <ProtectedRoute permission="institutions.universities.view">
                          <RouteErrorBoundary>
                            <UniversityFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="universities/:code"
                      element={
                        <ProtectedRoute permission="institutions.universities.view">
                          <RouteErrorBoundary>
                            <UniversityDetailPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="universities/:code/info"
                      element={
                        <RouteErrorBoundary>
                          <UniversityInfoPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="universities/:code/edit"
                      element={
                        <ProtectedRoute permission="institutions.universities.view">
                          <RouteErrorBoundary>
                            <UniversityFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="faculties"
                      element={
                        <ProtectedRoute permission="institutions.faculties.view">
                          <RouteErrorBoundary>
                            <FacultiesPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="departments"
                      element={
                        <ProtectedRoute permission="institutions.departments.view">
                          <RouteErrorBoundary>
                            <DepartmentsPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="speciality-attachments"
                      element={
                        <ProtectedRoute permission="institutions.speciality-attachments.view">
                          <RouteErrorBoundary>
                            <SpecialityAttachmentsPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="diploma-blanks"
                      element={
                        <ProtectedRoute permission="institutions.diploma-blanks.view">
                          <RouteErrorBoundary>
                            <DiplomaBlanksPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="diploma-blank-distribution"
                      element={
                        <ProtectedRoute permission="institutions.diploma-blank-distribution.view">
                          <RouteErrorBoundary>
                            <DiplomaBlankDistributionPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="university-specialities"
                      element={
                        <ProtectedRoute permission="institutions.university-specialities.view">
                          <RouteErrorBoundary>
                            <UniversitySpecialitiesPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Students — shared horizontal tab layout */}
                  <Route
                    path="students"
                    element={
                      <ProtectedRoute permission="students.view">
                        <RouteErrorBoundary>
                          <StudentsLayout />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<StudentsPage />} />
                    <Route path="duplicates" element={<StudentDuplicatesPage />} />
                    <Route path="directions" element={<StudentDirectionsPage />} />
                    <Route
                      path="groups"
                      element={
                        <RouteErrorBoundary>
                          <GroupsPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="diplomas"
                      element={
                        <RouteErrorBoundary>
                          <DiplomasPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="scholarships"
                      element={
                        <RouteErrorBoundary>
                          <ScholarshipsPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="certificates"
                      element={
                        <RouteErrorBoundary>
                          <CertificatesPage />
                        </RouteErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Teachers */}
                  <Route
                    path="teachers"
                    element={
                      <ProtectedRoute permission="teachers.view">
                        <RouteErrorBoundary>
                          <TeachersPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teachers/positions"
                    element={
                      <ProtectedRoute permission="teachers.view">
                        <RouteErrorBoundary>
                          <PositionsPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teachers/qualifications"
                    element={
                      <ProtectedRoute permission="teachers.view">
                        <RouteErrorBoundary>
                          <QualificationsPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teachers/employee-jobs"
                    element={
                      <ProtectedRoute permission="teachers.view">
                        <RouteErrorBoundary>
                          <EmployeeJobsPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  {/* Science */}
                  <Route path="science">
                    <Route
                      path="researchers"
                      element={
                        <ProtectedRoute permission="science.view">
                          <RouteErrorBoundary>
                            <ResearchersPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="projects"
                      element={
                        <ProtectedRoute permission="science.view">
                          <RouteErrorBoundary>
                            <ScientificProjectsPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="publications"
                      element={
                        <ProtectedRoute permission="science.view">
                          <RouteErrorBoundary>
                            <PublicationsPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="methodical"
                      element={
                        <ProtectedRoute permission="science.view">
                          <RouteErrorBoundary>
                            <MethodicalPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="intellectual"
                      element={
                        <ProtectedRoute permission="science.view">
                          <RouteErrorBoundary>
                            <IntellectualPropertyPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="dissertation-defense"
                      element={
                        <ProtectedRoute permission="science.view">
                          <RouteErrorBoundary>
                            <DissertationDefensePage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="research-activity"
                      element={
                        <ProtectedRoute permission="science.view">
                          <RouteErrorBoundary>
                            <ResearchActivityPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Reports */}
                  <Route
                    path="reports"
                    element={
                      <ProtectedRoute permission="reports.view">
                        <RouteErrorBoundary>
                          <ReportsPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/students"
                    element={
                      <ProtectedRoute permission="reports.students.view">
                        <RouteErrorBoundary>
                          <StudentsReportPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/teachers"
                    element={
                      <ProtectedRoute permission="reports.teachers.view">
                        <RouteErrorBoundary>
                          <TeachersReportPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/institutions"
                    element={
                      <ProtectedRoute permission="reports.institutions.view">
                        <RouteErrorBoundary>
                          <InstitutionsReportPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/academic"
                    element={
                      <ProtectedRoute permission="reports.academic.view">
                        <RouteErrorBoundary>
                          <AcademicReportPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/research"
                    element={
                      <ProtectedRoute permission="reports.research.view">
                        <RouteErrorBoundary>
                          <ScientificReportPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports/economic"
                    element={
                      <ProtectedRoute permission="reports.economic.view">
                        <RouteErrorBoundary>
                          <EconomicReportPage />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  {/* Rating */}
                  <Route path="rating">
                    <Route
                      path="administrative"
                      element={
                        <ProtectedRoute permission="rating.administrative.view">
                          <RouteErrorBoundary>
                            <AdministrativeRatingPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="academic"
                      element={
                        <ProtectedRoute permission="rating.academic.view">
                          <RouteErrorBoundary>
                            <AcademicRatingPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="scientific"
                      element={
                        <ProtectedRoute permission="rating.scientific.view">
                          <RouteErrorBoundary>
                            <ScientificRatingPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="gpa"
                      element={
                        <ProtectedRoute permission="rating.gpa.view">
                          <RouteErrorBoundary>
                            <GpaRatingPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Classifiers */}
                  <Route path="classifiers">
                    <Route
                      path="speciality"
                      element={
                        <ProtectedRoute permission="classifiers.speciality.view">
                          <RouteErrorBoundary>
                            <SpecialityClassifierPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path=":category"
                      element={
                        <ProtectedRoute permission="classifiers.view">
                          <RouteErrorBoundary>
                            <ClassifierCategoryPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* System */}
                  <Route path="system">
                    <Route
                      path="translations"
                      element={
                        <ProtectedRoute permission="system.translation.view">
                          <RouteErrorBoundary>
                            <TranslationsPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="translation/create"
                      element={
                        <ProtectedRoute permission="system.translation.view">
                          <RouteErrorBoundary>
                            <TranslationFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="translation/:id/edit"
                      element={
                        <ProtectedRoute permission="system.translation.view">
                          <RouteErrorBoundary>
                            <TranslationFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="users"
                      element={
                        <ProtectedRoute permission="users.view">
                          <RouteErrorBoundary>
                            <UsersPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="users/new"
                      element={
                        <ProtectedRoute permission="users.view">
                          <RouteErrorBoundary>
                            <UserFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="users/:id/edit"
                      element={
                        <ProtectedRoute permission="users.view">
                          <RouteErrorBoundary>
                            <UserFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="oauth-clients"
                      element={
                        <ProtectedRoute permission="oauth-clients.view">
                          <RouteErrorBoundary>
                            <OAuthClientsPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="roles"
                      element={
                        <ProtectedRoute permission="roles.manage">
                          <RouteErrorBoundary>
                            <RolesPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="roles/new"
                      element={
                        <ProtectedRoute permission="roles.manage">
                          <RouteErrorBoundary>
                            <RoleFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="roles/:id/edit"
                      element={
                        <ProtectedRoute permission="roles.manage">
                          <RouteErrorBoundary>
                            <RoleFormPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
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
                      path="webhooks"
                      element={
                        <ProtectedRoute permission="webhook.view">
                          <RouteErrorBoundary>
                            <WebhooksPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="outbox"
                      element={
                        <ProtectedRoute permission="outbox.view">
                          <RouteErrorBoundary>
                            <OutboxPage />
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="report-updates"
                      element={
                        <ProtectedRoute permission="system.report-update.view">
                          <PlaceholderPage title={t('Report updates')} />
                        </ProtectedRoute>
                      }
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
