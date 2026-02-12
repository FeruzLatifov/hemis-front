import { test as base, expect, type Page } from '@playwright/test'

interface AuthFixtures {
  authenticatedPage: Page
}

async function login(page: Page) {
  await page.goto('/login')

  await page.getByLabel(/username|login/i).fill(process.env.E2E_USERNAME || 'admin')
  await page.getByLabel(/password|parol/i).fill(process.env.E2E_PASSWORD || 'admin123')
  await page.getByRole('button', { name: /sign in|kirish/i }).click()

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await login(page)
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not a React hook
    await use(page)
  },
})

export { expect }
