import { test, expect } from './fixtures/auth.fixture'

test.describe('Universities', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/institutions/universities')
    await page.waitForLoadState('networkidle')
  })

  test('should display universities table', async ({ authenticatedPage: page }) => {
    const table = page.locator('table, [role="table"]')
    await expect(table).toBeVisible({ timeout: 10_000 })

    // Table should have rows
    const rows = page.locator('table tbody tr, [role="row"]')
    await expect(rows.first()).toBeVisible({ timeout: 10_000 })
  })

  test('should support search functionality', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/search|qidirish/i)
    await expect(searchInput).toBeVisible()

    await searchInput.fill('TATU')
    // Wait for search results to update
    await page.waitForLoadState('networkidle')

    // Table should still be visible with filtered results
    const rows = page.locator('table tbody tr, [role="row"]')
    await expect(rows.first()).toBeVisible({ timeout: 5_000 })
  })

  test('should support pagination', async ({ authenticatedPage: page }) => {
    // Pagination should be visible when there are enough items
    const paginationArea = page.locator('[class*="pagination"], nav[aria-label*="pagination"]')
    if (await paginationArea.isVisible()) {
      const nextButton = page.getByRole('button', { name: /next|keyingi|>/i })
      await expect(nextButton).toBeVisible()
    }
  })

  test('should open university detail drawer on row click', async ({ authenticatedPage: page }) => {
    const firstRow = page.locator('table tbody tr, [role="row"]').first()
    await expect(firstRow).toBeVisible({ timeout: 10_000 })

    await firstRow.click()

    // Detail drawer/dialog should appear
    const detail = page.locator('[role="dialog"], [class*="sheet"]')
    await expect(detail).toBeVisible({ timeout: 5_000 })
  })
})
