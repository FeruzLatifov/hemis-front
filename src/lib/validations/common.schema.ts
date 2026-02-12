/**
 * Common Zod Validation Schemas
 *
 * Reusable validation schemas for forms across the application.
 * Error messages use translation keys - actual text comes from backend i18n.
 */

import { z } from 'zod'
import { sanitizeInput, sanitizeEmail, sanitizePhone, sanitizeUrl } from '@/utils/sanitize.util'

// ============================================
// BASE FIELD SCHEMAS
// ============================================

/**
 * Required string field with sanitization
 */
export const requiredString = (minLength = 1, maxLength = 255) =>
  z.string().min(minLength).max(maxLength).transform(sanitizeInput)

/**
 * Optional string field with sanitization
 */
export const optionalString = (maxLength = 255) =>
  z
    .string()
    .max(maxLength)
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : undefined))

/**
 * Email field with validation and sanitization
 */
export const emailField = z.string().email().transform(sanitizeEmail)

/**
 * Optional email field
 */
export const optionalEmailField = z
  .string()
  .email()
  .optional()
  .transform((val) => (val ? sanitizeEmail(val) : undefined))

/**
 * Phone number field (Uzbekistan format)
 */
export const phoneField = z
  .string()
  .transform(sanitizePhone)
  .refine((val) => /^\+?998\d{9}$/.test(val))

/**
 * Optional phone field
 */
export const optionalPhoneField = z
  .string()
  .optional()
  .transform((val) => (val ? sanitizePhone(val) : undefined))
  .refine((val) => !val || /^\+?998\d{9}$/.test(val))

/**
 * URL field with validation
 */
export const urlField = z
  .string()
  .url()
  .transform(sanitizeUrl)
  .refine((val) => val.length > 0)

/**
 * Optional URL field
 */
export const optionalUrlField = z
  .string()
  .url()
  .optional()
  .transform((val) => (val ? sanitizeUrl(val) : undefined))

/**
 * Password field with strength requirements
 */
export const passwordField = z
  .string()
  .min(8)
  .max(128)
  .refine((val) => /[A-Z]/.test(val))
  .refine((val) => /[a-z]/.test(val))
  .refine((val) => /[0-9]/.test(val))

/**
 * Simple password field (for login - no strength check)
 */
export const loginPasswordField = z.string().min(1)

/**
 * Username field
 */
export const usernameField = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_.-]+$/)
  .transform((val) => val.trim().toLowerCase())

/**
 * Number field with range validation
 */
export const numberField = (min?: number, max?: number) => {
  let schema = z.number()

  if (min !== undefined) {
    schema = schema.min(min)
  }

  if (max !== undefined) {
    schema = schema.max(max)
  }

  return schema
}

/**
 * Integer field
 */
export const integerField = (min?: number, max?: number) => numberField(min, max).int()

/**
 * Positive integer field (for IDs, counts, etc.)
 */
export const positiveIntField = () => integerField(1).positive()

/**
 * Date field
 */
export const dateField = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)))
  .transform((val) => new Date(val))

/**
 * Optional date field
 */
export const optionalDateField = z
  .string()
  .optional()
  .refine((val) => !val || !isNaN(Date.parse(val)))
  .transform((val) => (val ? new Date(val) : undefined))

/**
 * Boolean field
 */
export const booleanField = z.boolean()

/**
 * UUID field
 */
export const uuidField = z.string().uuid()

/**
 * Optional UUID field
 */
export const optionalUuidField = z.string().uuid().optional()

// ============================================
// COMPOSITE SCHEMAS
// ============================================

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDir: z.enum(['ASC', 'DESC']).default('ASC'),
})

/**
 * Search params schema
 */
export const searchParamsSchema = z.object({
  search: optionalString(200),
  ...paginationSchema.shape,
})

/**
 * Date range schema
 */
export const dateRangeSchema = z
  .object({
    startDate: dateField,
    endDate: dateField,
  })
  .refine((data) => data.startDate <= data.endDate)

// ============================================
// TYPE EXPORTS
// ============================================

export type PaginationParams = z.infer<typeof paginationSchema>
export type SearchParams = z.infer<typeof searchParamsSchema>
export type DateRange = z.infer<typeof dateRangeSchema>
