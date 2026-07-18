import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithoutRouter as render, screen, within } from '@/test/test-utils'
import { QueryStateBoundary } from '../QueryStateBoundary'

describe('QueryStateBoundary', () => {
  it('renders children when not loading, error, or empty', () => {
    render(
      <QueryStateBoundary isLoading={false} isError={false} isEmpty={false}>
        <div>Loaded content</div>
      </QueryStateBoundary>,
    )
    expect(screen.getByText('Loaded content')).toBeInTheDocument()
  })

  it('shows the loading fallback and hides children while loading', () => {
    render(
      <QueryStateBoundary isLoading isError={false}>
        <div>Loaded content</div>
      </QueryStateBoundary>,
    )
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows an error state with a working Retry button', async () => {
    const onRetry = vi.fn()
    render(
      <QueryStateBoundary isLoading={false} isError onRetry={onRetry}>
        <div>Loaded content</div>
      </QueryStateBoundary>,
    )
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument()
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()

    await userEvent.click(within(alert).getByRole('button'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('error state takes precedence over empty', () => {
    render(
      <QueryStateBoundary isLoading={false} isError isEmpty>
        <div>Loaded content</div>
      </QueryStateBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows the empty state when empty and not loading/error', () => {
    render(
      <QueryStateBoundary isLoading={false} isError={false} isEmpty>
        <div>Loaded content</div>
      </QueryStateBoundary>,
    )
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument()
    // language-agnostic: the default empty state renders the Inbox glyph
    expect(document.querySelector('.lucide-inbox')).toBeInTheDocument()
  })

  it('renders a custom empty fallback when provided', () => {
    render(
      <QueryStateBoundary
        isLoading={false}
        isError={false}
        isEmpty
        emptyFallback={<div>Nothing here yet</div>}
      >
        <div>Loaded content</div>
      </QueryStateBoundary>,
    )
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })
})
