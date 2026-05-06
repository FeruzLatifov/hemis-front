# src/stores — Zustand State Management

> Zustand 5.0.10. **Faqat global UI state** uchun.
> Server state TanStack Query'da, API javoblarni Zustand'da saqlamang.

---

## Mavjud Stores

| Store             | Maqsad                             | Persisted?              |
| ----------------- | ---------------------------------- | ----------------------- |
| `authStore`       | User, accessToken, isAuthenticated | localStorage            |
| `menuStore`       | Sidebar menu structure             | yo'q (refetch)          |
| `recentMenuStore` | So'nggi ko'rilgan sahifalar        | localStorage            |
| `favoritesStore`  | User favorite pages                | localStorage (sync API) |

---

## Patterns

### 1. Store Definition

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),

      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        // user — har sessionda /auth/me'dan yangi keladi
      }),
    },
  ),
)
```

### 2. Selector Pattern — Subscribe Only What You Need

```tsx
// ✗ XATO — butun store'ga subscribe (har action'da re-render)
const store = useAuthStore()
return <div>{store.user?.name}</div>

// ✓ TO'G'RI — selector
const user = useAuthStore((state) => state.user)
const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
return <div>{user?.name}</div>

// ✓ Multiple values — `useShallow`
import { useShallow } from 'zustand/react/shallow'
const { user, isAuthenticated } = useAuthStore(
  useShallow((state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })),
)
```

### 3. Action vs State

```typescript
// ✓ TO'G'RI — actions selector
const logout = useAuthStore((state) => state.logout)
const handleLogout = () => logout()

// Actions stable reference (useShallow kerak emas — function reference don't change)
```

### 4. API Javoblarni Zustand'da Saqlamaslik — TAQIQ

```typescript
// ✗ TAQIQ — API javob Zustand'da
const useStudentStore = create((set) => ({
  students: [],
  fetchStudents: async () => {
    const data = await studentsApi.list()
    set({ students: data })
  },
}))
// Muammo: cache invalidation, refetch, dedup yo'q. TanStack Query funksiyalarini qayta yozish.

// ✓ TO'G'RI — TanStack Query
const { data: students } = useQuery({
  queryKey: queryKeys.students.lists(),
  queryFn: studentsApi.list,
})
```

**Istisno:** Auth user ma'lumoti — Zustand'da OK (qisqa, simple, persisted). Lekin asosiy talaba/fakultet ro'yxati emas.

### 5. Persist Middleware

```typescript
persist(storeImpl, {
  name: 'auth-storage', // localStorage key
  partialize: (state) => ({
    // Faqat shu field'larni saqlash
    accessToken: state.accessToken,
    isAuthenticated: state.isAuthenticated,
  }),
  storage: createJSONStorage(() => sessionStorage), // optional: session
})
```

**Diqqat:**

- Sensitive data (`accessToken`) — localStorage'da. XSS xavfi bor (DOMPurify ishlatiladi). Kelajakda `httpOnly` cookie tavsiya etiladi.
- `user` ma'lumotini persist qilmang — har sessionda `/auth/me`'dan freshly olinsin.

### 6. Cross-Store Communication

```typescript
// ✓ Store ichida boshqa store action chaqirish
export const useMenuStore = create((set) => ({
  menu: null,
  loadMenu: async () => {
    const isAuth = useAuthStore.getState().isAuthenticated
    if (!isAuth) return
    const data = await menuApi.get()
    set({ menu: data })
  },
}))
```

`getState()` — outside React (init, action). React komponentda — selector ishlatish.

### 7. Reset on Logout

```typescript
// authStore.logout() — auth ma'lumotni tozalaydi
// Boshqa store'lar ham tozalanishi kerak

logout: () => {
  set({ user: null, accessToken: null, isAuthenticated: false })

  // Cross-store reset
  useFavoritesStore.getState().reset()
  useRecentMenuStore.getState().clear()

  // TanStack Query cache invalidate
  queryClient.clear()
}
```

### 8. Devtools

```typescript
// ✗ Production'da devtools yoqilmaydi
import { devtools } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(/* ... */),
    { name: 'AuthStore', enabled: import.meta.env.DEV }, // dev only
  ),
)
```

---

## Qachon Zustand, qachon Local useState?

| Vaziyat                                 | Yechim                     |
| --------------------------------------- | -------------------------- |
| Bir komponent state (dialog open/close) | `useState`                 |
| Bir komponent + child'larga props       | `useState` + props         |
| Sibling komponentlar bir state          | Lift state up + `useState` |
| Butun ilovada (auth, theme)             | `Zustand`                  |
| URL'da saqlanishi kerak (filter, page)  | `useSearchParams`          |
| Server'dan keladi                       | TanStack Query             |

---

## PR Checklist (stores/)

- [ ] Store nomi `use{Domain}Store` pattern
- [ ] Selector ishlatilgan (butun store'ga subscribe yo'q)
- [ ] API javob Zustand'da saqlanmagan (TanStack Query'ga ko'chirilgan)
- [ ] Persist `partialize` bilan (hammasini saqlamaslik)
- [ ] Sensitive data persist'da diqqat (XSS xavfi)
- [ ] Logout reset boshqa store'larni ham tozalaydi
- [ ] Devtools faqat dev mode (production bundle'ga kirmaydi)
- [ ] Test (`__tests__/*.test.ts`)

---

## See Also

- `@../hooks/CLAUDE.md` — Server state (Query) vs UI state (Zustand)
- `@../api/CLAUDE.md` — API client + interceptor
