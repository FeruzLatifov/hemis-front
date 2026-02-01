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

// Placeholder page for new routes
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-color-primary mb-2">{title}</h2>
      <p className="text-sm text-color-secondary">Bu sahifa hozirda ishlab chiqilmoqda</p>
    </div>
  </div>
)

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

  useEffect(() => {
    initialize()
  }, [initialize])

  useTokenRefresh()
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

              {/* Institutions */}
              <Route path="institutions">
                <Route path="universities" element={<UniversitiesPage />} />
                <Route path="faculties" element={<FacultiesPage />} />
                <Route path="departments" element={<PlaceholderPage title="Kafedralar" />} />
                <Route path="attached-specialities" element={<PlaceholderPage title="OTM yo'nalishlari" />} />
              </Route>

              {/* Students */}
              <Route path="students" element={<Students />} />
              <Route path="students/directions" element={<PlaceholderPage title="Yo'nalishlar" />} />
              <Route path="students/groups" element={<PlaceholderPage title="Guruhlar" />} />
              <Route path="students/diplomas" element={<PlaceholderPage title="Diplomlar" />} />
              <Route path="students/scholarships" element={<PlaceholderPage title="Stipendiyalar" />} />
              <Route path="students/certificates" element={<PlaceholderPage title="Sertifikatlar" />} />

              {/* Teachers */}
              <Route path="teachers" element={<Teachers />} />
              <Route path="teachers/positions" element={<PlaceholderPage title="Lavozimlar" />} />
              <Route path="teachers/qualifications" element={<PlaceholderPage title="Malakalar" />} />

              {/* Science */}
              <Route path="science">
                <Route path="researchers" element={<PlaceholderPage title="Tadqiqotchilar" />} />
                <Route path="projects" element={<PlaceholderPage title="Ilmiy loyihalar" />} />
                <Route path="publications" element={<PlaceholderPage title="Nashrlar" />} />
                <Route path="methodical" element={<PlaceholderPage title="Metodik ishlar" />} />
                <Route path="intellectual" element={<PlaceholderPage title="Intellektual mulk" />} />
              </Route>

              {/* Reports */}
              <Route path="reports" element={<Reports />} />
              <Route path="reports/students" element={<PlaceholderPage title="Talabalar hisoboti" />} />
              <Route path="reports/teachers" element={<PlaceholderPage title="O'qituvchilar hisoboti" />} />
              <Route path="reports/institutions" element={<PlaceholderPage title="Muassasalar hisoboti" />} />
              <Route path="reports/academic" element={<PlaceholderPage title="Akademik hisobot" />} />
              <Route path="reports/research" element={<PlaceholderPage title="Ilmiy hisobot" />} />
              <Route path="reports/economic" element={<PlaceholderPage title="Iqtisodiy hisobot" />} />

              {/* Rating */}
              <Route path="rating">
                <Route path="administrative" element={<PlaceholderPage title="Ma'muriy reyting" />} />
                <Route path="academic" element={<PlaceholderPage title="Akademik reyting" />} />
                <Route path="scientific" element={<PlaceholderPage title="Ilmiy reyting" />} />
                <Route path="gpa" element={<PlaceholderPage title="GPA reyting" />} />
              </Route>

              {/* Classifiers */}
              <Route path="classifiers">
                <Route path="general" element={<PlaceholderPage title="Umumiy klassifikatorlar" />} />
                <Route path="structure" element={<PlaceholderPage title="Tuzilma" />} />
                <Route path="employee" element={<PlaceholderPage title="Xodimlar" />} />
                <Route path="student" element={<PlaceholderPage title="Talabalar" />} />
                <Route path="education" element={<PlaceholderPage title="Ta'lim" />} />
                <Route path="study" element={<PlaceholderPage title="O'quv jarayoni" />} />
                <Route path="science" element={<PlaceholderPage title="Ilmiy" />} />
                <Route path="organizational" element={<PlaceholderPage title="Tashkiliy" />} />
              </Route>

              {/* System */}
              <Route path="system">
                <Route path="translations" element={<TranslationsPage />} />
                <Route path="translation/create" element={<TranslationFormPage />} />
                <Route path="translation/:id/edit" element={<TranslationFormPage />} />
                <Route path="users" element={<PlaceholderPage title="Foydalanuvchilar" />} />
                <Route path="logs" element={<PlaceholderPage title="Tizim loglari" />} />
                <Route path="report-updates" element={<PlaceholderPage title="Hisobot yangilanishlari" />} />
              </Route>

              {/* Legacy routes (backward compatibility) */}
              <Route path="universities" element={<Navigate to="/institutions/universities" replace />} />
              <Route path="registry/e-reestr/university" element={<Navigate to="/institutions/universities" replace />} />
              <Route path="registry/e-reestr/faculty" element={<Navigate to="/institutions/faculties" replace />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>

        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
