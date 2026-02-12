import { memo, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { type UniversityRow } from '@/api/universities.api'
import { Checkbox } from '@/components/ui/checkbox'
import { type TFunction } from 'i18next'

// ─── ResolvedRow type ─────────────────────────────────────────────
export type ResolvedRow = UniversityRow & {
  regionName: string
  ownershipName: string
  typeName: string
  activityStatusName: string
  belongsToName: string
  contractCategoryName: string
  versionTypeName: string
  soatoRegionName: string
}

// ─── Search highlight helper ──────────────────────────────────────
const HighlightText = memo(function HighlightText({
  text,
  query,
}: {
  text: string
  query: string
}) {
  if (!query || !text) return <>{text || ''}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-yellow-100 px-0.5 text-yellow-900">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
})

// ─── Memoized cell components ─────────────────────────────────────

/** Simple text cell with dash fallback */
const TextCell = memo(function TextCell({ value }: { value: string | undefined }) {
  return <span className="text-gray-500">{value || '—'}</span>
})

/** Truncated text cell with title tooltip */
const TruncatedTextCell = memo(function TruncatedTextCell({
  value,
}: {
  value: string | undefined
}) {
  return (
    <div className="overflow-hidden text-ellipsis text-gray-500" title={value || ''}>
      {value || '—'}
    </div>
  )
})

/** Boolean status cell with dot indicator */
const BooleanStatusCell = memo(function BooleanStatusCell({
  value,
  yesLabel,
  noLabel,
}: {
  value: boolean | undefined
  yesLabel: string
  noLabel: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${value ? 'text-emerald-600' : 'text-gray-400'}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}
      />
      {value ? yesLabel : noLabel}
    </span>
  )
})

/** Active/Inactive status cell */
const ActiveStatusCell = memo(function ActiveStatusCell({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean | undefined
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
      />
      <span className={active ? 'text-emerald-700' : 'text-gray-400'}>
        {active ? activeLabel : inactiveLabel}
      </span>
    </span>
  )
})

