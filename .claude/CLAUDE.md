# Frontend Guidelines – HEMIS Ministry 2.0

Welcome! This document is a **memory file** used by Claude Code when working
inside the HEMIS Ministry frontend. It summarizes the most important
conventions and rules for developing new pages, components and tests. The
goal is to ensure a **consistent user experience**, high code quality and
seamless integration with the Spring‐Boot backend (hemis‑back‑main).

---

## 🎓 Purpose & Scope

This frontend is a modern, TypeScript‑based React application built with
Vite, Tailwind CSS and the shadcn UI library. It communicates with a
Spring Boot backend via REST APIs. The guidelines below apply to all
developers contributing to the `frontend/` portion of the project and cover:

- **Design system** – colours, typography, spacing, components and
  accessibility rules.
- **API integration** – how to call backend endpoints securely and
  efficiently.
- **Architecture** – file structure, state management, custom hooks and
  organisation.
- **Testing and tooling** – how to write reliable unit and integration
  tests.
- **Security best practices** – token storage, role based access and
  user permissions.

Keep this file concise. Detailed guides on Swagger, testing and Liquibase
are imported from other documents when needed (see “Further Reading”).

---

## 🧑‍💻 Quick Start

1. **Clone & install** dependencies:

   ```bash
   # clone the repo and enter the frontend directory
   git clone <repo>
   cd frontend
   # install with Yarn (preferred) or npm
   yarn install
   # or: npm install
   ```

2. **Run locally:**

   ```bash
   # start Vite dev server (watching .env for VITE_API_URL)
   yarn dev
   # default dev port is 3000.  To change, set VITE_PORT in .env.
   ```

3. **Build & preview:**

   ```bash
   yarn build    # generate production assets in dist/
   yarn preview  # serve dist/ for a quick sanity check
   ```

4. **Environment variables** – copy `.env.example` to `.env` and define:

   ```env
   VITE_API_URL=http://localhost:8081   # base URL of hemis‑back‑main
   VITE_APP_NAME=HEMIS Ministry         # display name
   VITE_THEME=light                     # 'light' or 'dark'
   ```

   Do **not** hard‑code API endpoints or secrets in the code. Only use
   variables starting with `VITE_` – they will be exposed to the browser.

---

## 🎨 Design System

This application targets the Ministry of Higher Education. The design must
convey professionalism and trust while staying modern and accessible. The
colour palette reflects themes from education:

| Theme                 | Meaning                      | Hex codes                                                                                                                     |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Primary (Blue)**    | Knowledge, science, teachers | `#2F80ED` (main), `#2666BE` (hover)                                                                                           |
| **Secondary (Green)** | Growth, success, students    | `#27AE60` (success)                                                                                                           |
| **Tertiary (Purple)** | Creativity, courses, math    | Suggest `#9B51E0` or similar                                                                                                  |
| **Accent (Gold)**     | Achievement, awards, GPA     | `#F2C94C`                                                                                                                     |
| **Neutral**           | Text & borders               | `#1E2124` (primary text), `#6B7280` (secondary text), `#E5E7EB` (border), `#F5F6FA`/`#F4F5F7` (background), `#FFFFFF` (cards) |
| **Alert**             | Warning/Error                | `#F2C94C` (warning), `#EB5757` (error)                                                                                        |

Key rules:

- **No gradients or glass effects** – keep the UI flat and modern. Use
  subtle shadows only (e.g. `0 1px 2px rgba(15, 23, 42, 0.04)` on cards).
- **At most two accent colours per page** – primary + one secondary. Too
  many colours distract the user.
- **Buttons always include text** – even if there is an icon, accompany it
  with clear Uzbek text such as “Qo‘shish” or “Saqlash”.
- **Tables should be light and airy** – table borders use `#E5E7EB`, and
  rows have alternating subtle backgrounds (`#FFFFFF`/`#F9FAFB`). Avoid
  dark separators.
- **Cards and modals** use white (`#FFFFFF`) with a thin border and small
  radius (`6px`) and the shadow mentioned above.
- **Typography** – use `Inter` and `Poppins` fonts (already included).
  Headings use the `.font-display` class (`Poppins`), body text uses
  `Inter`. Maintain sufficient contrast (WCAG AA) between text and
  background colours.
