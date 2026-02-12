/**
 * Authentication Validation Schemas
 *
 * Zod schemas for login, registration, and password reset forms.
 * Error messages come from backend i18n via t() function.
 */

import { z } from 'zod'
import { usernameField, loginPasswordField, passwordField, emailField } from './common.schema'

/**
 * Login form schema
 */
export const loginSchema = z.object({
  username: usernameField,
  password: loginPasswordField,
  locale: z.enum(['uz', 'oz', 'ru', 'en']).default('uz'),
})

/**
 * Registration form schema
 */
export const registrationSchema = z
  .object({
    username: usernameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    acceptTerms: z.literal(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
  })

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailField,
})

/**
 * Password reset schema
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
  })

/**
 * Change password schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: loginPasswordField,
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
  })

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>
export type RegistrationFormData = z.infer<typeof registrationSchema>
export type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
