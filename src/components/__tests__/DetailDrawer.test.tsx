import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithoutRouter as render, screen } from '@/test/test-utils'
import { DetailDrawer } from '../DetailDrawer'

describe('DetailDrawer', () => {
  it('renders title, children and footer when open', () => {
    render(
      <DetailDrawer open onOpenChange={vi.fn()} title="Group A" footer={<button>Close</button>}>
        <div>Drawer body</div>
      </DetailDrawer>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Group A')).toBeInTheDocument()
    expect(screen.getByText('Drawer body')).toBeInTheDocument()
    // Both the footer button and the Sheet's built-in X carry the "Close" name.
    expect(screen.getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0)
  })

  it('renders nothing when closed', () => {
    render(
      <DetailDrawer open={false} onOpenChange={vi.fn()} title="Group A">
        <div>Drawer body</div>
      </DetailDrawer>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Drawer body')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when Escape is pressed (Sheet focus/escape wiring)', async () => {
    const onOpenChange = vi.fn()
    render(
      <DetailDrawer open onOpenChange={onOpenChange} title="Group A">
        <div>Drawer body</div>
      </DetailDrawer>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders an optional description', () => {
    render(
      <DetailDrawer open onOpenChange={vi.fn()} title="Group A" description="ID: 42">
        <div>Drawer body</div>
      </DetailDrawer>,
    )
    expect(screen.getByText('ID: 42')).toBeInTheDocument()
  })
})
