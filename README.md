# HEMIS 2.0 — Ministry Frontend

**O'zbekiston Respublikasi Oliy Ta'lim Vazirligi**
**Oliy Ta'lim Boshqaruv Axborot Tizimi**

[![React](https://img.shields.io/badge/React-19.2.3-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.18-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF.svg?logo=github-actions&logoColor=white)](.github/workflows/ci.yml)

---

## Mundarija

- [Texnologiyalar](#texnologiyalar)
- [Tezkor boshlash](#tezkor-boshlash)
- [Loyiha strukturasi](#loyiha-strukturasi)
- [Scriptlar](#scriptlar)
- [Environment variables](#environment-variables)
- [Arxitektura](#arxitektura)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Deployment](#deployment)

---

## Texnologiyalar

### Core

| Texnologiya       | Versiya | Maqsad                       |
| ----------------- | ------- | ---------------------------- |
| React             | 19.2.3  | UI framework                 |
| TypeScript        | 5.9.3   | Type safety (`strict: true`) |
| Vite              | 7.3.1   | Build tool                   |
| Tailwind CSS      | 4.1.18  | Utility-first styling        |
| shadcn/ui (Radix) | —       | Accessible UI components     |

### State & Data

| Kutubxona       | Versiya | Maqsad                           |
| --------------- | ------- | -------------------------------- |
| TanStack Query  | 5.90.17 | Server state, caching            |
| TanStack Table  | 8.21.3  | Data tables                      |
| Zustand         | 5.0.10  | Client state (auth, theme, menu) |
| React Hook Form | 7.71.1  | Form management                  |
| Zod             | 4.3.6   | Schema validation                |
| Axios           | 1.13.4  | HTTP client                      |
| React Router    | 7.13.0  | Routing (lazy-loaded)            |

### i18n & Monitoring

| Kutubxona    | Versiya | Maqsad                                |
| ------------ | ------- | ------------------------------------- |
| i18next      | 25.7.4  | Internationalization (uz, oz, ru, en) |
| Sentry       | 10.38.0 | Error tracking & performance          |
| Sonner       | 2.0.7   | Toast notifications                   |
| Lucide React | 0.469.0 | Icon library                          |

### Dev & Quality

| Tool                       | Maqsad                          |
| -------------------------- | ------------------------------- |
| Vitest + RTL + MSW         | Unit & integration testing      |
| ESLint + jsx-a11y          | Linting + accessibility         |
| Prettier + Tailwind plugin | Code formatting                 |
| Husky + lint-staged        | Pre-commit hooks                |
| Commitlint                 | Conventional commit enforcement |
| GitHub Actions             | CI pipeline                     |

---

## Tezkor boshlash

```bash
# 1. Dependencies o'rnatish
yarn install

# 2. Environment sozlash
cp .env.example .env
# .env ichida VITE_API_URL ni backend manziliga o'zgartiring

# 3. Dev server ishga tushirish
yarn dev
# http://localhost:3000
```

**Talablar:** Node.js `>=20.19.0` yoki `>=22.12.0`, Yarn (Corepack)

---

## Loyiha strukturasi

```
hemis-front/
├── .github/workflows/ci.yml      # GitHub Actions CI pipeline
├── .husky/                        # Git hooks (pre-commit, commit-msg)
├── public/                        # Static assets
├── src/
│   ├── api/                       # API modules (8 ta endpoint fayl)
│   │   ├── client.ts              #   Axios instance + interceptors
│   │   ├── auth.api.ts            #   Authentication
│   │   ├── dashboard.api.ts       #   Dashboard statistics
│   │   ├── universities.api.ts    #   University CRUD
│   │   ├── faculties.api.ts       #   Faculty CRUD
│   │   ├── favorites.api.ts       #   Favorites management
│   │   ├── menu.api.ts            #   Dynamic menu
│   │   └── translations.api.ts    #   i18n translations
│   ├── components/
│   │   ├── ui/                    #   shadcn/ui (16 ta komponent)
│   │   ├── layouts/               #   MainLayout, Sidebar, Header, Breadcrumb
│   │   ├── common/                #   LanguageSwitcher
│   │   ├── filters/               #   ColumnSettings, TagFilter, SearchScope
│   │   ├── CommandPalette.tsx     #   Cmd+K tezkor qidiruv
│   │   ├── ErrorBoundary.tsx      #   Global error boundary
│   │   └── ThemeProvider.tsx      #   Dark/light mode
│   ├── hooks/                     # Custom hooks (7 ta)
│   │   ├── useUniversities.ts     #   University CRUD hooks
│   │   ├── useFavorites.ts        #   Favorites hooks
│   │   ├── useMenu.ts             #   Menu data hooks
│   │   ├── useTheme.ts            #   Theme hooks
│   │   └── useClearCache.ts       #   Cache management
│   ├── pages/                     # Route pages (lazy-loaded)
│   │   ├── LoginPage.tsx
│   │   ├── dashboard/             #   Statistics, charts, rankings
│   │   ├── institutions/
│   │   │   ├── universities/      #   University management
│   │   │   └── faculties/         #   Faculty management
│   │   ├── students/              #   Student records
│   │   ├── teachers/              #   Teacher profiles
│   │   ├── reports/               #   Analytics & reports
│   │   └── system/
│   │       └── translations/      #   Translation management
│   ├── stores/                    # Zustand stores (3 ta)
│   │   ├── authStore.ts           #   Auth state + permissions
│   │   ├── menuStore.ts           #   Dynamic menu tree
│   │   └── favoritesStore.ts      #   Quick links
│   ├── lib/                       # Core utilities
│   │   ├── queryClient.ts         #   TanStack Query config
│   │   ├── queryKeys.ts           #   Centralized query keys
│   │   ├── sentry.ts              #   Sentry integration
│   │   └── utils.ts               #   cn(), helpers
│   ├── utils/                     # Utility functions
│   │   ├── iconMapper.ts          #   Backend icon -> Lucide mapping
│   │   ├── menu.util.ts           #   Menu label helpers
│   │   ├── url.util.ts            #   URL utilities
│   │   └── error.util.ts          #   Error formatting
│   ├── types/                     # TypeScript type definitions
│   ├── i18n/                      # i18next config + translations (uz, oz, ru, en)
│   ├── test/                      # Test setup + MSW mocks
│   ├── env.ts                     # Zod env validation
│   ├── App.tsx                    # Root component + routing
│   └── main.tsx                   # Entry point
├── .editorconfig                  # Editor formatting rules
├── .env.example                   # Environment template
├── .prettierrc                    # Prettier config (+ Tailwind plugin)
├── commitlint.config.js           # Conventional commits
├── eslint.config.js               # ESLint + TypeScript + jsx-a11y
├── nginx.conf                     # Nginx SPA config
├── nginx-security-headers.conf    # CSP, HSTS, Permissions-Policy
├── Dockerfile                     # Multi-stage build (Node + Nginx)
├── docker-compose.yml             # Docker Compose config
├── vite.config.ts                 # Vite + vendor chunk splitting
├── vitest.config.ts               # Vitest + coverage thresholds
└── tsconfig.json                  # TypeScript strict mode
```

**Statistika:** 66 `.tsx` + 87 `.ts` source fayl, 49 test fayl, 16 UI komponent, 4 til

---

## Scriptlar

| Buyruq                   | Tavsif                                 |
| ------------------------ | -------------------------------------- |
| `yarn dev`               | Development server (port 3000, HMR)    |
| `yarn build`             | TypeScript check + production build    |
| `yarn build:prod`        | Tarjimalarni sync + build              |
| `yarn preview`           | Production buildni preview qilish      |
| `yarn type-check`        | TypeScript tekshiruvi (`tsc --noEmit`) |
| `yarn lint`              | ESLint tekshiruvi (TypeScript + a11y)  |
| `yarn lint:fix`          | ESLint auto-fix                        |
| `yarn format`            | Prettier bilan formatlash              |
| `yarn test`              | Testlarni watch modda ishga tushirish  |
| `yarn test:ui`           | Vitest UI (brauzerda)                  |
| `yarn test:coverage`     | Coverage hisoboti                      |
| `yarn sync:translations` | Backend tarjimalarni sync qilish       |

---

## Environment variables

`.env.example` dan nusxa oling:

```bash
cp .env.example .env
```

### Majburiy

| O'zgaruvchi    | Tavsif              | Misol                   |
| -------------- | ------------------- | ----------------------- |
| `VITE_API_URL` | Backend API manzili | `http://localhost:8081` |

### Ixtiyoriy (default qiymatlari bor)

| O'zgaruvchi                      | Default          | Tavsif                                   |
| -------------------------------- | ---------------- | ---------------------------------------- |
| `VITE_APP_NAME`                  | `HEMIS Ministry` | Ilova nomi                               |
| `VITE_APP_VERSION`               | `1.0.0`          | Versiya                                  |
| `VITE_SENTRY_ENABLED`            | `false`          | Sentry monitoring                        |
| `VITE_SENTRY_DSN`                | —                | Sentry DSN                               |
| `VITE_SENTRY_ENVIRONMENT`        | —                | `development` / `staging` / `production` |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0.2`            | Performance sampling (0.0–1.0)           |

Environment validatsiyasi `src/env.ts` da Zod schema orqali amalga oshiriladi. Noto'g'ri qiymat berilsa, ilova aniq xato xabari bilan ishga tushmaydi.

---

## Arxitektura

### Component hierarchy

```
App
├── QueryClientProvider          (TanStack Query)
├── ThemeProvider                (dark/light mode)
└── BrowserRouter
    ├── LoginPage                (public)
    └── ProtectedRoute
        └── MainLayout
            ├── Sidebar          (backend-driven menu, favorites)
            ├── Header           (user menu, language, theme, search)
            ├── Breadcrumb       (auto-generated from menu tree)
            └── <Suspense>       (lazy-loaded pages)
                ├── DashboardPage
                ├── UniversitiesPage
                ├── FacultiesPage
                ├── StudentsPage
                ├── TeachersPage
                ├── ReportsPage
                └── TranslationsPage
```

### Data flow

```
User Action → Component → Custom Hook → TanStack Query → API Client (Axios) → Backend
                                              ↓
                                         Response → Cache → Re-render
```

### State management

| State turi   | Tool                  | Misol                         |
| ------------ | --------------------- | ----------------------------- |
| Server state | TanStack Query        | API data, cache (5 min stale) |
| Client state | Zustand               | Auth, theme, menu, favorites  |
| Form state   | React Hook Form + Zod | Form inputs, validation       |
| URL state    | React Router          | Query params, routing         |

### Build optimization

Vite `manualChunks` orqali vendor splitting:

| Chunk             | Tarkibi                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| `vendor-react`    | react, react-dom, react-router-dom                                             |
| `vendor-radix`    | Barcha @radix-ui/\* paketlar                                                   |
| `vendor-tanstack` | react-query, react-table                                                       |
| `vendor-i18n`     | i18next, react-i18next                                                         |
| `vendor-sentry`   | @sentry/react                                                                  |
| `vendor-utils`    | axios, zod, zustand, date-fns, lucide-react, sonner, clsx, tailwind-merge, cva |

---

## Testing

### Infratuzilma

- **Vitest** — test runner (jsdom environment)
- **React Testing Library** — component testing
- **MSW** — API mocking (service worker)
- **49 test fayl** — components, hooks, stores, API, utils

### Coverage thresholds (CI da majburiy)

| Metrika    | Minimal |
| ---------- | ------- |
| Lines      | 80%     |
| Functions  | 80%     |
| Branches   | 75%     |
| Statements | 80%     |

### Buyruqlar

```bash
yarn test              # Watch mode
yarn test:ui           # Brauzerda Vitest UI
yarn test:coverage     # Coverage hisoboti (threshold bilan)
```

---

## Code Quality

### CI Pipeline (GitHub Actions)

`main` va `develop` branchlariga push/PR da avtomatik ishga tushadi:

```
Checkout → Node 22 Setup → Yarn Install (cached)
    → TypeScript type-check
    → ESLint lint
    → Vitest coverage (80% threshold)
    → Vite build
    → Upload coverage artifact
```

### Pre-commit hooks (Husky)

| Hook         | Vazifa                                     |
| ------------ | ------------------------------------------ |
| `pre-commit` | lint-staged: ESLint fix + Prettier format  |
| `commit-msg` | Commitlint: conventional commit tekshiruvi |

### Commit message formati

[Conventional Commits](https://www.conventionalcommits.org/) standartida:

```
feat: yangi xususiyat qo'shish
fix: xatoni tuzatish
docs: hujjatni yangilash
style: formatlash o'zgarishi
refactor: kodni qayta tuzish
perf: ishlash tezligini oshirish
test: test qo'shish/tuzatish
build: build tizimini o'zgartirish
ci: CI konfiguratsiyasini o'zgartirish
chore: boshqa o'zgarishlar
```

### Accessibility

- `eslint-plugin-jsx-a11y` — build vaqtida a11y tekshiruvi
- Radix UI — barcha komponentlar `aria-*` bilan
- Keyboard navigation — Sidebar (Escape), Command Palette (Cmd+K)
- Semantic HTML — `<nav>`, `<aside>`, `<main>`, `aria-label`, `aria-current`

---

## Deployment

### Docker (tavsiya)

```bash
# Build
docker build \
  --build-arg VITE_API_URL=https://api.hemis.uz \
  --build-arg VITE_SENTRY_ENABLED=true \
  --build-arg VITE_SENTRY_DSN=https://xxx@sentry.io/123 \
  -t hemis-front .

# Run
docker run -p 80:80 hemis-front
```

### Docker Compose

```bash
# .env faylda VITE_API_URL sozlab:
docker compose up -d

# Health check
curl http://localhost/health
# {"status":"ok"}
```

### Nginx security headers

Production da quyidagi headerlar avtomatik qo'shiladi (`nginx-security-headers.conf`):

| Header                      | Qiymat                                                 |
| --------------------------- | ------------------------------------------------------ |
| `Content-Security-Policy`   | `default-src 'self'; script-src 'self'; ...`           |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`         |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), payment=()` |
| `X-Frame-Options`           | `SAMEORIGIN`                                           |
| `X-Content-Type-Options`    | `nosniff`                                              |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                      |

### Manual deploy

```bash
yarn build              # dist/ papkasi yaratiladi
# dist/ ni web serverga joylashtiring
# Nginx SPA fallback: try_files $uri $uri/ /index.html;
```

---

## API Documentation

Backend Swagger UI: `http://localhost:8081/api/swagger-ui.html`

---

## Litsenziya

Copyright 2024–2025 O'zbekiston Respublikasi Oliy Ta'lim Vazirligi.
Ichki foydalanish uchun.
