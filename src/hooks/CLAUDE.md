# src/hooks — Custom Hooks

> Domain logic'ni reusable hook'larga ajratamiz. TanStack Query 5.90 + Zustand 5 + custom utilities.

---

## TOP Hook Patterns

### 1. TanStack Query — `useQuery`

```typescript
// hooks/useStudents.ts
export function useStudents(params: StudentSearchParams) {
  return useQuery({
    queryKey: queryKeys.students.list(params),
    queryFn: () => studentsApi.list(params),
    // Default'lar `lib/queryClient.ts` da:
    // staleTime: 5 * 60 * 1000  (5 min)
    // retry: 2 (4xx skip)
    // refetchOnWindowFocus: false
  })
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.detail(id ?? ''),
    queryFn: () => studentsApi.getById(id!),
    enabled: !!id, // ID yo'q bo'lsa query ishga tushmaydi
  })
}
```

**Pattern:**

- Hook nomi `use{Domain}` yoki `use{Domain}{Action}`
- Query key — centralized `queryKeys`
- `enabled` — conditional fetch
- `staleTime` long-cached classifier'lar uchun (`useClassifiers.ts` 1 soat)

### 2. TanStack Mutation — `useMutation`

```typescript
export function useCreateStudent() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: (newStudent) => {
      // Cache update (optimistic) yoki invalidate
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() })
      toast.success(i18n.t('Student created'))
    },
    // onError default — interceptor toast (custom kerak bo'lsa override)
  })
}
```

**Mutation invariant:** Har CREATE/UPDATE/DELETE'dan keyin **mos prefix invalidate**.

### 3. `useEffect` ichida API Call — TAQIQ

```typescript
// ✗ TAQIQ — useEffect API call
useEffect(() => {
  fetchStudents().then(setStudents)
}, [])

// ✗ TAQIQ — debounced effect
useEffect(() => {
  const timer = setTimeout(() => {
    if (search) studentsApi.search(search).then(setResults)
  }, 400)
  return () => clearTimeout(timer)
}, [search])

// ✓ TO'G'RI — useQuery + useDebounce
const debouncedSearch = useDebounce(search, 400)
const { data: results } = useQuery({
  queryKey: queryKeys.students.search(debouncedSearch),
  queryFn: () => studentsApi.search(debouncedSearch),
  enabled: debouncedSearch.length >= 2,
})

// ✓ TO'G'RI — useMutation + useDebounce (PINFL lookup pattern)
const lookupMutation = useMutation({ mutationFn: lookupApi.byPinfl })
const debouncedPinfl = useDebounce(pinfl, 400)
useEffect(() => {
  if (debouncedPinfl.length === 14) lookupMutation.mutate(debouncedPinfl)
}, [debouncedPinfl])
```

### 4. `useState` Reducer Pattern

```typescript
// ✗ Ko'p useState — sync risk
const [page, setPage] = useState(0)
const [size, setSize] = useState(20)
const [search, setSearch] = useState('')
const [filter, setFilter] = useState({})

// ✓ Composite — atomic update
const [params, setParams] = useState<StudentSearchParams>({
  page: 0,
  size: 20,
  search: '',
  facultyId: undefined,
})

// Yoki useReducer
const [state, dispatch] = useReducer(reducer, initialState)
```

### 5. Custom Hook — Reusable Logic

Mavjud hooks (real, ishlatiladi):

- `useDebounce(value, delay)` — input throttling
- `useAbortController()` — request cancellation
- `useStableCallback(fn)` — referential stability
- `usePagination()` — page/size state
- `useClearCache()` — cache clear button
- `useFocusTrap()` — modal focus management
- `useIdleTimeout()` — auth timeout
- `useErrorRecovery()` — error boundary helper

**Yangi custom hook qachon yaratiladi:**

- 2+ component'da bir xil logic ishlatilsa
- Murakkab state machine (idle → loading → success/error)
- Side effect orchestration (timeout, listener, cleanup)

### 6. Hook Naming va Return

```typescript
// ✓ TO'G'RI
export function useStudent(id: string) { ... }                    // single fetch
export function useStudents(params) { ... }                       // list
export function useStudentMutations() { ... }                     // CRUD bundle
export function useStudentSearch() { return { query, results } }  // composite

// ✗ XATO
export function getStudent(id) { ... }       // hook 'use' bilan boshlanmadi
export function StudentHook() { ... }         // PascalCase — component bilan adashadi
```

