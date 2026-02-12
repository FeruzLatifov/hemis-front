// This test file is deprecated.
// UniversityFormDialog has been replaced by UniversityFormPage.
// Tests for UniversityFormPage should be added separately.
import { describe, it, expect } from 'vitest'

describe('UniversityFormDialog (deprecated)', () => {
  it('exports a no-op component', async () => {
    const mod = await import('../UniversityFormDialog')
    expect(mod.default).toBeDefined()
  })
})
