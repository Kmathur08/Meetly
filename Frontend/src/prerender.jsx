// Built by scripts/prerender.mjs with Vite's SSR mode; never shipped to the browser.
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import LandingPage from './pages/landing'
import { APP_ROUTES } from './hooks/useHashRoute'
import { DEFINITION, FACTS, FAQ, HOW_IT_WORKS, SITE, USE_CASES } from './content/site'

export { APP_ROUTES, DEFINITION, FACTS, FAQ, HOW_IT_WORKS, SITE, USE_CASES }

export const renderLanding = () => renderToString(<StrictMode><LandingPage /></StrictMode>)