/** External link cell */
const LinkCell = memo(function LinkCell({ url }: { url: string | undefined }) {
  if (!url) return <span className="text-gray-400">—</span>
  const href = url.startsWith('http') ? url : `https://${url}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {url}
    </a>
  )
})

// ─── Columns hook ─────────────────────────────────────────────────
export function useUniversitiesColumns({
  t,
  handleCopyToClipboard,
  currentPage,
  pageSize,
  debouncedSearch,
}: {
  t: TFunction
  handleCopyToClipboard: (text: string) => void
  currentPage: number
  pageSize: number
  debouncedSearch: string
}): ColumnDef<ResolvedRow>[] {
  return useMemo<ColumnDef<ResolvedRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('Select all')}
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t('Select row')}
            className="translate-y-[2px]"
          />
        ),
        size: 40,
        minSize: 32,
        maxSize: 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
      {
        id: 'rowNumber',
        header: '#',
        cell: ({ row }) => (
          <span className="text-gray-400 tabular-nums">
            {currentPage * pageSize + row.index + 1}
          </span>
        ),
        size: 48,
        minSize: 40,
        maxSize: 60,
        enableHiding: false,
        enableSorting: false,
        enableResizing: false,
      },
      {
        accessorKey: 'code',
        header: t('Code'),
        cell: ({ row }) => (
          <button
            type="button"
            className="cursor-copy font-mono text-gray-500 transition-colors hover:text-[var(--primary)]"
            onClick={(e) => {
              e.stopPropagation()
              handleCopyToClipboard(row.original.code)
            }}
            title={t('Click to copy')}
          >
            <HighlightText text={row.original.code} query={debouncedSearch} />
          </button>
        ),
        size: 80,
        minSize: 60,
        maxSize: 150,
        enableSorting: true,
      },
      {
        accessorKey: 'name',
        header: t('Name'),
        cell: ({ row }) => (
          <div
            className="overflow-hidden font-medium text-ellipsis text-gray-900"
            title={row.original.name}
          >
            <HighlightText text={row.original.name} query={debouncedSearch} />
          </div>
        ),
        size: 320,
        minSize: 150,
        maxSize: 800,
        enableSorting: true,
      },
      {
        accessorKey: 'tin',
        header: t('INN'),
        cell: ({ row }) => (
          <button
            type="button"
            className={`font-mono text-gray-500 ${row.original.tin ? 'cursor-copy transition-colors hover:text-[var(--primary)]' : ''}`}
            onClick={(e) => {
              if (row.original.tin) {
                e.stopPropagation()
                handleCopyToClipboard(row.original.tin)
              }
            }}
            title={row.original.tin ? t('Click to copy') : undefined}
          >
            {row.original.tin ? (
              <HighlightText text={row.original.tin} query={debouncedSearch} />
            ) : (
              '—'
            )}
          </button>
        ),
        size: 100,
        minSize: 80,
        maxSize: 150,
        enableSorting: false,
      },
      {
        id: 'regionName',
        accessorKey: 'regionName',
        header: t('Region'),
        cell: ({ row }) => <TruncatedTextCell value={row.original.regionName} />,
        size: 170,
        minSize: 100,
        maxSize: 300,
        enableSorting: false,
      },
      {
        id: 'ownershipName',
        accessorKey: 'ownershipName',
        header: t('Ownership'),
        cell: ({ row }) => <TextCell value={row.original.ownershipName} />,
        size: 120,
        minSize: 80,
        maxSize: 200,
        enableSorting: false,
      },
      {
        id: 'typeName',
        accessorKey: 'typeName',
        header: t('Type'),
        cell: ({ row }) => <TextCell value={row.original.typeName} />,
        size: 120,
        minSize: 80,
        maxSize: 200,
        enableSorting: false,
      },
      {
        id: 'activityStatusName',
        accessorKey: 'activityStatusName',
        header: t('Activity status'),
        cell: ({ row }) => <TextCell value={row.original.activityStatusName} />,
        size: 120,
        minSize: 80,
        maxSize: 200,
        enableSorting: false,
      },
      {
        id: 'belongsToName',
        accessorKey: 'belongsToName',
        header: t('Belongs to'),
        cell: ({ row }) => <TextCell value={row.original.belongsToName} />,
        size: 160,
        minSize: 100,
        maxSize: 250,
        enableSorting: false,
      },
      {
        id: 'contractCategoryName',
        accessorKey: 'contractCategoryName',
        header: t('Contract category'),
        cell: ({ row }) => <TextCell value={row.original.contractCategoryName} />,
        size: 130,
        minSize: 80,
        maxSize: 200,
        enableSorting: false,
      },
      {
        id: 'versionTypeName',
        accessorKey: 'versionTypeName',
        header: t('HEMIS version'),
        cell: ({ row }) => <TextCell value={row.original.versionTypeName} />,
        size: 120,
        minSize: 80,
        maxSize: 200,
        enableSorting: false,
      },
      {
        id: 'address',
        accessorKey: 'address',
        header: t('Address'),
        cell: ({ row }) => <TruncatedTextCell value={row.original.address} />,
        size: 200,
        minSize: 100,
        maxSize: 500,
        enableSorting: false,
      },
      {
        id: 'mailAddress',
        accessorKey: 'mailAddress',
        header: t('Mail address'),
        cell: ({ row }) => <TruncatedTextCell value={row.original.mailAddress} />,
        size: 200,
        minSize: 100,
        maxSize: 400,
        enableSorting: false,
      },
      {
        id: 'soatoRegion',
        accessorKey: 'soatoRegionName',
        header: t('District'),
        cell: ({ row }) => <TruncatedTextCell value={row.original.soatoRegionName} />,
        size: 170,
        minSize: 100,
        maxSize: 300,
        enableSorting: false,
      },
      {
        id: 'terrain',
        accessorKey: 'terrain',
        header: t('Neighborhood'),
        cell: ({ row }) => <TruncatedTextCell value={row.original.terrain} />,
        size: 160,
        minSize: 80,
        maxSize: 300,
        enableSorting: false,
      },
      {
        id: 'cadastre',
        accessorKey: 'cadastre',
        header: t('Cadastre'),
        cell: ({ row }) => <TextCell value={row.original.cadastre} />,
        size: 100,
        minSize: 60,
        maxSize: 200,
        enableSorting: false,
      },
      {
        id: 'universityUrl',
        accessorKey: 'universityUrl',
        header: t('University URL'),
        cell: ({ row }) => <LinkCell url={row.original.universityUrl} />,
        size: 180,
        minSize: 100,
        maxSize: 350,
        enableSorting: false,
      },
      {
        id: 'teacherUrl',
        accessorKey: 'teacherUrl',
        header: t('Teacher URL'),
        cell: ({ row }) => <LinkCell url={row.original.teacherUrl} />,
        size: 180,
        minSize: 100,
        maxSize: 350,
        enableSorting: false,
      },
      {
        id: 'studentUrl',
        accessorKey: 'studentUrl',
        header: t('Student URL'),
        cell: ({ row }) => <LinkCell url={row.original.studentUrl} />,
        size: 180,
        minSize: 100,
        maxSize: 350,
        enableSorting: false,
      },
      {
        id: 'uzbmbUrl',
        accessorKey: 'uzbmbUrl',
        header: t('UZBMB URL'),
        cell: ({ row }) => <LinkCell url={row.original.uzbmbUrl} />,
        size: 180,
        minSize: 100,
        maxSize: 350,
        enableSorting: false,
      },
      {
        id: 'gpaEdit',
        accessorKey: 'gpaEdit',
        header: t('GPA edit'),
        cell: ({ row }) => (
          <BooleanStatusCell value={row.original.gpaEdit} yesLabel={t('Yes')} noLabel={t('No')} />
        ),
        size: 90,
        minSize: 70,
        maxSize: 120,
        enableSorting: false,
      },
      {
        id: 'accreditationEdit',
        accessorKey: 'accreditationEdit',
        header: t('Accreditation edit'),
        cell: ({ row }) => (
          <BooleanStatusCell
            value={row.original.accreditationEdit}
            yesLabel={t('Yes')}
            noLabel={t('No')}
          />
        ),
        size: 130,
        minSize: 100,
        maxSize: 180,
        enableSorting: false,
      },
      {
        id: 'addStudent',
        accessorKey: 'addStudent',
        header: t('Add student'),
        cell: ({ row }) => (
          <BooleanStatusCell
            value={row.original.addStudent}
            yesLabel={t('Yes')}
            noLabel={t('No')}
          />
        ),
        size: 110,
        minSize: 80,
        maxSize: 150,
        enableSorting: false,
      },
      {
        id: 'allowGrouping',
        accessorKey: 'allowGrouping',
        header: t('Allow grouping'),
        cell: ({ row }) => (
          <BooleanStatusCell
            value={row.original.allowGrouping}
            yesLabel={t('Yes')}
            noLabel={t('No')}
          />
        ),
        size: 120,
        minSize: 80,
        maxSize: 160,
        enableSorting: false,
      },
      {
        id: 'allowTransferOutside',
        accessorKey: 'allowTransferOutside',
        header: t('Allow transfer outside'),
        cell: ({ row }) => (
          <BooleanStatusCell
            value={row.original.allowTransferOutside}
            yesLabel={t('Yes')}
            noLabel={t('No')}
          />
        ),
        size: 150,
        minSize: 100,
        maxSize: 200,
        enableSorting: false,
      },
      {
        id: 'bankInfo',
        accessorKey: 'bankInfo',
        header: t('Bank info'),
        cell: ({ row }) => <TruncatedTextCell value={row.original.bankInfo} />,
        size: 200,
        minSize: 100,
        maxSize: 400,
        enableSorting: false,
      },
      {
        id: 'accreditationInfo',
        accessorKey: 'accreditationInfo',
        header: t('Accreditation info'),
        cell: ({ row }) => <TruncatedTextCell value={row.original.accreditationInfo} />,
        size: 200,
        minSize: 100,
        maxSize: 400,
        enableSorting: false,
      },
      {
        accessorKey: 'active',
        header: t('Status'),
        cell: ({ row }) => (
          <ActiveStatusCell
            active={row.original.active}
            activeLabel={t('Active')}
            inactiveLabel={t('Inactive')}
          />
        ),
        size: 90,
        minSize: 70,
        maxSize: 130,
        enableSorting: false,
      },
    ],
    [t, handleCopyToClipboard, currentPage, pageSize, debouncedSearch],
  )
}
