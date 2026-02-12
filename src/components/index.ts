/**
 * Components Barrel Export
 *
 * Re-exports all components from subfolders.
 * Import as: import { Button, MainLayout, LanguageSwitcher } from '@/components'
 */

// UI Components (shadcn/ui primitives)
export * from './ui'

// Layout Components
export * from './layouts'

// Common Components
export * from './common'

// Filter Components
export * from './filters'

// Standalone Components
export { ErrorBoundary } from './ErrorBoundary'
export { ThemeProvider } from './ThemeProvider'
export { default as CommandPalette } from './CommandPalette'
