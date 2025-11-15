# 🎓 HEMIS Ministry Frontend - Modern React TypeScript Application

**O'zbekiston Respublikasi Oliy Ta'lim Vazirligi - HEMIS 2.0**

Zamonaviy, professional, foydalanuvchi-do'st frontend loyiha.

---

## 🚀 **Texnologiyalar**

### **Core:**
- ⚛️ **React 19** - UI library
- 📘 **TypeScript 5.9** - Type safety
- ⚡ **Vite 7** - Build tool
- 🎨 **Tailwind CSS 3** - Styling
- 🧩 **Shadcn/ui** - Component library

### **State Management:**
- 🐻 **Zustand** - Global state
- 🔄 **TanStack Query** - Server state & caching
- 📋 **TanStack Table** - Advanced tables
- 📝 **React Hook Form** - Forms
- ✅ **Zod** - Schema validation

### **UI/UX:**
- 🎯 **Lucide React** - Icons
- 📊 **Recharts** - Charts & graphs
- 🔔 **Sonner** - Toast notifications
- 🎭 **Radix UI** - Accessible primitives
- 🌙 **Dark Mode** - Theme support

### **Utils:**
- 📅 **date-fns** - Date utilities
- 🔗 **Axios** - HTTP client
- 🧮 **React CountUp** - Number animations
- 🎨 **clsx** + **tailwind-merge** - Class utilities

---

## 📁 **Loyiha Strukturasi**

```
frontend/
├── public/                  # Static files
├── src/
│   ├── assets/             # Images, fonts, etc
│   ├── components/         # Reusable components
│   │   ├── ui/            # Basic UI components
│   │   ├── layouts/       # Layout components
│   │   ├── forms/         # Form components
│   │   └── tables/        # Table components
│   ├── pages/             # Page components
│   │   ├── auth/          # Login, Register
│   │   ├── dashboard/     # Dashboard
│   │   ├── students/      # Students management
│   │   ├── teachers/      # Teachers management
│   │   ├── universities/  # Universities
│   │   └── reports/       # Reports
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   ├── lib/               # Utility functions
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── .eslintrc.js           # ESLint config
├── .prettierrc            # Prettier config
├── tailwind.config.js     # Tailwind config
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
└── package.json           # Dependencies
```

---

## 🛠️ **O'rnatish**

### **1. Dependencies o'rnatish:**

```bash
cd frontend
yarn install
```

### **2. Development server:**

```bash
yarn dev
```

Server ishga tushadi: http://localhost:3000

### **3. Production build:**

```bash
yarn build
```

### **4. Preview production:**

```bash
yarn preview
```

---

## 🎨 **Dizayn Tizimi**

### **Ranglar:**

#### **Primary (Blue):**
- 50: `#eff6ff`
- 500: `#3b82f6` (Main)
- 900: `#1e3a8a`

#### **Secondary (Purple):**
- 50: `#faf5ff`
- 500: `#a855f7` (Accent)
- 900: `#581c87`

#### **Status:**
- Success: `#10b981`
- Warning: `#f59e0b`
- Error: `#ef4444`
- Info: `#06b6d4`

### **Typography:**
- **Font Family:** Inter
- **Font Sizes:** 12px - 48px
- **Font Weights:** 300 - 800

### **Spacing:**
- Scale: 4px - 80px (Tailwind standard)

### **Border Radius:**
- sm: 2px
- md: 6px
- lg: 8px
- xl: 12px

---

## 📦 **Komponentlar**

### **UI Components (Shadcn/ui):**
```tsx
// Button
import { Button } from '@/components/ui/button'
<Button variant="primary">Click me</Button>

// Input
import { Input } from '@/components/ui/input'
<Input placeholder="Enter text..." />

// Select
import { Select } from '@/components/ui/select'
<Select options={options} />

// Dialog
import { Dialog } from '@/components/ui/dialog'
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>...</DialogContent>
</Dialog>

// Table
import { DataTable } from '@/components/ui/data-table'
<DataTable columns={columns} data={data} />

// Toast
import { toast } from 'sonner'
toast.success('Success message!')
```

### **Layout Components:**
```tsx
import { MainLayout } from '@/components/layouts/MainLayout'
import { Header } from '@/components/layouts/Header'
import { Sidebar } from '@/components/layouts/Sidebar'
```

---

## 🗺️ **Routing**

### **Menu Struktura:**

```
/                          → Dashboard (Statistika)
├── /students             → Talabalar
│   ├── /students/new     → Yangi talaba
│   └── /students/:id     → Talaba detallari
├── /teachers             → O'qituvchilar
├── /universities         → Universitetlar
├── /reports              → Hisobotlar
│   ├── /reports/students → Talabalar hisoboti
│   └── /reports/teachers → O'qituvchilar hisoboti
└── /settings             → Sozlamalar
```

---

## 🔐 **Authentication**

### **Login:**
```tsx
const { login, logout, user } = useAuth()

// Login
await login({ username, password })

// Logout
logout()

// Check auth
if (user) {
  // Authenticated
}
```

### **Protected Routes:**
```tsx
<ProtectedRoute roles={['admin', 'ministry']}>
  <AdminPage />
</ProtectedRoute>
```

---

## 📡 **API Integration**

### **API Service:**
```tsx
import { api } from '@/services/api'

// GET request
const students = await api.get('/students')

// POST request
await api.post('/students', studentData)

// PUT request
await api.put(`/students/${id}`, updatedData)

// DELETE request
await api.delete(`/students/${id}`)
```

### **React Query:**
```tsx
import { useQuery, useMutation } from '@tanstack/react-query'

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['students'],
  queryFn: () => api.get('/students')
})

// Mutation
const mutation = useMutation({
  mutationFn: (newStudent) => api.post('/students', newStudent),
  onSuccess: () => {
    queryClient.invalidateQueries(['students'])
    toast.success('Student added!')
  }
})
```

---

## 🎯 **Forms**

### **React Hook Form + Zod:**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(2, 'Minimum 2 characters'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  
  const onSubmit = (data: FormData) => {
    console.log(data)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('firstName')} />
      {form.formState.errors.firstName && (
        <p>{form.formState.errors.firstName.message}</p>
      )}
    </form>
  )
}
```

---

## 📊 **Tables**

### **TanStack Table:**
```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

const columns = [
  { accessorKey: 'code', header: 'Kod' },
  { accessorKey: 'name', header: 'FIO' },
  { accessorKey: 'university', header: 'Universitet' },
]

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
```

---

## 🎨 **Dark Mode**

### **Theme Toggle:**
```tsx
import { useTheme } from '@/hooks/useTheme'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}
```

---

## 🧪 **Testing**

```bash
# Run tests
yarn test

# Coverage
yarn test:coverage
```

---

## 📝 **Code Quality**

### **Linting:**
```bash
yarn lint
yarn lint:fix
```

### **Formatting:**
```bash
yarn format
```

### **Type Checking:**
```bash
yarn type-check
```

---

## 🚀 **Deployment**

### **Build:**
```bash
yarn build
```

### **Environment Variables:**
```env
VITE_API_URL=https://api.hemis.uz
VITE_APP_NAME=HEMIS Ministry
```

---

## 📚 **Resources**

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

---

## 👥 **Team**

**HEMIS Development Team**
- Frontend: React + TypeScript
- Backend: Java + Spring Boot
- Database: PostgreSQL
- DevOps: CI/CD Pipeline

---

## 📄 **License**

© 2025 O'zbekiston Respublikasi Oliy Ta'lim Vazirligi

---

**🎉 Modern, Professional, User-Friendly!** 🚀