- **Icons** – use `lucide-react` icons consistently. Icon sizes should
  align with text (e.g. 16–20 px) and have the same colour as the text.
- **Dark mode** – dark themes are supported via the `.dark` class. Use
  the same colour variables with appropriate dark values (defined in
  `src/index.css`).

Avoid adding new colours unless absolutely necessary – instead, derive new
shades from the existing palette with opacity or lightness changes.

---

## 🔗 API Integration & Security

The frontend communicates exclusively with the `hemis‑back‑main` backend
through REST endpoints. Follow these practices:

- **Base URL** – always reference the backend using
  `import.meta.env.VITE_API_URL`. Never hard‑code `http://localhost:8081`.
- **Axios instance** – use the preconfigured `apiClient` in
  `src/api/client.ts`. It automatically adds the `Authorization` header
  with the access token and the `Accept-Language` header based on
  `localStorage.locale`.
- **Token management** – access and refresh tokens are stored in
  `localStorage`. The client interceptors handle automatic refresh via
  `/app/rest/v2/oauth/token`. On refresh failure, clear tokens and
  dispatch an `auth:logout` event; do not store tokens in cookies or
  sessionStorage.
- **Permissions & roles** – the backend returns permissions from
  `/api/v1/web/auth/me`. Use these to show/hide components via the
  `ProtectedRoute` component rather than trusting JWT claims. Do not
  expose admin features to unauthorised users.
- **Error handling** – the Axios response interceptor logs errors to
  Sentry (if configured) and shows user‑friendly toast notifications. Use
  the `toast` API from `sonner` for notifications; never expose raw
  backend error messages.
- **Connection timeouts & retries** – respect the 30 s timeout set on
  `apiClient`. For idempotent requests (GET) consider adding retries
  using `tanstack/query` features (e.g. `retry: 2`).
- **Internationalisation** – when fetching translations, use the
  `/api/v1/web/i18n/messages?lang=<locale>` endpoint from the backend.
  Provide translation keys instead of hard‑coded strings in the UI.

When adding new endpoints, consult the backend documentation and ensure
that paths, query parameters and request/response bodies match exactly. Use
TypeScript interfaces to model the data and catch mismatches at compile
time.

---

## 📦 Architecture & State Management

The project follows a modular structure (see `README.md`). When adding new
features, respect the existing conventions:

- **Pages vs components** – pages in `src/pages/` should only compose
  components and orchestrate data loading. Reusable UI elements go in
  `src/components/`, grouped by type (`ui/`, `forms/`, `tables/`, etc.).
- **Global state** – use **Zustand** for application state (e.g. user,
  theme) and **TanStack Query** for server state. Avoid putting API
  responses in Zustand; rely on queries with proper `queryKey`s.
- **Custom hooks** – common logic (e.g. form setups, table configs,
  translation helpers) belongs in `src/hooks/`. Keep hooks small and
  composable.
- **Routing** – configure new routes in `src/router.tsx` (if using
  React Router) and update the side menu configuration. Use lazy
  loading (`React.lazy`) for large pages.
- **Forms** – always use **React Hook Form** with **Zod** for schema
  validation. Provide helpful error messages and inline feedback.
- **Tables** – for large datasets, use **TanStack Table** with pagination,
  sorting and filtering. For infinite scrolling, leverage `useInfiniteQuery`.

Follow the principle of **container vs presentational components** – logic
and data fetching belong in containers, while presentational components
receive props and remain stateless.

---

## 🧪 Testing

High quality software requires tests. We use **Vitest** together with
**React Testing Library** for unit tests and integration tests. When
writing tests:

- Place test files next to the code under test using the `.test.tsx` or
  `.spec.ts` suffix. Example: `Button.test.tsx` for the Button
  component.
- Use `render` from `@testing-library/react` to mount components and
  interact with them through user events. Avoid shallow rendering.
- Mock API calls with `msw` (Mock Service Worker) or using
  `jest.fn()`/`vi.fn()`; do not hit the real backend in unit tests.
- Assert accessibility (ARIA roles, labels) and translation keys. Use
  `axe-core` to detect accessibility issues.
