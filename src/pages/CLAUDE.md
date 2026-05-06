# src/pages — Feature Pages

> Domain-driven struktura. Har feature `pages/{domain}/{feature}/` da.

---

## Domain Folders

```
pages/
├── auth/                    # Login, password reset
├── classifiers/             # Classifier management
├── dashboard/               # Asosiy dashboard
├── institutions/            # Universitet/fakultet/department
├── reports/                 # Hisobotlar
├── students/                # Talaba boshqaruv
├── system/                  # System settings, translations
├── teachers/                # O'qituvchilar
├── university/              # University admin features
├── LoginPage.tsx            # Top-level auth
└── NotFoundPage.tsx         # 404
```

---

## Feature Folder Pattern

```
pages/students/
├── StudentsPage.tsx              # Main list
├── StudentFormDialog.tsx         # Create/edit dialog
├── StudentDetailDrawer.tsx       # View detail
├── DuplicateDetailDrawer.tsx     # Custom feature drawer
├── components/                   # Feature-specific components
│   ├── StudentRow.tsx
│   └── StudentFilters.tsx
└── hooks/                        # Feature-specific hooks (kerak bo'lsa)
    └── useStudentSearch.ts
```

**Naming:**

- `*Page.tsx` — top-level route component
- `*Dialog.tsx` — modal (form/confirm)
- `*Drawer.tsx` — side panel
- `*Sheet.tsx` — bottom sheet (mobile)
- `*Section.tsx` — large component within page

---

## Page Component Anatomy

```tsx
// pages/students/StudentsPage.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useStudents } from '@/hooks/useStudents'
import { Card } from '@/components/ui/card'
import { StudentForm } from './StudentFormDialog'

export default function StudentsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL state — pagination, filter
  const page = Number(searchParams.get('page') ?? 0)
  const facultyId = searchParams.get('facultyId') ?? undefined

  // Local UI state
  const [editingId, setEditingId] = useState<string | null>(null)

  // Server state
  const { data, isLoading, isError } = useStudents({ page, facultyId })

  // Loading / error / empty
  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (isError) return <ErrorMessage />
  if (!data || data.totalElements === 0) return <EmptyState />

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl">{t('Students')}</h1>
      {/* Filters, Table, Pagination */}
    </div>
  )
}
```

---

## Routing — Lazy Loading (Code Splitting)

```tsx
// App.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// ✓ TO'G'RI — lazy load (route bundle alohida chunk)
const StudentsPage = lazy(() => import('./pages/students/StudentsPage'))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'))

<Routes>
    <Route element={<Suspense fallback={<PageSkeleton />}>}>
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
    </Route>
</Routes>
```

**Foyda:** Initial bundle kichikroq, route'ga kirilganda yuklanadi.

**Diqqat:** `xlsx` (4MB+) — dynamic import (`await import('xlsx')`), eager import emas.

---

## URL State — `useSearchParams`

```tsx
// ✓ TO'G'RI — pagination URL'da, share/bookmark mumkin
const [searchParams, setSearchParams] = useSearchParams()
const page = Number(searchParams.get('page') ?? 0)
const facultyId = searchParams.get('facultyId') ?? undefined

const handlePageChange = (newPage: number) => {
  setSearchParams((prev) => {
    prev.set('page', String(newPage))
    return prev
  })
}

// ✗ XATO — useState'da pagination
const [page, setPage] = useState(0) // sahifa refresh'da yo'qoladi
```

---

## Permission Gate

```tsx
import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/services/auth.service'

export default function StudentsPage() {
  const { user } = useAuthStore()

  if (!hasPermission(user?.permissions ?? [], 'students.view')) {
    return <ForbiddenPage />
  }

  return <div>...</div>
}
```

Yoki `<RequirePermission permission="students.view">` wrapper component.

---

## Form Dialog Pattern

```tsx
// pages/students/StudentFormDialog.tsx
interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId?: string // undefined = create, string = edit
}

export function StudentFormDialog({ open, onOpenChange, studentId }: StudentFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!studentId

  // Edit mode'da current data fetch
  const { data: student } = useStudent(studentId)

  // Mutation
  const createMutation = useCreateStudent()
  const updateMutation = useUpdateStudent()

  const form = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: student ?? defaultValues,
  })

  const onSubmit = async (data: StudentForm) => {
    if (isEdit) {
      await updateMutation.mutateAsync({ id: studentId, data })
    } else {
      await createMutation.mutateAsync(data)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('Edit student') : t('Create student')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* fields */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Page-Level i18n

```tsx
// ✓ TO'G'RI — har page'da useTranslation
const { t } = useTranslation()
return <h1>{t('Students')}</h1>

// ✗ TAQIQ — hardcode
return <h1>Talabalar</h1>
return <h1>Студенты</h1>

// ✓ Interpolation
{
  t('{{count}} students found', { count: data.totalElements })
}
```

---

## Page Test Pattern

```tsx
// pages/students/__tests__/StudentsPage.test.tsx
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import StudentsPage from '../StudentsPage'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // test'da retry yo'q
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('StudentsPage', () => {
  test('renders student list', async () => {
    // MSW handler students mock qaytaradi (`src/test/mocks/`)
    renderWithProviders(<StudentsPage />)
    expect(await screen.findByText('Students')).toBeInTheDocument()
  })

  test('shows empty state', async () => {
    // MSW override empty response
    renderWithProviders(<StudentsPage />)
    expect(await screen.findByText('No data')).toBeInTheDocument()
  })
})
```

---

## PR Checklist (pages/)

- [ ] File nomi `*Page.tsx` / `*Dialog.tsx` / `*Drawer.tsx` (PascalCase)
- [ ] Page'da `useTranslation` (har matn `t()` orqali)
- [ ] URL state — `useSearchParams` (pagination, filter)
- [ ] Server state — TanStack Query hook
- [ ] Lazy load route bo'yicha (`React.lazy`)
- [ ] xlsx kabi katta deps — dynamic import
- [ ] Permission check (UNIVERSITY_ADMIN scope)
- [ ] Loading/error/empty state'lari ko'rsatilgan
- [ ] Test (`__tests__/*.test.tsx`) — render + key user flow

---

## See Also

- `@../components/CLAUDE.md` — UI primitives
- `@../hooks/CLAUDE.md` — TanStack Query patterns
- `@../api/CLAUDE.md` — API service
