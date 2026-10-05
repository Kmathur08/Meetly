import LandingPage from './pages/landing'
import Authentication from './pages/authentication'
import VideoMeet from './pages/VideoMeet'
import Home from './pages/Home'
import useHashRoute from './hooks/useHashRoute'
import './styles.css'

export default function App() {
  const route = useHashRoute()

  if (route === 'home' || route === 'history') return <Home />
  // Keyed by route so switching rooms starts a fresh call instead of reusing the old one.
  if (route === 'meet' || route.startsWith('meet/')) return <VideoMeet key={route} />
  if (route === 'signin' || route === 'signup' || route === 'forgot-password') {
    return <Authentication key={route} initialMode={route} />
  }
  return <LandingPage />
}