- For end‑to‑end tests (optional), use **Cypress**. Place them in
  `cypress/e2e/` and set up the base URL via the `.env` file.

Test execution is controlled by the `TESTS_ENABLED` environment
variable in the backend. When `TESTS_ENABLED=true`, run front‑end
tests locally with:

```bash
yarn test        # run all tests
yarn test:watch  # watch mode
yarn test:coverage  # generate coverage report
```

CI pipelines should enforce code coverage thresholds and run tests on
pull requests.

---

## 🔐 Security & Best Practices

1. **Never hard‑code secrets** – API keys, tokens and passwords must
   never be stored in the repository. Use environment variables with
   the `VITE_` prefix for public values and `.env` (excluded from git) for
   private values.
2. **Sanitise user input** – always validate and sanitise data on the
   backend; on the frontend, rely on schema validation (Zod) and escape
   user input in components like `<DangerousHtml>` if rendering raw HTML.
3. **Role‑based UI** – show/hide navigation items, buttons and pages based
   on the current user’s permissions (see `authStore`). Do not rely
   solely on client‑side checks; the backend must also enforce
   authorisation.
4. **CSRF & XSS** – since the API uses JWT in headers, CSRF is less of a
   concern; however, ensure `<iframe>` and `<script>` tags are never
   rendered from untrusted sources. Escape user‐generated content.
5. **Secure storage** – store tokens in `localStorage` with clear names
   (`accessToken`, `refreshToken`). Clear them on logout. Avoid
   storing tokens in cookies.
6. **Sentry** – error tracking is integrated in `src/lib/sentry.ts`. Do
   not log sensitive information (e.g. passwords). Use `captureError`
   for unexpected exceptions.

---

## 🌐 Internationalization (i18n) - MUHIM!

Loyihada **ko'p tilli qo'llab-quvvatlash** mavjud. **Hech qachon hardcoded matn yozmang!**

### Loyiha Implementatsiyasi

| Xususiyat       | Qiymat                                                |
| --------------- | ----------------------------------------------------- |
| Kalit formati   | **Inglizcha matn** (`"Dashboard"`, `"Save changes"`)  |
| Interpolyatsiya | `{{variable}}` (i18next standart)                     |
| Namespace       | **Yo'q** - tekis struktura                            |
| Yuklash         | **Statik import** (build vaqtida bundlega qo'shiladi) |
| Tillar          | `uz`, `oz`, `ru`, `en` (4 ta)                         |
| Fallback        | `en` (inglizcha)                                      |
| Jami kalitlar   | ~479 ta                                               |
| Saqlash         | `localStorage` (BCP-47 formatda)                      |

**Til kodlari mapping (Frontend ↔ Backend):**

```
Frontend (short)  →  Backend (BCP-47)
uz                →  uz-UZ (O'zbekcha lotin)
oz                →  oz-UZ (Ўзбекча kirill)
ru                →  ru-RU (Ruscha)
en                →  en-US (Inglizcha - fallback)
```

**i18next konfiguratsiyasi (`src/i18n/config.ts`):**

```typescript
keySeparator: false,    // "foo.bar" = literal kalit, hierarxiya emas
nsSeparator: false,     // Namespace ishlatilmaydi
fallbackLng: 'en',      // Tarjima topilmasa inglizcha ko'rsatiladi
```

### Tarjima Tizimi Arxitekturasi

```
Backend Database (PostgreSQL)
       ↓
Backend API: /api/v1/web/i18n/messages?lang=uz-UZ
       ↓
yarn sync:translations (scripts/sync-translations.cjs)
       ↓
src/i18n/translations/*.json (uz.json, ru.json, en.json, oz.json)
       ↓
i18next (src/i18n/config.ts)
       ↓
useTranslation() hook → t('key')
```

### Kalit-Qiymat Strukturasi

Tarjima kalitlari **inglizcha matn** sifatida yoziladi:

```json
// en.json - kalit va qiymat bir xil
{
  "Delete": "Delete",
  "Save changes": "Save changes",
  "{{field}} is required": "{{field}} is required"
}

// uz.json - kalit inglizcha, qiymat o'zbekcha
{
  "Delete": "O'chirish",
  "Save changes": "O'zgarishlarni saqlash",
  "{{field}} is required": "{{field}} maydoni to'ldirilishi shart"
}
```

### Yangi Tarjima Qo'shish Qoidalari

> ⚠️ **MUHIM:** Yangi tarjima qo'shishdan OLDIN dublikatni tekshiring!

**0. DUBLIKATNI TEKSHIRISH (MAJBURIY!)**

```bash
# Frontendda JSON fayllardan qidirish
grep -i "search" src/i18n/translations/en.json

# Yoki barcha tillarda
grep -ri "search" src/i18n/translations/

# Natija:
# "Search": "Search"           ← Mavjud! Ishlatish mumkin
# "Search by name": ...        ← Mavjud! Ishlatish mumkin
# "Advanced search": ... yo'q  ← Yangi kerak → Backend migration
```

| Natija           | Harakat                              |
| ---------------- | ------------------------------------ |
| Kalit **mavjud** | `t('Existing key')` ishlatish        |
| Kalit **yo'q**   | Backend migration yaratish (1-qadam) |

**1. Backend Migration orqali qo'shish (ASOSIY YO'L)**

