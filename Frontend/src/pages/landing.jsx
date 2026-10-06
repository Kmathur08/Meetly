import { useEffect, useState } from 'react'
import Brand from '../components/Brand'
import { createRoomCode, parseRoomCode } from '../lib/roomCode'

const featureCards = [
  ['≋', 'Video & Audio in the Browser', 'Peer-to-peer WebRTC calls for up to six people, with echo cancellation and noise suppression from your browser.', '✓ No downloads or plugins'],
  ['▧', 'One-Click Screen Sharing', 'Share a tab, a window or your whole screen with everyone in the room, then switch back to your camera.', 'ϟ Works in Chrome, Edge and Firefox'],
  ['☷', 'Real-Time In-Meeting Chat', 'Send messages to the room while you talk. People who join late see the recent conversation.', 'ϟ Delivered instantly'],
  ['⌑', 'Private Meeting Rooms', 'Rooms use hard-to-guess codes and only signed-in members can join. Media flows directly between participants.', '✓ Encrypted in transit (DTLS-SRTP)'],
]

export default function LandingPage() {
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [meetingCode, setMeetingCode] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = (message) => setToast(message)
  const toggleDevice = (device, enabled, setEnabled) => {
    const nextState = !enabled
    setEnabled(nextState)
    showToast(`${device} ${nextState ? 'on' : 'off'}.`)
  }

  // The meeting page asks for sign-in when needed and comes back here afterwards.
  const startMeeting = () => { window.location.hash = `meet/${createRoomCode()}` }
  const joinMeeting = (event) => {
    event.preventDefault()
    const code = parseRoomCode(meetingCode)
    if (!code) return showToast(meetingCode.trim() ? 'That meeting code or link doesn\'t look right.' : 'Enter a meeting code or link first.')
    window.location.hash = `meet/${code}`
  }

  return <>
    <header className="site-header">
      <div className="nav-shell">
        <a className="brand" href="#top" aria-label="Meetly home"><Brand /><span>Meetly</span></a>
        <nav className={`desktop-nav${menuOpen ? ' mobile-open' : ''}`} aria-label="Primary navigation">
          <a className="active" href="#features" onClick={() => setMenuOpen(false)}>Features</a><a href="#solutions" onClick={() => setMenuOpen(false)}>Solutions</a><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a><a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <div className="nav-actions"><a className="sign-in" href="#signin">Sign in</a><a className="button button-primary button-small" href="#signup">Get started free</a><button className="avatar" aria-label="Open profile"><span>MK</span></button></div>
        <button className="menu-toggle" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </div>
    </header>

    <main id="top">
      <section className="hero section-shell">
        <div className="glow" />
        <a className="announcement" href="#features"><span className="pulse-dot" /><span>Video calls, screen sharing and chat · Zero downloads</span><span className="arrow">→</span></a>
        <h1>Meet without <em>limits.</em></h1>
        <p className="hero-copy">Simple video meetings for small teams. Start a room, share the link, and talk face to face right in your browser.</p>
        <div className="hero-actions" id="start"><button className="button button-primary" onClick={startMeeting}>Start a free meeting <span>→</span></button><form className="join-form" onSubmit={joinMeeting}><span className="keyboard-icon">⌘</span><input aria-label="Meeting code or link" placeholder="Enter meeting code or link" value={meetingCode} onChange={(event) => setMeetingCode(event.target.value)} /><button type="submit">Join</button></form></div>
        <div className="trust-row"><span>✓ No credit card required</span><b>·</b><span>◷ Up to 6 people per room</span><b>·</b><span>ϟ Instant browser setup</span></div>
      </section>

      <section className="metrics"><div className="section-shell metric-grid"><div><strong>Peer-to-peer</strong><h3>Direct Connections</h3><p>Video and audio go straight between participants instead of through a media server.</p></div><div><strong>WebRTC</strong><h3>Built on Open Standards</h3><p>The same browser technology behind most modern video calling.</p></div><div><strong>Zero Install</strong><h3>Native In-Browser Simplicity</h3><p>Open the link and go live without apps or extensions.</p></div></div></section>

      <section className="features section-shell" id="features"><div className="section-heading"><span className="eyebrow">ENGINEERED FOR ACCURACY</span><h2>Everything high-performing teams demand</h2><p>Stripped of legacy enterprise clutter. Built strictly for clarity, speed, and real-time synchronicity.</p></div><div className="feature-grid">{featureCards.map(([icon, title, description, footer]) => <article key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{description}</p><footer><span>{footer}</span><b>→</b></footer></article>)}</div></section>

      <section className="cta section-shell" id="about"><div><span className="eyebrow">BUILT FOR THE WAY TEAMS WORK NOW</span><h2>Ready to connect without boundaries?</h2><p>Create a free account, start a room and share the link. No software to install.</p><div className="cta-actions"><button className="button button-light" onClick={startMeeting}>Start a free meeting <span>→</span></button><a href="#pricing">Schedule for later →</a></div></div></section>
    </main>
    <footer><div className="footer-inner"><a className="brand" href="#top"><Brand /><span>Meetly</span></a><nav><a href="#features">Features</a><a href="#solutions">Solutions</a><a href="#pricing">Pricing</a><a href="#about">About</a><a href="#privacy">Privacy</a><a href="#terms">Terms</a></nav></div><p>© 2026 Meetly. Video meetings built for small, collaborative teams.</p></footer>
    <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
  </>
}
