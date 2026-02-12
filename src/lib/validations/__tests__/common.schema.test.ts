import { describe, it, expect } from 'vitest'
import {
  requiredString,
  optionalString,
  emailField,
  optionalEmailField,
  phoneField,
  optionalPhoneField,
  urlField,
  optionalUrlField,
  passwordField,
  loginPasswordField,
  usernameField,
  numberField,
  integerField,
  positiveIntField,
  dateField,
  optionalDateField,
  booleanField,
  uuidField,
  optionalUuidField,
  paginationSchema,
  dateRangeSchema,
} from '../common.schema'

describe('requiredString', () => {
  it('accepts valid string', () => {
    const schema = requiredString(1, 10)
    expect(schema.parse('hello')).toBeTruthy()
  })

  it('rejects empty string', () => {
    const schema = requiredString()
    expect(() => schema.parse('')).toThrow()
  })

  it('rejects string exceeding maxLength', () => {
    const schema = requiredString(1, 5)
    expect(() => schema.parse('toolongstring')).toThrow()
  })
})

describe('optionalString', () => {
  it('accepts undefined', () => {
    const schema = optionalString()
    expect(schema.parse(undefined)).toBeUndefined()
  })

  it('accepts valid string', () => {
    const schema = optionalString()
    const result = schema.parse('test')
    expect(result).toBeTruthy()
  })
})

describe('emailField', () => {
  it('accepts valid email', () => {
    expect(emailField.parse('user@example.com')).toBeTruthy()
  })

  it('rejects invalid email', () => {
    expect(() => emailField.parse('not-an-email')).toThrow()
  })
})

describe('optionalEmailField', () => {
  it('accepts undefined', () => {
    expect(optionalEmailField.parse(undefined)).toBeUndefined()
  })
})

describe('phoneField', () => {
  it('accepts valid Uzbek phone number', () => {
    expect(phoneField.parse('+998901234567')).toBeTruthy()
  })

  it('rejects invalid phone number', () => {
    expect(() => phoneField.parse('+1234567890')).toThrow()
  })
})

describe('optionalPhoneField', () => {
  it('accepts undefined', () => {
    expect(optionalPhoneField.parse(undefined)).toBeUndefined()
  })

  it('rejects invalid phone when provided', () => {
    expect(() => optionalPhoneField.parse('123')).toThrow()
  })
})

describe('urlField', () => {
  it('accepts valid URL', () => {
    expect(urlField.parse('https://example.com')).toBeTruthy()
  })

  it('rejects invalid URL', () => {
    expect(() => urlField.parse('not-a-url')).toThrow()
  })
})

describe('optionalUrlField', () => {
  it('accepts undefined', () => {
    expect(optionalUrlField.parse(undefined)).toBeUndefined()
  })
})

describe('passwordField', () => {
  it('accepts valid password with uppercase, lowercase, and number', () => {
    expect(passwordField.parse('Abc12345')).toBeTruthy()
  })

  it('rejects password shorter than 8 characters', () => {
    expect(() => passwordField.parse('Ab1')).toThrow()
  })

  it('rejects password without uppercase', () => {
    expect(() => passwordField.parse('abc12345')).toThrow()
  })

  it('rejects password without lowercase', () => {
    expect(() => passwordField.parse('ABC12345')).toThrow()
  })

  it('rejects password without number', () => {
    expect(() => passwordField.parse('Abcdefgh')).toThrow()
  })
})

describe('loginPasswordField', () => {
  it('accepts any non-empty string', () => {
    expect(loginPasswordField.parse('a')).toBe('a')
  })

  it('rejects empty string', () => {
    expect(() => loginPasswordField.parse('')).toThrow()
  })
})

describe('usernameField', () => {
  it('accepts valid alphanumeric username', () => {
    expect(usernameField.parse('Admin_User.1')).toBe('admin_user.1')
  })

  it('rejects username shorter than 3 characters', () => {
    expect(() => usernameField.parse('ab')).toThrow()
  })

  it('rejects username with special characters', () => {
    expect(() => usernameField.parse('user@name')).toThrow()
  })
})

describe('numberField', () => {
  it('creates schema with no constraints', () => {
    expect(numberField().parse(42)).toBe(42)
  })

  it('creates schema with min constraint', () => {
    expect(() => numberField(10).parse(5)).toThrow()
  })

  it('creates schema with max constraint', () => {
    expect(() => numberField(undefined, 10).parse(15)).toThrow()
  })
})

describe('integerField', () => {
  it('rejects non-integer', () => {
    expect(() => integerField().parse(3.5)).toThrow()
  })
})

describe('positiveIntField', () => {
  it('rejects zero', () => {
    expect(() => positiveIntField().parse(0)).toThrow()
  })

  it('accepts positive integer', () => {
    expect(positiveIntField().parse(1)).toBe(1)
  })
})

describe('dateField', () => {
  it('parses valid date string', () => {
    const result = dateField.parse('2024-01-15')
    expect(result).toBeInstanceOf(Date)
  })

  it('rejects invalid date', () => {
    expect(() => dateField.parse('not-a-date')).toThrow()
  })
})

describe('optionalDateField', () => {
  it('accepts undefined', () => {
    expect(optionalDateField.parse(undefined)).toBeUndefined()
  })
})

describe('booleanField', () => {
  it('accepts true', () => {
    expect(booleanField.parse(true)).toBe(true)
  })

  it('rejects non-boolean', () => {
    expect(() => booleanField.parse('true')).toThrow()
  })
})

describe('uuidField', () => {
  it('accepts valid UUID', () => {
    expect(uuidField.parse('550e8400-e29b-41d4-a716-446655440000')).toBeTruthy()
  })

  it('rejects invalid UUID', () => {
    expect(() => uuidField.parse('not-a-uuid')).toThrow()
  })
})

describe('optionalUuidField', () => {
  it('accepts undefined', () => {
    expect(optionalUuidField.parse(undefined)).toBeUndefined()
  })
})

describe('paginationSchema', () => {
  it('uses defaults', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(0)
    expect(result.size).toBe(20)
    expect(result.sortDir).toBe('ASC')
  })

  it('rejects negative page', () => {
    expect(() => paginationSchema.parse({ page: -1 })).toThrow()
  })

  it('rejects size over 100', () => {
    expect(() => paginationSchema.parse({ size: 101 })).toThrow()
  })
})

describe('dateRangeSchema', () => {
  it('accepts valid range', () => {
    const result = dateRangeSchema.parse({ startDate: '2024-01-01', endDate: '2024-12-31' })
    expect(result.startDate).toBeInstanceOf(Date)
    expect(result.endDate).toBeInstanceOf(Date)
  })

  it('rejects when startDate > endDate', () => {
    expect(() =>
      dateRangeSchema.parse({ startDate: '2024-12-31', endDate: '2024-01-01' }),
    ).toThrow()
  })
})
