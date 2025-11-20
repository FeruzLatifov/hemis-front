# Frontend Guidelines – HEMIS Ministry 2.0

Welcome!  This document is a **memory file** used by Claude Code when working
inside the HEMIS Ministry frontend.  It summarizes the most important
conventions and rules for developing new pages, components and tests.  The
goal is to ensure a **consistent user experience**, high code quality and
seamless integration with the Spring‐Boot backend (hemis‑back‑main).

---

## 🎓 Purpose & Scope

This frontend is a modern, TypeScript‑based React application built with
Vite, Tailwind CSS and the shadcn UI library.  It communicates with a
Spring Boot backend via REST APIs.  The guidelines below apply to all
developers contributing to the `frontend/` portion of the project and cover:

* **Design system** – colours, typography, spacing, components and
  accessibility rules.
* **API integration** – how to call backend endpoints securely and
  efficiently.
* **Architecture** – file structure, state management, custom hooks and
  organisation.
* **Testing and tooling** – how to write reliable unit and integration
  tests.
* **Security best practices** – token storage, role based access and
  user permissions.

Keep this file concise.  Detailed guides on Swagger, testing and Liquibase
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
   Do **not** hard‑code API endpoints or secrets in the code.  Only use
   variables starting with `VITE_` – they will be exposed to the browser.

---

## 🎨 Design System

This application targets the Ministry of Higher Education.  The design must
convey professionalism and trust while staying modern and accessible.  The
colour palette reflects themes from education:

| Theme      | Meaning                     | Hex codes                     |
|-----------|-----------------------------|-------------------------------|
| **Primary (Blue)**   | Knowledge, science, teachers | `#2F80ED` (main), `#2666BE` (hover) |
| **Secondary (Green)** | Growth, success, students     | `#27AE60` (success)              |
| **Tertiary (Purple)** | Creativity, courses, math     | Suggest `#9B51E0` or similar      |
| **Accent (Gold)**    | Achievement, awards, GPA      | `#F2C94C`                        |
| **Neutral**          | Text & borders                | `#1E2124` (primary text), `#6B7280` (secondary text), `#E5E7EB` (border), `#F5F6FA`/`#F4F5F7` (background), `#FFFFFF` (cards) |
| **Alert**            | Warning/Error                 | `#F2C94C` (warning), `#EB5757` (error) |

Key rules:

* **No gradients or glass effects** – keep the UI flat and modern.  Use
  subtle shadows only (e.g. `0 1px 2px rgba(15, 23, 42, 0.04)` on cards).
* **At most two accent colours per page** – primary + one secondary.  Too
  many colours distract the user.
* **Buttons always include text** – even if there is an icon, accompany it
  with clear Uzbek text such as “Qo‘shish” or “Saqlash”.
* **Tables should be light and airy** – table borders use `#E5E7EB`, and
  rows have alternating subtle backgrounds (`#FFFFFF`/`#F9FAFB`).  Avoid
  dark separators.
* **Cards and modals** use white (`#FFFFFF`) with a thin border and small
  radius (`6px`) and the shadow mentioned above.
* **Typography** – use `Inter` and `Poppins` fonts (already included).
  Headings use the `.font-display` class (`Poppins`), body text uses
  `Inter`.  Maintain sufficient contrast (WCAG AA) between text and
  background colours.
* **Icons** – use `lucide-react` icons consistently.  Icon sizes should
  align with text (e.g. 16–20 px) and have the same colour as the text.
* **Dark mode** – dark themes are supported via the `.dark` class.  Use
  the same colour variables with appropriate dark values (defined in
  `src/index.css`).

Avoid adding new colours unless absolutely necessary – instead, derive new
shades from the existing palette with opacity or lightness changes.

---

## 🔗 API Integration & Security

The frontend communicates exclusively with the `hemis‑back‑main` backend
through REST endpoints.  Follow these practices:

* **Base URL** – always reference the backend using
  `import.meta.env.VITE_API_URL`.  Never hard‑code `http://localhost:8081`.
* **Axios instance** – use the preconfigured `apiClient` in
  `src/api/client.ts`.  It automatically adds the `Authorization` header
  with the access token and the `Accept-Language` header based on
  `localStorage.locale`.
* **Token management** – access and refresh tokens are stored in
  `localStorage`.  The client interceptors handle automatic refresh via
  `/app/rest/v2/oauth/token`.  On refresh failure, clear tokens and
  dispatch an `auth:logout` event; do not store tokens in cookies or
  sessionStorage.
* **Permissions & roles** – the backend returns permissions from
  `/api/v1/web/auth/me`.  Use these to show/hide components via the
  `ProtectedRoute` component rather than trusting JWT claims.  Do not
  expose admin features to unauthorised users.
* **Error handling** – the Axios response interceptor logs errors to
  Sentry (if configured) and shows user‑friendly toast notifications.  Use
  the `toast` API from `sonner` for notifications; never expose raw
  backend error messages.
* **Connection timeouts & retries** – respect the 30 s timeout set on
  `apiClient`.  For idempotent requests (GET) consider adding retries
  using `tanstack/query` features (e.g. `retry: 2`).
* **Internationalisation** – when fetching translations, use the
  `/api/v1/web/i18n/messages?lang=<locale>` endpoint from the backend.
  Provide translation keys instead of hard‑coded strings in the UI.

