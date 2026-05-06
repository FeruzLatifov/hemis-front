/**
 * UniversityForm shared building blocks
 *
 * Extracted from UniversityFormPage.tsx to keep that file under control —
 * `FormSection`, `FormSelect`, and `FormSkeleton` are reused by the form,
 * the officials tab, and the profile tab.
 */

import { Controller, type Control, type FieldPath } from 'react-hook-form'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { renderDictItems } from './form-helpers'

// Re-exporting the FormData type from the page itself would create a circular
// dependency, so we accept any FieldPath here and lean on the caller to type it.
// The select itself is value-agnostic — it just round-trips a string.
type SelectableField = FieldPath<Record<string, unknown>>

/**
 * RHF-controlled wrapper around shadcn/Radix Select.
 *
 * Why Controller (not raw `value={watch(...)}`):
 * Radix Select binds its internal `value` lazily — when the form's `defaultValues`
 * start empty and dictionaries arrive after first paint, the un-controlled→controlled
 * transition can leave the trigger showing the placeholder even though RHF state holds
 * the right code. Controller subscribes the field at the React-tree level, so the
 * Select re-renders deterministically when the underlying value changes.
 */
export function FormSelect<TFieldValues extends Record<string, unknown>>({
  name,
  control,
  items,
  placeholder,
  disabled,
}: {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  items: Array<{ code: string; name: string }>
  placeholder: string
  disabled?: boolean
}) {
  return (
    <Controller
      control={control as unknown as Control<Record<string, unknown>>}
      name={name as SelectableField}
      render={({ field }) => {
        const value = typeof field.value === 'string' && field.value ? field.value : undefined
        return (
          <Select value={value} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>{renderDictItems(items)}</SelectContent>
          </Select>
        )
      }}
    />
  )
}

/** Section card used to wrap each form section consistently. */
export function FormSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

/** Form loading skeleton shown while the university and dictionaries fetch. */
export function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-8 w-48 rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6"
        >
          <Skeleton className="mb-4 h-5 w-36 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-9 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
