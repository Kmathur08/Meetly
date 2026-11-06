import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import { isLandingRoute, readRoute } from './hooks/useHashRoute'

const container = document.getElementById('root')
const app = <StrictMode><App /></StrictMode>

// The production build ships the landing page pre-rendered (for search engines and AI crawlers).
// Reuse that markup instead of repainting it; any other route starts from an empty root.
if (container.hasChildNodes() && isLandingRoute(readRoute())) {
  hydrateRoot(container, app)
} else {
  container.textContent = ''
  createRoot(container).render(app)
}
