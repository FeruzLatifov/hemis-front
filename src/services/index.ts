/**
 * Services Layer
 *
 * Business logic uchun markazlashtirilgan qatlam.
 * Hooks va API o'rtasida joylashadi.
 *
 * Arxitektura:
 * Components → Hooks → Services → API → Backend
 *
 * Services nima qiladi:
 * - Business logic (validation, transformation)
 * - Multiple API calls orchestration
 * - Caching strategy decisions
 * - Error handling va recovery logic
 */

export * from './auth.service'
