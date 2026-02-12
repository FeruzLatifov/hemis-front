import { test, expect } from './fixtures/auth.fixture'

test.describe('Faculties', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/institutions/faculties')
    await page.waitForLoadState('networkidle')
  })

  test('should display faculty groups table', async ({ authenticatedPage: page }) => {
    const table = page.locator('table, [role="table"]')
    await expect(table).toBeVisible({ timeout: 10_000 })
  })

  test('should expand university to show faculties', async ({ authenticatedPage: page }) => {
    const expandButton = page.locator('button[aria-expanded]').first()
    await expect(expandButton).toBeVisible({ timeout: 10_000 })

    // Get initial expanded state
    const isExpanded = await expandButton.getAttribute('aria-expanded')
    await expandButton.click()

    // State should toggle
    await expect(expandButton).toHaveAttribute(
      'aria-expanded',
      isExpanded === 'true' ? 'false' : 'true',
    )
  })

  test('should support status filter', async ({ authenticatedPage: page }) => {
    const filterArea = page.locator('[class*="filter"], select, [role="combobox"]').first()
    if (await filterArea.isVisible()) {
      await filterArea.click()
      // Filter dropdown should appear
      const dropdown = page.locator('[role="listbox"], [role="option"]').first()
      await expect(dropdown).toBeVisible({ timeout: 3_000 })
    }
  })

  test('should open faculty detail drawer', async ({ authenticatedPage: page }) => {
    // First expand to see faculty rows
    const expandButton = page.locator('button[aria-expanded="false"]').first()
    if (await expandButton.isVisible()) {
      await expandButton.click()
      await page.waitForLoadState('networkidle')
    }

    // Click on a faculty row to open detail
    const facultyRow = page.locator('table tbody tr, [role="row"]').first()
    if (await facultyRow.isVisible()) {
      await facultyRow.click()
      const detail = page.locator('[role="dialog"], [class*="sheet"]')
      await expect(detail).toBeVisible({ timeout: 5_000 })
    }
  })
})