Yangi tarjima kerak bo'lganda, **AVVAL** dublikatni tekshiring, so'ng backend migration faylida qo'shiladi.

**Backend jadval strukturasi:**

- `system_messages` - master jadval (message_key, category, default message)
- `system_message_translations` - tarjimalar (message_id, language, translation)

**Fayl:** `hemis-back/domain/.../changesets/seed/S0XX_seed_i18n_<feature>.sql`

```sql
-- Helper funksiya ishlatiladi:
-- _seed_msg(category, 'English Key', 'O''zbekcha', 'Ўзбекча', 'Русский')

DO $$ BEGIN
PERFORM _seed_msg('action', 'Save changes', 'O''zgarishlarni saqlash', 'Ўзгаришларни сақлаш', 'Сохранить изменения');
PERFORM _seed_msg('label', 'Student name', 'Talaba ismi', 'Талаба исми', 'Имя студента');
END $$;
```

**Category qiymatlari (backend):**

| Category     | Ishlatilishi     | Misollar                        |
| ------------ | ---------------- | ------------------------------- |
| `action`     | Tugma/harakat    | Save, Cancel, Delete, Edit, Add |
| `label`      | Form/UI label    | Name, Email, Date, Code         |
| `message`    | Xabarlar         | No data found, Loading...       |
| `validation` | Validatsiya      | Required, Too short, Invalid    |
| `status`     | Status           | Active, Inactive, Pending       |
| `menu`       | Navigatsiya      | Dashboard, Settings, Reports    |
| `table`      | Jadval ustunlari | Actions, Created at             |
| `pagination` | Sahifalash       | Rows per page, Showing          |
| `confirm`    | Tasdiqlash       | Are you sure?, Confirm delete   |
| `auth`       | Autentifikatsiya | Sign in, Sign out, Password     |

**2. Frontend Sinxronizatsiya**

```bash
cd hemis-front

# Tarjimalarni backenddan yuklab olish
yarn sync:translations

# Natija:
# === Translation Sync ===
# API: http://localhost:8081
# Fetching uz...
#   [OK] uz.json updated (479 keys)
# Fetching oz, ru, en...
```

**Sync script xususiyatlari** (`scripts/sync-translations.cjs`):

- Backend API: `GET /api/v1/web/i18n/messages?lang={bcp47}`
- Fayllar: `src/i18n/translations/{uz,oz,ru,en}.json`
- Bo'sh javob → mavjud fayl saqlanadi (xavfsiz)
- API xatosi → build davom etadi
- `SKIP_TRANSLATION_SYNC=true` → sync o'tkazib yuboriladi

**Production build:**

```bash
yarn build:prod   # sync:translations + tsc + vite build
```

