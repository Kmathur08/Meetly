import { useEffect, useState } from 'react'

const featureCards = [
  ['≋', 'HD Video & Spatial Audio', 'Studio-quality 1080p60 video paired with neural noise suppression and acoustic echo isolation.', '✓ Dolby-grade spatial engine'],
  ['▧', 'One-Click Screen Sharing', 'Stream browser tabs, standalone apps, or multi-monitor presentations at 60fps.', 'ϟ Optimized for 60fps review'],
  ['☷', 'Real-Time In-Meeting Chat', 'Live threaded conversations, emoji reactions, code previews, and easy file exchange.', 'ϟ Instant drag-and-drop files'],
  ['⌑', 'Secure Meeting Rooms', 'End-to-end encryption, waiting rooms, passcode locks, and host-level permissions by default.', '✓ SOC2 Type II & HIPAA ready'],
]

function Brand() {
  return <span className="brand-mark"><i /><i /><i /></span>
}

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

  const startMeeting = () => { window.location.hash = 'meet' }
  const joinMeeting = (event) => {
    event.preventDefault()
    showToast(meetingCode.trim() ? `Joining room ${meetingCode.trim()}...` : 'Enter a meeting code or link first.')
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
        <a className="announcement" href="#features"><span className="pulse-dot" /><span>Meetly 2.0 is live · Crystal-clear HD video with zero downloads</span><span className="arrow">→</span></a>
        <h1>Meet without <em>limits.</em></h1>
        <p className="hero-copy">Effortless, ultra-low-latency video meetings built for fast-moving teams. Real-time AI transcription, spatial audio, and one-click browser access.</p>
        <div className="hero-actions" id="start"><button className="button button-primary" onClick={startMeeting}>Start a free meeting <span>→</span></button><form className="join-form" onSubmit={joinMeeting}><span className="keyboard-icon">⌘</span><input aria-label="Meeting code or link" placeholder="Enter meeting code or link" value={meetingCode} onChange={(event) => setMeetingCode(event.target.value)} /><button type="submit">Join</button></form></div>
        <div className="trust-row"><span>✓ No credit card required</span><b>·</b><span>◷ Free up to 45 mins</span><b>·</b><span>ϟ Instant browser setup</span></div>
      </section>

      <section className="metrics"><div className="section-shell metric-grid"><div><strong>99.99%</strong><h3>Uptime SLA Guaranteed</h3><p>Global data centers keep crucial client connections moving.</p></div><div><strong>&lt; 40ms</strong><h3>Ultra-Low Latency</h3><p>Edge-routed WebRTC delivery creates lifelike conversations.</p></div><div><strong>Zero Install</strong><h3>Native In-Browser Simplicity</h3><p>Open the link and go live without apps or extensions.</p></div></div></section>

      <section className="features section-shell" id="features"><div className="section-heading"><span className="eyebrow">ENGINEERED FOR ACCURACY</span><h2>Everything high-performing teams demand</h2><p>Stripped of legacy enterprise clutter. Built strictly for clarity, speed, and real-time synchronicity.</p></div><div className="feature-grid">{featureCards.map(([icon, title, description, footer]) => <article key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{description}</p><footer><span>{footer}</span><b>→</b></footer></article>)}</div></section>

      <section className="cta section-shell" id="about"><div><span className="eyebrow">BUILT FOR THE WAY TEAMS WORK NOW</span><h2>Ready to connect without boundaries?</h2><p>Jump into your first high-definition meeting in under 10 seconds. No setup fees, no software installations required.</p><div className="cta-actions"><button className="button button-light" onClick={startMeeting}>Start a free meeting <span>→</span></button><a href="#pricing">Schedule for later →</a></div></div></section>
    </main>
    <footer><div className="footer-inner"><a className="brand" href="#top"><Brand /><span>Meetly</span></a><nav><a href="#features">Features</a><a href="#solutions">Solutions</a><a href="#pricing">Pricing</a><a href="#about">About</a><a href="#privacy">Privacy</a><a href="#terms">Terms</a></nav></div><p>© 2024 Meetly, Inc. All rights reserved. Atmospheric, high-performance teleconferencing built for collaborative teams.</p></footer>
    <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
  </>
}
