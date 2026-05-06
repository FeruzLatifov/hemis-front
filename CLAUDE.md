# Frontend Guidelines – HEMIS Ministry 2.0

HEMIS Ministry frontend — React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, shadcn/ui.
Spring Boot backend (hemis-back) bilan REST API orqali bog'lanadi.

---

## Quick Start

```bash
yarn install          # Dependency o'rnatish
yarn dev              # Dev server (port 3000)
yarn build            # Production build
yarn preview          # Built fayllarni ko'rish
yarn build:prod       # sync:translations + tsc + vite build
```

**Environment:** `.env.example` dan `.env` ga nusxa oling:

```env
VITE_API_URL=http://localhost:8081   # Backend base URL
VITE_APP_NAME=HEMIS Ministry
```

API URL va secretlarni hardcode qilmang. Faqat `VITE_` prefiksli variablelar browserda ko'rinadi. Barchasi `.env.example` da hujjatlangan.

---

## Design System

| Rang                | Hex                                                  | Ishlatilishi           |
| ------------------- | ---------------------------------------------------- | ---------------------- |
| **Primary (Blue)**  | `#2F80ED` / `#2666BE` (hover)                        | Asosiy elementlar      |
| **Success (Green)** | `#27AE60`                                            | Muvaffaqiyat holatlari |
| **Accent (Gold)**   | `#F2C94C`                                            | GPA, yutuqlar          |
| **Error**           | `#EB5757`                                            | Xatolar                |
| **Text**            | `#1E2124` (primary), `#6B7280` (secondary)           | Matn                   |
| **Border/BG**       | `#E5E7EB` (border), `#F5F6FA` (bg), `#FFFFFF` (card) | Layout                 |

**Qoidalar:**

- Gradient va glass effect **yo'q** — flat, zamonaviy dizayn
- Sahifada **max 2 ta** accent rang
- Tugmalarda **har doim matn** bo'lsin (icon + text)
- Jadval: `#E5E7EB` border, alternating rows (`#FFFFFF`/`#F9FAFB`)
- Card/modal: `border-radius: 6px`, subtle shadow
- Typography: `Inter` (body), `Poppins` (heading via `.font-display`)
- Icon: faqat `lucide-react`, 16-20px, matn rangida
- Dark mode: `.dark` class, `src/index.css` dagi variablelar

---

## API Integration

- **Base URL:** `import.meta.env.VITE_API_URL` — hardcode qilmang
- **Client:** `src/api/client.ts` dagi `apiClient` (Axios) — `Authorization` va `Accept-Language` headerlari avtomatik
- **Token:** `localStorage` da `accessToken`/`refreshToken`. Interceptor avtomatik refresh qiladi. Refresh muvaffaqiyatsiz bo'lsa `auth:logout` event dispatch qilinadi
- **Permission:** `/api/v1/web/auth/me` dan olinadi → `useAuthStore.isAuthenticated` + `hasPermission()` (`services/auth.service.ts:146`) orqali UI nazorat
- **Error:** Axios interceptor → `sonner` toast. Backend xato xabarlarini foydalanuvchiga ko'rsatmang
- **Timeout:** 30s. GET so'rovlarda `retry: 2` (TanStack Query)

---

## Architecture

### Fayl Strukturasi

```
src/
├── api/              # API service fayllar ({domain}.api.ts)
├── components/       # Qayta ishlatiluvchi komponentlar
│   ├── ui/           # shadcn/ui bazaviy
│   ├── forms/        # Form komponentlar
│   └── tables/       # Table komponentlar
├── hooks/            # Custom hooklari (use{Feature}.ts)
├── i18n/             # Konfiguratsiya + translations/*.json
├── lib/              # Utilita, konstantalar, queryKeys.ts
├── pages/{domain}/{feature}/
│   ├── {Feature}Page.tsx
│   ├── {Feature}FormDialog.tsx
│   └── {Feature}DetailDrawer.tsx
├── stores/           # Zustand (faqat global UI state)
├── types/            # TypeScript tiplar
└── App.tsx           # Routing
```

### State Management

| State        | Texnologiya     | Misol                          |
| ------------ | --------------- | ------------------------------ |
| Global UI    | Zustand         | auth, menu, favorites          |
| Server state | TanStack Query  | API javoblari (cache, refetch) |
| URL state    | useSearchParams | pagination, filter             |
| Local        | useState        | dialog open/close              |

**API javoblarni Zustand da saqlamang** — TanStack Query cache/invalidation bilan ishlaydi.

### Komponent Stack

| Tur             | Kutubxona                       |
| --------------- | ------------------------------- |
| UI komponentlar | shadcn/ui (`@/components/ui/*`) |
| Icon            | `lucide-react`                  |
| Form            | React Hook Form + Zod           |
| Table           | TanStack Table                  |
| Toast           | `sonner`                        |
| Drawer / Dialog | shadcn/ui `Sheet` / `Dialog`    |

---

## Internationalization (i18n)

**Hech qachon hardcoded matn yozmang!** Barcha UI matnlari `t('English key')` orqali.

### Konfiguratsiya

| Xususiyat | Qiymat                                                             |
| --------- | ------------------------------------------------------------------ |
| Tillar    | `uz`, `oz`, `ru`, `en` (4 ta)                                      |
| Fallback  | `en` (inglizcha)                                                   |
| Kalitlar  | Inglizcha matn (~479 ta)                                           |
| Config    | `src/i18n/config.ts` (`keySeparator: false`, `nsSeparator: false`) |
| Saqlash   | `localStorage`                                                     |

**Til kodlari mapping:**