### Frontendda Ishlatish

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      {/* ✅ TO'G'RI - tarjima kaliti */}
      <h1>{t('Dashboard')}</h1>
      <button>{t('Save changes')}</button>
      <p>{t('{{count}} items found', { count: 42 })}</p>

      {/* ❌ NOTO'G'RI - hardcoded matn */}
      <h1>Boshqaruv paneli</h1>
      <button>Saqlash</button>
    </div>
  )
}
```

### Tarjima Qoidalari

| Qoida                 | Tavsif                                                           |
| --------------------- | ---------------------------------------------------------------- |
| **Kalit = Inglizcha** | Kalit har doim inglizcha matn bo'lishi kerak                     |
| **Interpolyatsiya**   | O'zgaruvchilar `{{variable}}` formatida                          |
| **Plural**            | `{{count}}` ishlatilsa, i18next avtomatik plural qo'llaydi       |
| **Kontekst**          | Agar bir xil kalit turli kontekstda bo'lsa, yangi kalit yarating |
| **Uzunlik**           | Kalitlar 100 belgidan oshmasligi kerak                           |

### Interpolyatsiya Qoidalari (i18next Best Practice)

> ⚠️ **MUHIM:** Interpolyatsiyani **faqat runtime qiymatlar** uchun ishlating!

**✅ Qachon ishlatish MUMKIN:**

```tsx
// Foydalanuvchi ma'lumoti
t('Welcome, {{name}}', { name: user.firstName })

// Son/sana
t('{{count}} students found', { count: 42 })
t('Created at {{date}}', { date: formatDate(createdAt) })

// ID/kod
t('Student ID: {{id}}', { id: student.code })
```

**❌ Qachon ishlatish MUMKIN EMAS:**

```tsx
// NOTO'G'RI - statik qiymat interpolyatsiya qilingan
t('Pay with {{method}}', { method: 'credit card' })

// TO'G'RI - har bir holat uchun alohida kalit
t('Pay with credit card')
t('Pay with PayPal')
```

**Sababi:** Boshqa tillarda grammatika farq qiladi (rod, kelishik).

### Sahifa Uchun Tarjima Checklist

Har bir yangi sahifa yoki komponent yaratganda:

1. **Barcha UI matnlarini aniqlang:**
   - Sarlavhalar (h1, h2, h3...)
   - Tugma matnlari (Submit, Cancel, Save...)
   - Form label va placeholder'lar
   - Xato xabarlari
   - Toast/notification matnlari
   - Empty state matnlari
   - Loading matnlari

2. **Tarjima kalitlarini ro'yxatlang:**

   ```
   // Kerakli tarjimalar:
   - "Student List" (sahifa sarlavhasi)
   - "Add student" (tugma)
   - "Search by name..." (placeholder)
   - "No students found" (empty state)
   - "Loading..." (loading state)
   - "Student added successfully" (toast)
   ```

3. **Backend migration tayyorlang** (yoki mavjud ekanligini tekshiring)

4. **Frontendda t() ishlatib kod yozing**

### Mavjud Tarjimalarni Tekshirish

Kod yozishdan oldin mavjud tarjimalarni tekshiring:

```bash
# JSON faylda qidirish
grep -i "search" src/i18n/translations/en.json

