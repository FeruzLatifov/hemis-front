# src/components — UI Components

> shadcn/ui (Radix UI primitives), Tailwind CSS 4 (`@theme` block), lucide-react ikonlari.
> Inline style va DOM manipulation TAQIQ.

---

## TOP Component Patterns

### 1. shadcn/ui — `@/components/ui/*`

Mavjud komponentlar (`src/components/ui/`):

- `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`
- `select.tsx`, `checkbox.tsx`, `dialog.tsx`, `sheet.tsx`, `popover.tsx`
- `dropdown-menu.tsx`, `tabs.tsx`, `tooltip.tsx`, `alert-dialog.tsx`
- `table.tsx`, `badge.tsx`, `skeleton.tsx`, `scroll-area.tsx`
- `variants.ts` — CVA variant definitions

**Boshqa UI kit qo'shmang** (Material UI, Ant Design, Chakra) — shadcn/ui Radix UI primitives orqali to'liq accessible.

### 2. Inline Style TAQIQ

```tsx
// ✗ TAQIQ
<div style={{ backgroundColor: '#2F80ED', padding: 12 }}>
<div style={{ marginTop: '20px' }}>

// ✓ TO'G'RI — Tailwind utility
<div className="bg-[var(--color-primary)] p-3">
<div className="mt-5">

// ✓ Dinamik qiymat (chart yoki table width) — exception
<div style={{ width: `${percentage}%` }}>  // OK — dinamik runtime
```

**Istisno:** dinamik runtime qiymatlar (TanStack Table column width, animation delay, percentage) — kerak bo'lsa style'da, lekin **statik** narsalarni Tailwind class'da.

### 3. DOM Manipulation TAQIQ

```tsx
// ✗ TAQIQ — imperative DOM
e.currentTarget.style.backgroundColor = '#hover'
document.querySelector('.modal').classList.add('open')
ref.current.scrollTop = 0  // direct DOM API access

// ✓ TO'G'RI — React state
const [isHover, setIsHover] = useState(false)
<div className={isHover ? 'bg-[var(--hover)]' : ''}>

// ✓ Hover Tailwind utility
<div className="hover:bg-[var(--hover)] transition-colors">

// ✓ Focus/visibility — Radix UI primitives
<Dialog open={open} onOpenChange={setOpen}>
```

### 4. Tailwind 4 — `@theme` CSS Variables

`src/index.css`:

```css
@theme {
  --color-border: hsl(214.3 31.8% 91.4%);
  --color-primary: hsl(221.2 83.2% 53.3%);
  /* ... */
}

.dark {
  --color-border: hsl(217.2 32.6% 17.5%);
  /* ... */
}
```

**Foydalanish:**

```tsx
// ✓ Theme variable
<div className="bg-[var(--color-primary)] text-[var(--color-foreground)]">

// ✓ Tailwind class (theme'dan)
<div className="bg-primary text-foreground">

// ✗ Hex hardcode (theme bypass)
<div className="bg-[#2F80ED]">  // dark mode ishlamaydi
```

### 5. Icon — Faqat `lucide-react`

```tsx
// ✓ TO'G'RI
import { Save, Trash2, ChevronDown } from 'lucide-react'
;<Save className="h-4 w-4" aria-hidden="true" />

// ✗ Boshqa icon library
import { FaSave } from 'react-icons/fa' // TAQIQ
import { SaveOutlined } from '@ant-design/icons' // TAQIQ
```

**Size:** 16-20px (`h-4 w-4`, `h-5 w-5`). Color matn rangida (`currentColor` default).

**Accessibility:** Decorative ikon — `aria-hidden="true"`. Action ikon (icon-only button) — `aria-label`.

### 6. Tugmalarda Matn Majburiy

```tsx
// ✗ Icon-only button (matn yo'q)
<button><Save className="h-4 w-4" /></button>

// ✓ Icon + matn (asosiy pattern)
<Button>
    <Save className="h-4 w-4" aria-hidden="true" />
    {t('Save')}
</Button>

// ✓ Icon-only (zarur bo'lsa) — aria-label MAJBURIY
<Button size="icon" aria-label={t('Save')}>
    <Save className="h-4 w-4" />
</Button>
```

### 7. Form — React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const studentSchema = z.object({
  pinfl: z.string().regex(/^\d{14}$/, { message: 'PINFL must be 14 digits' }),
  firstName: z.string().min(1).max(100),
  facultyId: z.number().positive(),
})

type StudentForm = z.infer<typeof studentSchema>

