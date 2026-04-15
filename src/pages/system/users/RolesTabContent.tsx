import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield } from 'lucide-react'
import type { RoleSummary } from '@/types/user.types'

interface RolesTabContentProps {
  groupedRoles: Record<string, RoleSummary[]>
  availableRolesCount: number
  selectedRoleIds: string[]
  onToggleRole: (roleId: string) => void
  hasError: boolean
}

export default function RolesTabContent({
  groupedRoles,
  availableRolesCount,
  selectedRoleIds,
  onToggleRole,
  hasError,
}: RolesTabContentProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-[var(--text-secondary)]">
          <Shield className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{t('Roles')}</h2>
      </div>
      <div className="space-y-3">
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border border-[var(--border-color-pro)] bg-[var(--app-bg)] p-3">
          {Object.entries(groupedRoles).map(
            ([type, typeRoles]) =>
              typeRoles.length > 0 && (
                <div key={type}>
                  <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                    {t(type)}
                  </p>
                  {typeRoles.map((role) => {
                    const isChecked = selectedRoleIds.includes(role.id)
                    return (
                      // eslint-disable-next-line jsx-a11y/label-has-associated-control
                      <label
                        key={role.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors ${
                          isChecked ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => onToggleRole(role.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {role.name}
                          </span>
                          <span className="ml-1.5 text-[10px] text-[var(--text-secondary)]">
                            ({role.code})
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ),
          )}
          {availableRolesCount === 0 && (
            <p className="px-2 py-3 text-center text-sm text-[var(--text-secondary)]">
              {t('No roles available')}
            </p>
          )}
        </div>
        {hasError && <p className="text-xs text-red-500">{t('At least one role is required')}</p>}
      </div>
    </section>
  )
}
