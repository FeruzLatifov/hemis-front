# src/api — API Layer

> Axios client, service'lar (`{domain}.api.ts`), TanStack Query bilan ishlatiladi.
> Hech qachon bevosita `fetch` yoki yangi `axios.create` qo'llamang — barchasi `apiClient` orqali.

---

## TOP Frontend API Patterns

### 1. `apiClient` faqat shu yerda — direct axios TAQIQ

```typescript
// ✗ TAQIQ — har komponentda yangi instance
import axios from 'axios'
const data = await axios.get('http://localhost:8081/api/...')

// ✗ TAQIQ — direct fetch
const response = await fetch('/api/students')

// ✓ TO'G'RI — `apiClient` (`src/api/client.ts`)
import apiClient from '@/api/client'
const { data } = await apiClient.get<StudentDto[]>('/api/v1/web/students')
```

**Sabab:** `apiClient` ichida:

- `Authorization: Bearer <token>` avto-header
- `Accept-Language` (i18n locale)
- 401 → automatic refresh token retry
- Refresh fail → `auth:logout` event dispatch
- 30s timeout
- Sentry breadcrumb integration

### 2. Service fayl pattern — `{domain}.api.ts`

```typescript
// src/api/students.api.ts
import apiClient from './client'

export interface StudentDto {
  readonly id: string
  readonly firstName: string
  readonly lastName: string
  readonly maskedPinfl: string
  readonly facultyId: number
}

export interface StudentSearchParams {
  page?: number
  size?: number
  facultyId?: number
  search?: string
}

export const studentsApi = {
  list: async (params: StudentSearchParams) => {
    const { data } = await apiClient.get<PageResponse<StudentDto>>('/api/v1/web/students', {
      params,
    })
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<StudentDto>(`/api/v1/web/students/${id}`)
    return data
  },

  create: async (dto: StudentCreateDto) => {
    const { data } = await apiClient.post<StudentDto>('/api/v1/web/students', dto)
    return data
  },

  update: async (id: string, dto: StudentUpdateDto) => {
    const { data } = await apiClient.put<StudentDto>(`/api/v1/web/students/${id}`, dto)
    return data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/v1/web/students/${id}`)
  },
}
```

**Pattern:**

- DTO interface'lar `readonly` (immutable)
- Object literal export (`studentsApi.list(...)`)
- Async/await, generic type
- Error handling — interceptor'da centralized

### 3. Backend Response Format

```typescript
// Success
interface ResponseWrapper<T> {
  success: true
  data: T
  page?: PageInfo
  timestamp: string
}

// Error
interface ErrorResponse {
  success: false
  error: {
    code: string // 'RESOURCE_NOT_FOUND', 'VALIDATION_ERROR', ...
    message: string
    details?: FieldError[]
  }
  timestamp: string
}

interface PageInfo {
  number: number
  size: number
  totalElements: number
  totalPages: number
}
```

**Diqqat:** Hozirgi backend `ResponseWrapper<T>` qaytarmaydi, balki `T`'ning o'zini direct qaytaradi. Keyinroq backend yangilansa, `data` extract qilish kerak bo'ladi.

### 4. Error Handling — Interceptor'da

```typescript
// src/api/client.ts (mavjud)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 401 → token refresh
    if (error.response?.status === 401) {
      // ... refresh logic
    }

    // Network error
    if (!error.response) {
      toast.error(i18n.t('Network error'))
      return Promise.reject(error)
    }

    // 4xx, 5xx — toast + reject
    const errorData = error.response.data as ErrorResponse
    const message = errorData?.error?.message || i18n.t('Unexpected error')
    toast.error(message)
    return Promise.reject(error)
  },
)
```

**Komponentda hech qachon `try/catch` qilmang error toast uchun** — interceptor avtomatik qiladi. Faqat custom error logic kerak bo'lsa.

### 5. Query Keys — Centralized (`src/lib/queryKeys.ts`)

```typescript
// ✓ TO'G'RI — kalit centralized
export const queryKeys = {
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (params: StudentSearchParams) => [...queryKeys.students.lists(), params] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
  },
  // ...
}

// Hook'da
const { data } = useQuery({
  queryKey: queryKeys.students.list({ page: 0, facultyId: 1 }),
  queryFn: () => studentsApi.list({ page: 0, facultyId: 1 }),
})

// Mutation'dan keyin invalidate
queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() })
```

**Sabab:** Typo'dan himoya, refactor oson, prefix-based invalidation.

### 6. Mutation Pattern

```typescript
// hooks/useStudents.ts
export function useCreateStudent() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() })
      toast.success(i18n.t('Student created successfully'))
    },
    // onError → interceptor hal qiladi (default toast)
  })
}

// Komponentda
const createMutation = useCreateStudent()
createMutation.mutate(dto)
// yoki
await createMutation.mutateAsync(dto)
```

### 7. URL — Hardcode TAQIQ

```typescript
// ✗ TAQIQ
await fetch('http://localhost:8081/api/students')
const url = `${API_URL}/students`

// ✓ TO'G'RI — relative path apiClient'da baseURL bor
await apiClient.get('/api/v1/web/students')
```

`apiClient` config: `baseURL: import.meta.env.VITE_API_URL`.

### 8. `Accept-Language` — Avto

```typescript
// apiClient interceptor avto qo'shadi
config.headers['Accept-Language'] = mapLocaleToBcp47(i18n.language)
// uz → uz-UZ, oz → oz-UZ, ru → ru-RU, en → en-US
```

Backend localization shu header asosida tarjima qaytaradi.

### 9. File Upload (FormData)

```typescript
export const studentsApi = {
  importExcel: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await apiClient.post<ImportResult>('/api/v1/web/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
```

### 10. Cancellation — `AbortController`

```typescript
// useAbortController hook (mavjud)
const { signal } = useAbortController()

const { data } = useQuery({
  queryKey: queryKeys.students.list(params),
  queryFn: () => studentsApi.list(params, { signal }), // 2nd arg
})
```

Component unmount → request cancel.

---

## API Client Config (mavjud `client.ts`)

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30_000, // 30s
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: token + locale
// Response interceptor: 401 refresh, error toast
// Auth event: window.dispatchEvent(new CustomEvent('auth:logout'))
```

---

## PR Checklist (api/)

- [ ] Yangi API call `{domain}.api.ts` da, direct `axios`/`fetch` yo'q
- [ ] DTO interface'lar `readonly`
- [ ] Query key `queryKeys` da centralized
- [ ] Mutation'dan keyin `invalidateQueries` mos prefix bilan
- [ ] URL hardcode emas (relative path + `apiClient`)
- [ ] FormData upload `multipart/form-data` header
- [ ] Cancellation kerak bo'lsa AbortController signal
- [ ] Error handling — interceptor'ga ishonch (custom logic kerak bo'lsa explicit)
- [ ] Type — `unknown` afzal `any`'dan

---

## See Also

- `@../../CLAUDE.md` — Asosiy guideline
- `@../hooks/CLAUDE.md` — TanStack Query patterns
