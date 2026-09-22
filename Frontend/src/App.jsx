import { useEffect, useState } from 'react'
import LandingPage from './pages/landing'
import Authentication from './pages/authentication'
import './styles.css'

export default function App() {
  const [route, setRoute] = useState(window.location.hash.replace('#', ''))

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash.replace('#', ''))
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route === 'signin' || route === 'signup' || route === 'forgot-password'
    ? <Authentication initialMode={route} />
    : <LandingPage />
}