When adding new endpoints, consult the backend documentation and ensure
that paths, query parameters and request/response bodies match exactly.  Use
TypeScript interfaces to model the data and catch mismatches at compile
time.

---

## 📦 Architecture & State Management

The project follows a modular structure (see `README.md`).  When adding new
features, respect the existing conventions:

* **Pages vs components** – pages in `src/pages/` should only compose
  components and orchestrate data loading.  Reusable UI elements go in
  `src/components/`, grouped by type (`ui/`, `forms/`, `tables/`, etc.).
* **Global state** – use **Zustand** for application state (e.g. user,
  theme) and **TanStack Query** for server state.  Avoid putting API
  responses in Zustand; rely on queries with proper `queryKey`s.
* **Custom hooks** – common logic (e.g. form setups, table configs,
  translation helpers) belongs in `src/hooks/`.  Keep hooks small and
  composable.
* **Routing** – configure new routes in `src/router.tsx` (if using
  React Router) and update the side menu configuration.  Use lazy
  loading (`React.lazy`) for large pages.
* **Forms** – always use **React Hook Form** with **Zod** for schema
  validation.  Provide helpful error messages and inline feedback.
* **Tables** – for large datasets, use **TanStack Table** with pagination,
  sorting and filtering.  For infinite scrolling, leverage `useInfiniteQuery`.

Follow the principle of **container vs presentational components** – logic
and data fetching belong in containers, while presentational components
receive props and remain stateless.

---

## 🧪 Testing

High quality software requires tests.  We use **Vitest** together with
**React Testing Library** for unit tests and integration tests.  When
writing tests:

* Place test files next to the code under test using the `.test.tsx` or
  `.spec.ts` suffix.  Example: `Button.test.tsx` for the Button
  component.
* Use `render` from `@testing-library/react` to mount components and
  interact with them through user events.  Avoid shallow rendering.
* Mock API calls with `msw` (Mock Service Worker) or using
  `jest.fn()`/`vi.fn()`; do not hit the real backend in unit tests.
* Assert accessibility (ARIA roles, labels) and translation keys.  Use
  `axe-core` to detect accessibility issues.
* For end‑to‑end tests (optional), use **Cypress**.  Place them in
  `cypress/e2e/` and set up the base URL via the `.env` file.

Test execution is controlled by the `TESTS_ENABLED` environment
variable in the backend.  When `TESTS_ENABLED=true`, run front‑end
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
   never be stored in the repository.  Use environment variables with
   the `VITE_` prefix for public values and `.env` (excluded from git) for
   private values.
2. **Sanitise user input** – always validate and sanitise data on the
   backend; on the frontend, rely on schema validation (Zod) and escape
   user input in components like `<DangerousHtml>` if rendering raw HTML.
3. **Role‑based UI** – show/hide navigation items, buttons and pages based
   on the current user’s permissions (see `authStore`).  Do not rely
   solely on client‑side checks; the backend must also enforce
   authorisation.
4. **CSRF & XSS** – since the API uses JWT in headers, CSRF is less of a
   concern; however, ensure `<iframe>` and `<script>` tags are never
   rendered from untrusted sources.  Escape user‐generated content.
5. **Secure storage** – store tokens in `localStorage` with clear names
   (`accessToken`, `refreshToken`).  Clear them on logout.  Avoid
   storing tokens in cookies.
6. **Sentry** – error tracking is integrated in `src/lib/sentry.ts`.  Do
   not log sensitive information (e.g. passwords).  Use `captureError`
   for unexpected exceptions.

---

## ✅ Do

* Use the **defined colour palette**; at most two accent colours per page.
* Provide **Uzbek labels** for buttons and form fields.  English or
  Russian may be used only if translations are provided via the
  translation API.
* Write **functional components** and prefer hooks over class
  components.  Use `useMemo` and `React.memo` to optimise heavy
  computations.
* Encapsulate **business logic** in hooks or services, not in
  components.  Keep components presentational.
* Use **TanStack Query** for data fetching and caching.  Invalidate
  queries after mutations.
* Write tests for new components, hooks and pages.  Achieve at least
  **80 % coverage**.
* Keep third‑party dependencies up‑to‑date.  Use `npm audit` or
  `yarn audit` to detect vulnerabilities.
* Document new endpoints, props and functions using JSDoc or in the
  `README.md` for the frontend.

## ❌ Do Not

* Do **not** hard‑code API URLs, roles or tokens.
* Do **not** bypass the `apiClient` when calling backend services.
* Do **not** use inline styles for large components; prefer Tailwind
  utility classes and the existing CSS variables.
* Do **not** include more than two accent colours per page or use
  gradients/glass effects.  Avoid heavy shadows.
* Do **not** commit `.env` or `.env.local` files into version control.
* Do **not** manipulate the DOM directly – use React refs and state.
* Do **not** store large lists or API responses in Zustand; use
  TanStack Query instead.

---

## 📚 Further Reading

For in‑depth information on specific topics, refer to the following
documents (imported by Claude when necessary):

* `@SWAGGER_GUIDE.md` – guidelines for documenting REST APIs using
  Swagger/OpenAPI.
* `@TESTING_GUIDE.md` – detailed testing strategies and examples.
* `@LIQUIBASE_GUIDE.md` – migration best practices (backend).
* `@README.md` – the main project readme including installation and
  architecture details.

---

Happy coding!  Maintain a clean, modern and accessible experience for
students, teachers and administrators.