import './env'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSentry } from './lib/sentry'
import { initWebVitals } from './lib/web-vitals'
import ErrorBoundary from './components/ErrorBoundary'

// ⭐ Initialize Sentry BEFORE React renders
initSentry()
// Forward LCP/INP/CLS/FCP/TTFB to Sentry as field RUM measurements.
// Must run after initSentry() so the breadcrumbs land on a live client.
initWebVitals()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
