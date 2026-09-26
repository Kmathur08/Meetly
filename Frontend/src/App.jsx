import { useEffect, useState } from 'react'
import LandingPage from './pages/landing'
import Authentication from './pages/authentication'
import VideoMeet from './pages/VideoMeet'
import Home from './pages/Home'
import './styles.css'

export default function App() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || 'top')

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash.slice(1) || 'top')
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (route === 'home' || route === 'history') return <Home />
  if (route.startsWith('meet')) return <VideoMeet />
  if (route === 'signin' || route === 'signup' || route === 'forgot-password') {
    return <Authentication initialMode={route} />
  }
  return <LandingPage />
}