# Yoki Admin paneldan: /system/translations
```

### ❌ QILMANG

- **Hardcoded matn yozmang** – hatto development uchun ham `t('...')` ishlating
- **O'zbekcha/ruscha kalit ishlatmang** – kalit faqat inglizcha bo'lsin
- **Juda uzun kalit yozmang** – `"This is a very long error message..."` o'rniga qisqartiring
- **HTML teglarni kalit ichida ishlatmang** – `"<b>Bold</b> text"` noto'g'ri
- **Tarjima qilmasdan deploy qilmang** – sync qilishni unutmang

### ✅ QILING

- **t() funksiyasini har doim ishlating** – barcha UI matnlari uchun
- **Inglizcha kalit yozing** – bu fallback sifatida ko'rinadi
- **Interpolyatsiya ishlating** – dinamik qiymatlar uchun `{{variable}}`
- **Kontekst bering** – agar kalit noaniq bo'lsa, batafsilroq yozing
- **Backend migration tayyorlang** – yangi tarjima uchun

---

## 📐 Frontend Arxitektura Qoidalari

### Fayl Strukturasi Standarti

```
src/
├── api/              # API service fayllar ({domain}.api.ts)
├── components/       # Qayta ishlatiluvchi UI komponentlar
│   ├── ui/           # shadcn/ui bazaviy komponentlar
│   ├── forms/        # Umumiy form komponentlar
│   └── tables/       # Umumiy table komponentlar
├── hooks/            # Custom React hooklari (use{Feature}.ts)
├── i18n/             # i18n konfiguratsiya va tarjima fayllar
│   └── translations/ # JSON tarjima fayllar (uz, oz, ru, en)
├── lib/              # Utilita funksiyalar va konstantalar
│   └── queryKeys.ts  # TanStack Query kalitlari
├── pages/            # Sahifa komponentlar (thin composition layers)
│   └── {domain}/
│       └── {feature}/
│           ├── {Feature}Page.tsx
│           ├── {Feature}FormDialog.tsx
│           └── {Feature}DetailDrawer.tsx
├── stores/           # Zustand store'lar (faqat global UI state)
├── types/            # TypeScript tip ta'riflari
└── App.tsx           # Routing konfiguratsiyasi
```

### State Management Chegaralari

| State turi          | Texnologiya     | Misol                           |
| ------------------- | --------------- | ------------------------------- |
| **Global UI state** | Zustand         | auth, theme, sidebar open/close |
| **Server state**    | TanStack Query  | API javoblari, cache            |
| **URL state**       | useSearchParams | pagination, search, filter      |
| **Local state**     | useState        | dialog open/close, form state   |

**MUHIM:** API javoblarni Zustand store'da SAQLAMANG. TanStack Query avtomatik cache, refetch va invalidation bilan ishlaydi.

### Hook Qoidalari

| Hook              | Ishlatilishi             | Misol                                   |
| ----------------- | ------------------------ | --------------------------------------- |
| `useQuery`        | Read operatsiyalar       | `queryKey` majburiy, `enabled` parametr |
| `useMutation`     | Write operatsiyalar      | `onSuccess` da `invalidateQueries`      |
| `useSearchParams` | URL state                | pagination, filter parametrlari         |
| `useTranslation`  | Komponent ichida tarjima | `const { t } = useTranslation()`        |

**Toast ichida `i18n.t()`:** Hook ichida (useQuery/useMutation) toast xabarlari uchun `i18n.t()` ishlatiladi — `useTranslation` emas, chunki hook qayta render qilmaydi.

```typescript
// Hook ichida (to'g'ri)
import i18n from '@/i18n/config'
onSuccess: () => {
  toast.success(i18n.t('Successfully created'))
}

