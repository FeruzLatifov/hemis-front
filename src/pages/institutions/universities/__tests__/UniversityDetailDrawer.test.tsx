// This test file is deprecated.
// UniversityDetailDrawer has been replaced by UniversityDetailPage.
// Tests for UniversityDetailPage should be added separately.
import { describe, it, expect } from 'vitest'

describe('UniversityDetailDrawer (deprecated)', () => {
  it('exports a no-op component', async () => {
    const mod = await import('../UniversityDetailDrawer')
    expect(mod.default).toBeDefined()
  })
})
