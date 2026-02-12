/**
 * Validation Schemas Barrel Export
 *
 * Import as: import { loginSchema, requiredString } from '@/lib/validations'
 */

// Common field schemas
export {
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
  searchParamsSchema,
  dateRangeSchema,
  type PaginationParams,
  type SearchParams,
  type DateRange,
} from './common.schema'

// Auth schemas
export {
  loginSchema,
  registrationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  type LoginFormData,
  type RegistrationFormData,
  type PasswordResetRequestFormData,
  type PasswordResetFormData,
  type ChangePasswordFormData,
} from './auth.schema'
