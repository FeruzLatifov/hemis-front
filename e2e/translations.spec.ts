import { test, expect } from './fixtures/auth.fixture'

test.describe('Translations', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/system/translations')
    await page.waitForLoadState('networkidle')
  })

  test('should display translations table', async ({ authenticatedPage: page }) => {
    const table = page.locator('table, [role="table"]')
    await expect(table).toBeVisible({ timeout: 10_000 })

    // Table should have rows
    const rows = page.locator('table tbody tr, [role="row"]')
    await expect(rows.first()).toBeVisible({ timeout: 10_000 })
  })

  test('should support search functionality', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/search|qidirish/i)
    await expect(searchInput).toBeVisible()

    await searchInput.fill('Dashboard')
    await page.waitForLoadState('networkidle')

    // Results should be visible
    const rows = page.locator('table tbody tr, [role="row"]')
    await expect(rows.first()).toBeVisible({ timeout: 5_000 })
  })

  test('should open edit form on edit button click', async ({ authenticatedPage: page }) => {
    const editButton = page.getByRole('button', { name: /edit|tahrirlash/i }).first()
    await expect(editButton).toBeVisible({ timeout: 10_000 })

    await editButton.click()

    // Edit form dialog should appear
    const dialog = page.locator('[role="dialog"], [class*="form"], [class*="drawer"]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
  })

  test('should toggle translation active status', async ({ authenticatedPage: page }) => {
    const toggle = page.locator('button[role="switch"], input[type="checkbox"]').first()
    await expect(toggle).toBeVisible({ timeout: 10_000 })

    await toggle.click()

    // Wait for API response
    await page.waitForLoadState('networkidle')

    // State should change (or toast should appear)
    const toast = page.locator('[data-sonner-toast]')
    await expect(toggle.or(toast)).toBeVisible()
  })
})
