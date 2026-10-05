import { useEffect, useState } from 'react'

const readRoute = () => window.location.hash.slice(1) || 'top'

export default function useHashRoute() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}
