import { memo } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SidebarSearchBoxProps {
  value: string
  onChange: (value: string) => void
}

function SidebarSearchBox({ value, onChange }: SidebarSearchBoxProps) {
  const { t } = useTranslation()
  return (
    <div className="relative mb-3">
      <Search className="text-color-secondary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('Search menu...')}
        className="border-color-light layout-bg text-color-primary placeholder:text-color-secondary w-full rounded-lg border py-2 pr-8 pl-9 text-sm outline-none focus:border-[var(--primary)]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-color-secondary hover:text-color-primary absolute top-1/2 right-2 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default memo(SidebarSearchBox)
