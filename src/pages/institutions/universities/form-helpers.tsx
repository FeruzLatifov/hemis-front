/**
 * Helpers shared between the university form and its sibling components.
 * Kept separate from `UniversityFormShared.tsx` so Vite Fast Refresh can
 * keep treating that file as a "components-only" module.
 */

import { SelectItem } from '@/components/ui/select'

/** Render `<SelectItem>` list from a code/name dictionary. */
export function renderDictItems(items: Array<{ code: string; name: string }>) {
  return items.map((item) => (
    <SelectItem key={item.code} value={item.code}>
      {item.name}
    </SelectItem>
  ))
}
