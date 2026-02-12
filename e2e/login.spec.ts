import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form with all elements', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in|kirish/i })).toBeVisible()
    await expect(page.getByLabel(/username|login/i)).toBeVisible()
    await expect(page.getByLabel(/password|parol/i)).toBeVisible()
    await expect(page.getByText('HEMIS')).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.getByLabel(/username|login/i).fill('wrong_user')
    await page.getByLabel(/password|parol/i).fill('wrong_pass')
    await page.getByRole('button', { name: /sign in|kirish/i }).click()

    // Should show error toast or validation message
    const errorIndicator = page
      .getByText(/invalid|error|xato|noto'g'ri/i)
      .or(page.locator('[data-sonner-toast][data-type="error"]'))
    await expect(errorIndicator).toBeVisible({ timeout: 10_000 })
  })

  test('should login with valid credentials and redirect', async ({ page }) => {
    const username = process.env.E2E_USERNAME || 'admin'
    const password = process.env.E2E_PASSWORD || 'admin123'

    await page.getByLabel(/username|login/i).fill(username)
    await page.getByLabel(/password|parol/i).fill(password)
    await page.getByRole('button', { name: /sign in|kirish/i }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: 10_000 })
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password|parol/i)
    await passwordInput.fill('testpassword')

    // Should be password type initially
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click show/hide button
    const toggleBtn = page.getByLabel(/show|hide|ko'rsatish|yashirish/i)
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })

  test('should have language selector', async ({ page }) => {
    // Language selector should be visible
    const langButton = page.getByText(/o'zbekcha|english|русский/i).first()
    await expect(langButton).toBeVisible()
  })
})