**Return shape:**

- Tuple `[value, setValue]` — useState-like
- Object `{ data, isLoading, error }` — query-like
- Function `useCallback(...)` — bitta action

### 7. Dependencies Array — `eslint-plugin-react-hooks`

```typescript
// ✗ XATO — exhaustive-deps warning
useEffect(() => {
    handleSearch(query)
}, [query])  // handleSearch missing in deps

// ✓ TO'G'RI
useEffect(() => {
    handleSearch(query)
}, [query, handleSearch])

// Yoki — handleSearch'ni `useCallback` bilan stable qiling
const handleSearch = useCallback((q: string) => { ... }, [/* deps */])
```

**Qoida:** ESLint `react-hooks/exhaustive-deps` — har doim qondirish (warning'ni ignore qilmang).

### 8. Cleanup — Memory Leaks Himoyasi

```typescript
useEffect(() => {
    const handler = () => { /* ... */ }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)  // ← cleanup MAJBURIY
}, [])

useEffect(() => {
    const timer = setInterval(() => { ... }, 1000)
    return () => clearInterval(timer)  // ← cleanup
}, [])

// AbortController bilan
useEffect(() => {
    const controller = new AbortController()
    fetch(url, { signal: controller.signal }).then(...)
    return () => controller.abort()
}, [url])
```

### 9. `useStableCallback` — Stable Reference

Komponent re-render'da function reference o'zgaradi → child memo'lar bekor bo'ladi.

```typescript
// hooks/useStableCallback.ts (mavjud)
export function useStableCallback<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const ref = useRef(fn)
  useLayoutEffect(() => {
    ref.current = fn
  })
  return useCallback(((...args) => ref.current(...args)) as T, [])
}

// Foydalanish — child memo'larni bekor qilmaslik uchun
const handleClick = useStableCallback((id: string) => {
  if (someFlag) doX(id) // closure'dagi flag ham yangilanadi
})
```

### 10. Server State vs Client State

```typescript
// ✓ Server state → TanStack Query
const { data: students } = useQuery({ queryKey: [...], queryFn: ... })

// ✓ Global UI state → Zustand
const { user, isAuthenticated } = useAuthStore()

// ✓ URL state (pagination/filter) → useSearchParams
const [searchParams, setSearchParams] = useSearchParams()
const page = Number(searchParams.get('page') ?? 0)

// ✓ Local state → useState
const [isOpen, setIsOpen] = useState(false)
```

**API javoblarni Zustand'da saqlamang!** Cache invalidation TanStack Query'da centralized.

---

## Mavjud Hook'lar Reference (`src/hooks/`)

| Hook                                   | Maqsad                      |
| -------------------------------------- | --------------------------- |
| `useAuth*`                             | Authentication state        |
| `useClassifiers`                       | Classifier data (24h cache) |
| `useDashboard`                         | Dashboard widgets           |
| `useFaculties`                         | Faculty list                |
| `useFavorites`                         | User favorites              |
| `useMenu*`                             | Sidebar menu                |
| `useRoles`, `useAuditLogs`, `useAudit` | RBAC + audit                |
| `useDebounce`                          | Input throttling            |
| `useAbortController`                   | Request cancellation        |
| `useStableCallback`                    | Stable function reference   |
| `usePagination`                        | Page state                  |
| `useClearCache`                        | Cache clear                 |
| `useFocusTrap`, `useIdleTimeout`       | a11y + auth                 |
| `useErrorRecovery`                     | Error boundary helper       |

---

## PR Checklist (hooks/)

- [ ] Hook nomi `use*` bilan boshlangan
- [ ] `useEffect` ichida API call yo'q (`useQuery`/`useMutation`)
- [ ] Query key `queryKeys` da centralized
- [ ] Mutation onSuccess'da invalidate prefix mos
- [ ] `enabled` — conditional fetch (ID yo'q bo'lsa skip)
- [ ] ESLint `exhaustive-deps` warning yo'q
- [ ] Cleanup return `useEffect`'da (listener, timer)
- [ ] Server state → Query, UI → Zustand, URL → useSearchParams
- [ ] Test (`__tests__/use*.test.ts`)

---

## See Also

- `@../api/CLAUDE.md` — API service patterns
- `@../stores/CLAUDE.md` — Zustand patterns
- `@../../CLAUDE.md` — i18n + state management
