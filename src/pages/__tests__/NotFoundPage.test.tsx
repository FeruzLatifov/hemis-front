/**
 * Tests for NotFoundPage
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

import NotFoundPage from '@/pages/NotFoundPage'

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 404 text', () => {
    render(<NotFoundPage />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders page not found heading', () => {
    render(<NotFoundPage />)
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<NotFoundPage />)
    expect(
      screen.getByText("Sorry, the page you're looking for doesn't exist or has been moved."),
    ).toBeInTheDocument()
  })

  it('renders Go back button and navigates on click', async () => {
    const user = userEvent.setup()
    render(<NotFoundPage />)

    const goBackButton = screen.getByText('Go back')
    expect(goBackButton).toBeInTheDocument()

    await user.click(goBackButton)
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('renders Go to Dashboard button and navigates on click', async () => {
    const user = userEvent.setup()
    render(<NotFoundPage />)

    const dashboardButton = screen.getByText('Go to Dashboard')
    expect(dashboardButton).toBeInTheDocument()

    await user.click(dashboardButton)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('renders help section with Need help?', () => {
    render(<NotFoundPage />)
    expect(screen.getByText('Need help?')).toBeInTheDocument()
  })

  it('renders contact information', () => {
    render(<NotFoundPage />)
    expect(screen.getByText('support@hemis.uz')).toBeInTheDocument()
    expect(screen.getByText('+998 71 200 00 00')).toBeInTheDocument()
  })

  it('renders admin contact note', () => {
    render(<NotFoundPage />)
    expect(
      screen.getByText('If you believe this is an error, please contact the system administrator.'),
    ).toBeInTheDocument()
  })

  it('has correct email link', () => {
    render(<NotFoundPage />)
    const emailLink = screen.getByText('support@hemis.uz')
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:support@hemis.uz')
  })

  it('has correct phone link', () => {
    render(<NotFoundPage />)
    const phoneLink = screen.getByText('+998 71 200 00 00')
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+998712000000')
  })
})
