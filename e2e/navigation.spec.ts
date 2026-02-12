import { test, expect } from './fixtures/auth.fixture'

test.describe('Navigation', () => {
  test('should show sidebar with menu items', async ({ authenticatedPage: page }) => {
    const sidebar = page.getByRole('navigation')
    await expect(sidebar.first()).toBeVisible()

    // Sidebar should have menu links
    const menuLinks = page.locator('nav a, [role="navigation"] a')
    const count = await menuLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate via sidebar links', async ({ authenticatedPage: page }) => {
    const menuLinks = page.locator('nav a[href], [role="navigation"] a[href]')
    const count = await menuLinks.count()
    expect(count).toBeGreaterThan(0)

    // Click first menu link and verify navigation
    const firstLink = menuLinks.first()
    const href = await firstLink.getAttribute('href')
    await firstLink.click()
    await page.waitForLoadState('networkidle')

    // URL should have changed
    if (href) {
      await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
  })

  test('should display breadcrumbs on nested pages', async ({ authenticatedPage: page }) => {
    await page.goto('/institutions/universities')
    await page.waitForLoadState('networkidle')

    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], [class*="breadcrumb"]')
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toContainText(/universit/i)
    }
  })

  test('should show 404 page for invalid routes', async ({ authenticatedPage: page }) => {
    await page.goto('/nonexistent-page-12345')
    await expect(page.getByText('404')).toBeVisible({ timeout: 10_000 })
  })

  test('should collapse and expand sidebar', async ({ authenticatedPage: page }) => {
    const toggleButton = page
      .locator(
        'button[aria-label*="close"], button[aria-label*="open"], button[aria-label*="menu"], button[aria-label*="yopish"]',
      )
      .first()

    if (await toggleButton.isVisible()) {
      // Click to toggle sidebar
      await toggleButton.click()

      // Wait for animation
      await page.waitForTimeout(300)

      // Click again to restore
      await toggleButton.click()
      await page.waitForTimeout(300)

      // Sidebar should still be functional
      const sidebar = page.getByRole('navigation')
      await expect(sidebar.first()).toBeVisible()
    }
  })
})