export function StudentForm() {
  const { t } = useTranslation()
  const form = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { pinfl: '', firstName: '', facultyId: 0 },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('pinfl')} placeholder={t('PINFL')} />
      {form.formState.errors.pinfl && (
        <p className="text-destructive text-sm">{t(form.formState.errors.pinfl.message)}</p>
      )}
    </form>
  )
}
```

**Diqqat:** Zod xato xabari **inglizcha** key (`'PINFL must be 14 digits'`) — `t()` orqali tarjima qilinadi.

### 8. Table — TanStack Table

```tsx
// Column'da inline style emas, className
const columns: ColumnDef<StudentDto>[] = [
  {
    accessorKey: 'firstName',
    header: () => <span>{t('First name')}</span>,
    cell: ({ row }) => <span className="font-medium">{row.original.firstName}</span>,
  },
]
```

### 9. Accessibility (jsx-a11y rules — ESLint enforced)

```tsx
// ✓ Form label
<label htmlFor="pinfl">{t('PINFL')}</label>
<Input id="pinfl" />

// ✓ Button type
<button type="button">  // default 'submit' — form submit'ga sabab bo'ladi

// ✓ Image alt
<img src="..." alt={t('Student photo')} />
<img src="..." alt="" aria-hidden="true" />  // decorative

// ✓ Click handler — keyboard ham
<div role="button" tabIndex={0} onClick={...} onKeyDown={(e) => e.key === 'Enter' && ...}>

// ✗ Click handler div'da (a11y bo'lmaydi)
<div onClick={...}>
```

### 10. Conditional Rendering

```tsx
// ✓ TO'G'RI — null safe
{students && students.length > 0 && students.map(s => <Card key={s.id} />)}

// ✓ Loading/error/empty states
{isLoading && <Skeleton className="h-20 w-full" />}
{isError && <p className="text-destructive">{t('Failed to load')}</p>}
{!isLoading && !isError && data?.length === 0 && <p>{t('No data')}</p>}
{!isLoading && data?.map(...)}

// ✗ XATO — number 0 render bo'ladi
{count && <Badge>{count}</Badge>}  // count=0 → 0 ekranda chiqadi

// ✓ TO'G'RI
{count > 0 && <Badge>{count}</Badge>}
```

### 11. Memoization — Faqat Kerak Bo'lganda

```tsx
// ✓ Og'ir hisob (filter/sort katta data)
const sortedStudents = useMemo(() => {
    return students.sort((a, b) => a.lastName.localeCompare(b.lastName))
}, [students])

// ✓ Component re-render himoyasi (TanStack Table cells)
const StudentRow = memo(function StudentRow({ student }: Props) { ... })

// ✗ Premature optimization — har function/object'ni useMemo'da o'rama
const handleClick = useCallback(() => ..., [])  // children re-render bo'lmasa kerak emas
```

### 12. Composition over Configuration

```tsx
// ✗ Configuration explosion
<Modal title="..." footer={<Button>...</Button>} icon={<Icon />} closeOnEsc={true} />

// ✓ Composition (shadcn/ui pattern)
<Dialog>
    <DialogTrigger>...</DialogTrigger>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>{t('Title')}</DialogTitle>
        </DialogHeader>
        <div>{/* content */}</div>
        <DialogFooter>
            <Button>{t('Save')}</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

---

## File Naming

```
✓ TO'G'RI
StudentsPage.tsx
StudentFormDialog.tsx
StudentDetailDrawer.tsx

✗ TAQIQ
index.tsx           # aniq nom bo'lsin
students.tsx        # PascalCase
StudentForm.jsx     # TypeScript .tsx
```

---

## PR Checklist (components/)

- [ ] shadcn/ui ishlatilgan, boshqa UI library yo'q
- [ ] Inline style yo'q (statik) — Tailwind class
- [ ] DOM manipulation yo'q (`e.currentTarget.style`, `document.querySelector`) — React state
- [ ] Tailwind 4 `@theme` variables (hex hardcode emas)
- [ ] Icon — `lucide-react` 16-20px, `aria-hidden` decorative
- [ ] Tugmalarda matn yoki `aria-label`
- [ ] React Hook Form + Zod (boshqa form lib yo'q)
- [ ] jsx-a11y violation yo'q (`yarn lint`)
- [ ] Loading/error/empty states ko'rsatilgan
- [ ] Memoization faqat kerakli yerda
- [ ] File nomi PascalCase, `index.tsx` emas

---

## See Also

- `@../../CLAUDE.md` — Design system, do/don't
- `@../hooks/CLAUDE.md` — Hook patterns