| Frontend | Backend (BCP-47)   |
| -------- | ------------------ |
| `uz`     | `uz-UZ` (lotin)    |
| `oz`     | `oz-UZ` (kirill)   |
| `ru`     | `ru-RU`            |
| `en`     | `en-US` (fallback) |

### Ishlatish

```tsx
const { t } = useTranslation()

// TO'G'RI
<h1>{t('Dashboard')}</h1>
<button>{t('Save changes')}</button>
<p>{t('{{count}} items found', { count: 42 })}</p>

// NOTO'G'RI - hardcoded
<h1>Boshqaruv paneli</h1>
```

**Hook ichida toast:** `i18n.t()` ishlating (`useTranslation` emas):

```typescript
import i18n from '@/i18n/config'
onSuccess: () => toast.success(i18n.t('Successfully created'))
```

### Interpolyatsiya

`{{variable}}` — **faqat runtime qiymatlar** uchun:

```tsx
// TO'G'RI — dinamik qiymat
t('Welcome, {{name}}', { name: user.firstName })
t('{{count}} students found', { count: 42 })

// NOTO'G'RI — statik qiymat
t('Pay with {{method}}', { method: 'credit card' })
// TO'G'RI alternativa:
t('Pay with credit card')
```

### Yangi Tarjima Qo'shish

1. **Dublikatni tekshiring:** `grep -i "search" src/i18n/translations/en.json`
2. Kalit mavjud → `t('Existing key')` ishlating
3. Kalit yo'q → **hemis-back** da Liquibase seed migration yarating (`_seed_msg` helper)
4. **Sync:** `yarn sync:translations` (backend API dan JSON yuklab oladi)

**Sync xususiyatlari:** bo'sh javob → mavjud fayl saqlanadi; API xatosi → build davom etadi; `SKIP_TRANSLATION_SYNC=true` → sync skip

### Tarjima Qoidalari

| Qoida                | Tavsif                                       |
| -------------------- | -------------------------------------------- |
| Kalit = Inglizcha    | Har doim inglizcha matn bo'lishi kerak       |
| Interpolyatsiya      | Faqat runtime qiymatlar uchun `{{variable}}` |
| Kalitlar < 100 belgi | Juda uzun kalit yozmang                      |
| HTML teg yo'q        | Kalit ichida `<b>Bold</b>` ishlatmang        |
| Deploy oldidan sync  | `yarn sync:translations` unutmang            |

---

## Testing

**Vitest** + **React Testing Library** + **msw** (Mock Service Worker)

- **Coverage target:** 80% (line coverage)
- Har bir yangi page va hook uchun test **majburiy**
- Test fayllar: komponent yonida `__tests__/` papkada (`.test.tsx`)

```bash
yarn test              # Barcha testlar
yarn test:watch        # Watch mode
yarn test:coverage     # Coverage hisobot
```

---

## Do / Do Not

**DO:**

- `t('English key')` — barcha UI matnlari uchun
- Functional component + hooks
- `useMemo`/`React.memo` — og'ir hisoblashlar uchun
- TanStack Query — data fetching, mutation dan keyin `invalidateQueries`
- TypeScript strict mode — `any` o'rniga aniq tip yoki `unknown`

**DO NOT:**

- Hardcoded API URL, token, rang, matn
- `apiClient` dan o'tkazib API call
- API javoblarni Zustand da saqlash
- `useEffect` ichida API call — `useQuery`/`useMutation` ishlating
- `console.log` production da
- `index.tsx` fayl nomi — aniq nom bering (`StudentsPage.tsx`)
- O'zbekcha/ruscha tarjima kaliti — faqat inglizcha
- Zod schema da xato xabari — backend i18n orqali keladi
- Boshqa form/table/icon kutubxona — faqat React Hook Form + Zod, TanStack Table, lucide-react
- Inline style — Tailwind utility class ishlating
- DOM manipulation — React refs va state ishlating
- `.env` / `.env.local` commit qilish

---

## Module-Level Memory (modul ichida ishlaganda avtomatik yuklanadi)

| Modul                      | Fokus                                                                             |
| -------------------------- | --------------------------------------------------------------------------------- |
| `src/api/CLAUDE.md`        | Axios `apiClient` patterns, query keys, error handling, FormData, AbortController |
| `src/components/CLAUDE.md` | shadcn/ui, Tailwind 4 `@theme`, lucide icons, a11y, RHF+Zod                       |
| `src/hooks/CLAUDE.md`      | TanStack Query patterns, custom hook conventions, eslint exhaustive-deps, cleanup |
| `src/stores/CLAUDE.md`     | Zustand 5, selector pattern, persist, server vs UI state                          |
| `src/pages/CLAUDE.md`      | Feature folder, lazy load, URL state, page tests                                  |

## Subagent'lar (`.claude/agents/`)

| Agent                    | Vazifa                                                                         |
| ------------------------ | ------------------------------------------------------------------------------ |
| `react-anti-patterns`    | useEffect API call, console.log, hardcoded URL, inline style, DOM manipulation |
| `i18n-checker`           | Hardcoded matnlar, missing keys, static interpolation                          |
| `accessibility-checker`  | WCAG 2.1 AA, jsx-a11y, label/button/img/heading                                |
| `query-pattern-reviewer` | TanStack Query 5 — query keys, invalidation, enabled, staleTime                |

## Slash Commands (`.claude/commands/`)

| Command                 | Maqsad                                           |
| ----------------------- | ------------------------------------------------ |
| `/audit-i18n`           | Hardcoded matn + missing key + sync status audit |
| `/check-a11y`           | ESLint jsx-a11y + manual WCAG check              |
| `/review-pr-front [PR]` | 4 agent parallel + lint + type-check + test      |

## Further Reading

- `@README.md` — loyiha haqida umumiy ma'lumot, o'rnatish, arxitektura
