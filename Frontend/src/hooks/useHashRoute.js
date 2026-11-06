import { useEffect, useState } from 'react'

export const readRoute = () => window.location.hash.slice(1) || 'top'

// Routes that show the signed-in app; every other hash (#top, #features, #faq…) is the landing page.
// Keep in step with App.jsx. The pre-rendered landing HTML is only reused for landing routes.
export const APP_ROUTES = ['home', 'history', 'meet', 'signin', 'signup', 'forgot-password']
export const isLandingRoute = (route) => !APP_ROUTES.some((name) => route === name || route.startsWith(`${name}/`))

export default function useHashRoute() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}
