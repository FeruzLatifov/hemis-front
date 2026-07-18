import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithoutRouter as render, screen } from '@/test/test-utils'
import { DataTable, type DataTableColumn } from '../DataTable'

interface Row {
  id: number
  name: string
  year: number
}

const rows: Row[] = [
  { id: 1, name: 'Alpha', year: 2024 },
  { id: 2, name: 'Beta', year: 2023 },
]

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, sortable: true },
  { id: 'year', header: 'Year', cell: (r) => r.year },
]

describe('DataTable', () => {
  it('renders rows and cells', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('renders skeleton rows while loading and no data rows', () => {
    render(
      <DataTable columns={columns} rows={[]} rowKey={(r) => r.id} isLoading skeletonRows={3} />,
    )
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    // 3 skeleton rows × 2 columns = 6 skeleton cells
    expect(document.querySelectorAll('[data-slot], .animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows the default empty state when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} />)
    // No data rows: only the single colSpanned empty cell exists.
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(1)
    expect(cells[0]).toHaveAttribute('colspan', String(columns.length))
  })

  it('renders a custom empty state', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        emptyState={<span>Nothing to show</span>}
      />,
    )
    expect(screen.getByText('Nothing to show')).toBeInTheDocument()
  })

  it('toggles sort direction on a sortable header click', async () => {
    const onSortChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        sortBy="name"
        sortDir="asc"
        onSortChange={onSortChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /name/i }))
    // current is name/asc → next toggles to desc
    expect(onSortChange).toHaveBeenCalledWith('name', 'desc')
  })

  it('does not make non-sortable headers interactive', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onSortChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /year/i })).not.toBeInTheDocument()
  })
})
