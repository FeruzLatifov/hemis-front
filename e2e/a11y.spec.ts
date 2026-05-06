import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility smoke tests.
 *
 * `axe-core` runs the actual WCAG ruleset against rendered pages, catching
 * issues jsx-a11y can't see at compile time (computed contrast, dynamic
 * landmark structure, dialog focus, etc).
 *
 * Failure policy: we fail on Serious + Critical only. Minor "best practice"
 * findings (missing landmark on a tiny error page, etc) wouldn't gate a
 * release — they go on the a11y backlog.
 *
 * Disabled rules:
 *   - color-contrast: Tailwind-driven greys can read as sub-AA against
 *     specific backgrounds and the design system owns that decision.
 *     Re-enable once we have a documented contrast review.
 */

const SERIOUS_AND_UP = ['serious', 'critical'] as const

test.describe('Accessibility (axe-core)', () => {
  test('login page has no serious WCAG violations', async ({ page }) => {
    await page.goto('/login')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const blocking = results.violations.filter((v) =>
      SERIOUS_AND_UP.includes(v.impact as (typeof SERIOUS_AND_UP)[number]),
    )

    if (blocking.length > 0) {
      // Make the failure readable in CI: list rule + impact + first node.
      const summary = blocking
        .map((v) => `  • [${v.impact}] ${v.id}: ${v.help}\n    → ${v.nodes[0]?.target.join(' ')}`)
        .join('\n')
      throw new Error(`axe-core found ${blocking.length} blocking violation(s):\n${summary}`)
    }

    expect(blocking).toHaveLength(0)
  })

  test('forgot-password page has no serious WCAG violations', async ({ page }) => {
    await page.goto('/forgot-password')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const blocking = results.violations.filter((v) =>
      SERIOUS_AND_UP.includes(v.impact as (typeof SERIOUS_AND_UP)[number]),
    )
    expect(blocking).toHaveLength(0)
  })
})
