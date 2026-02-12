import { test, expect } from './fixtures/auth.fixture'

test.describe('Dashboard', () => {
  test('should display dashboard page with heading', async ({ authenticatedPage: page }) => {
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
    await expect(heading).not.toBeEmpty()
  })

  test('should show statistics cards', async ({ authenticatedPage: page }) => {
    // Dashboard should have stat cards with numbers
    const statElements = page.locator(
      '[class*="card"] [class*="count"], [class*="stat"], [class*="CountUp"]',
    )
    await expect(statElements.first()).toBeVisible({ timeout: 10_000 })
  })

  test('should load data without errors', async ({ authenticatedPage: page }) => {
    // Wait for page to settle
    await page.waitForLoadState('networkidle')

    // No error toasts should be present
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]')
    await expect(errorToast).toHaveCount(0)
  })

  test('should display navigation sidebar', async ({ authenticatedPage: page }) => {
    const sidebar = page.getByRole('navigation')
    await expect(sidebar.first()).toBeVisible()
  })
})