// Komponent ichida (to'g'ri)
const { t } = useTranslation()
<button>{t('Save')}</button>
```

### Komponent Qoidalari

| Qoida         | Tavsif                                                        |
| ------------- | ------------------------------------------------------------- |
| **shadcn/ui** | Bazaviy komponentlar `@/components/ui/*` dan import           |
| **Icon**      | `lucide-react` kutubxonasi (boshqa icon kutubxona ishlatmang) |
| **Form**      | React Hook Form + Zod (boshqa form kutubxona ishlatmang)      |
| **Table**     | TanStack Table (boshqa table kutubxona ishlatmang)            |
| **Toast**     | `sonner` kutubxonasi                                          |
| **Drawer**    | `Sheet` component (shadcn/ui)                                 |
| **Dialog**    | `Dialog` component (shadcn/ui)                                |

---

## 🧪 Frontend Test Qoidalari

### Texnologiya

| Vosita                          | Maqsad                                   |
| ------------------------------- | ---------------------------------------- |
| **Vitest**                      | Test runner va assertion                 |
| **React Testing Library**       | Komponent test                           |
| **msw** (Mock Service Worker)   | API mock                                 |
| **@testing-library/user-event** | Foydalanuvchi interaksiya simulyatsiyasi |

### Coverage Target

- Minimal: **80%** (line coverage)
- Har bir yangi page va hook uchun test **majburiy**

### Test Fayl Joylashuvi

Test fayllar komponent yonida joylashadi:

```
src/pages/institutions/universities/
├── UniversitiesPage.tsx
├── UniversityFormDialog.tsx
├── UniversityDetailDrawer.tsx
└── __tests__/
    ├── UniversitiesPage.test.tsx
    ├── UniversityFormDialog.test.tsx
    └── UniversityDetailDrawer.test.tsx
```

### Test Turlari

| Tur                  | Tavsif                            | Misol                                   |
| -------------------- | --------------------------------- | --------------------------------------- |
| **Component test**   | Komponent renderini tekshirish    | Sahifa elements ko'rinishini tekshirish |
| **Hook test**        | Custom hook logikasini tekshirish | useQuery qaytgan ma'lumotni tekshirish  |
| **API mock**         | Backend so'rovlarini mock qilish  | msw bilan GET/POST mock                 |
| **Interaction test** | Foydalanuvchi harakatlarini test  | Tugma bosish, form to'ldirish           |

### Test Template

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('{Feature}Page', () => {
  it('should render page title', async () => {
    renderWithProviders(<{Feature}Page />)
    expect(screen.getByText('{Feature} Management')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    renderWithProviders(<{Feature}Page />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should open form dialog on add button click', async () => {
    renderWithProviders(<{Feature}Page />)
    await userEvent.click(screen.getByText('Add'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
```

### Buyruqlar

```bash
yarn test              # Barcha testlarni ishga tushirish
yarn test:watch        # Watch mode
yarn test:coverage     # Coverage hisobot
```

---

## ✅ Do

- Use the **defined colour palette**; at most two accent colours per page.
- Provide **Uzbek labels** for buttons and form fields. English or
  Russian may be used only if translations are provided via the
  translation API.
- Write **functional components** and prefer hooks over class
  components. Use `useMemo` and `React.memo` to optimise heavy
  computations.
- Encapsulate **business logic** in hooks or services, not in
  components. Keep components presentational.
- Use **TanStack Query** for data fetching and caching. Invalidate
  queries after mutations.
- Write tests for new components, hooks and pages. Achieve at least
  **80 % coverage**.
- Keep third‑party dependencies up‑to‑date. Use `npm audit` or
  `yarn audit` to detect vulnerabilities.
- Document new endpoints, props and functions using JSDoc or in the
  `README.md` for the frontend.

## ❌ Do Not

- Do **not** hard‑code API URLs, roles or tokens.
- Do **not** bypass the `apiClient` when calling backend services.
- Do **not** use inline styles for large components; prefer Tailwind
  utility classes and the existing CSS variables.
- Do **not** include more than two accent colours per page or use
  gradients/glass effects. Avoid heavy shadows.
- Do **not** commit `.env` or `.env.local` files into version control.
- Do **not** manipulate the DOM directly – use React refs and state.
- Do **not** store large lists or API responses in Zustand; use
  TanStack Query instead.
- Do **not** write hardcoded UI text – always use `t('English key')`.
- Do **not** use Uzbek/Russian as translation keys – keys must be English.
- Do **not** add error messages in Zod schemas – backend provides them via i18n.
- Do **not** use `any` tipidan – TypeScript strict mode ishlaydi; `unknown` yoki aniq tip ishlating.
- Do **not** use `console.log` production kodda – development uchun faqat vaqtincha, commit qilmang.
- Do **not** use hardcoded rang qiymatlari – Tailwind utility class'lar ishlating (`text-gray-900`).
- Do **not** use `index.tsx` fayl nomi – aniq nom bering (`StudentsPage.tsx`, `UniversityFormDialog.tsx`).
- Do **not** use `useEffect` ichida API call – `useQuery` yoki `useMutation` ishlating.
- Do **not** use boshqa form kutubxona – faqat React Hook Form + Zod.
- Do **not** use boshqa table kutubxona – faqat TanStack Table.

---

## 📚 Further Reading

For in‑depth information on specific topics, refer to the following
documents (imported by Claude when necessary):

- `@SWAGGER_GUIDE.md` – guidelines for documenting REST APIs using
  Swagger/OpenAPI.
- `@TESTING_GUIDE.md` – detailed testing strategies and examples.
- `@LIQUIBASE_GUIDE.md` – migration best practices (backend).
- `@README.md` – the main project readme including installation and
  architecture details.
- `@FEATURE_GUIDE.md` – yangi funksiya qo'shish uchun backend va frontend pattern'lar.
- `@API_CONTRACT.md` – API response, error va pagination standartlari.

---

Happy coding! Maintain a clean, modern and accessible experience for
students, teachers and administrators.
