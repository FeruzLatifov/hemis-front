import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registrationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
} from '../auth.schema'

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.parse({ username: 'admin', password: 'pass123' })
    expect(result.username).toBe('admin')
    expect(result.locale).toBe('uz')
  })

  it('rejects short username', () => {
    expect(() => loginSchema.parse({ username: 'ab', password: 'pass' })).toThrow()
  })

  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ username: 'admin', password: '' })).toThrow()
  })

  it('accepts all locale values', () => {
    for (const locale of ['uz', 'oz', 'ru', 'en']) {
      const result = loginSchema.parse({ username: 'admin', password: 'pass', locale })
      expect(result.locale).toBe(locale)
    }
  })
})

describe('registrationSchema', () => {
  const validData = {
    username: 'newuser',
    email: 'user@example.com',
    password: 'Abc12345',
    confirmPassword: 'Abc12345',
    firstName: 'John',
    lastName: 'Doe',
    acceptTerms: true as const,
  }

  it('accepts valid registration data', () => {
    const result = registrationSchema.parse(validData)
    expect(result.username).toBe('newuser')
  })

  it('rejects password mismatch', () => {
    expect(() => registrationSchema.parse({ ...validData, confirmPassword: 'different' })).toThrow()
  })

  it('rejects when terms not accepted', () => {
    expect(() => registrationSchema.parse({ ...validData, acceptTerms: false })).toThrow()
  })
})

describe('passwordResetRequestSchema', () => {
  it('accepts valid email', () => {
    const result = passwordResetRequestSchema.parse({ email: 'user@example.com' })
    expect(result.email).toBeTruthy()
  })

  it('rejects invalid email', () => {
    expect(() => passwordResetRequestSchema.parse({ email: 'not-email' })).toThrow()
  })
})

describe('passwordResetSchema', () => {
  it('accepts matching passwords', () => {
    const result = passwordResetSchema.parse({
      token: 'valid-token',
      password: 'NewPass1',
      confirmPassword: 'NewPass1',
    })
    expect(result.token).toBe('valid-token')
  })

  it('rejects empty token', () => {
    expect(() =>
      passwordResetSchema.parse({
        token: '',
        password: 'NewPass1',
        confirmPassword: 'NewPass1',
      }),
    ).toThrow()
  })

  it('rejects password mismatch', () => {
    expect(() =>
      passwordResetSchema.parse({
        token: 'valid',
        password: 'NewPass1',
        confirmPassword: 'Different1',
      }),
    ).toThrow()
  })
})

describe('changePasswordSchema', () => {
  it('accepts valid change password data', () => {
    const result = changePasswordSchema.parse({
      currentPassword: 'oldpass',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    })
    expect(result.currentPassword).toBe('oldpass')
  })

  it('rejects when new password matches current', () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'NewPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'NewPass1',
      }),
    ).toThrow()
  })

  it('rejects when confirm does not match new password', () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: 'oldpass',
        newPassword: 'NewPass1',
        confirmPassword: 'Different1',
      }),
    ).toThrow()
  })
})
