import { useEffect, useState } from 'react'
import { withAuthGuard } from '../utils/authGuard'
import './home.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/users'

function Brand() {
  return <span className="brand-mark"><i /><i /><i /></span>
}

function Home({ user }) {
  const [meetings, setMeetings] = useState([])
  const [meetingCode, setMeetingCode] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/get_all_activity`, { headers: { Authorization: `Bearer ${localStorage.getItem('meetly_token')}` } })
      .then((response) => response.ok ? response.json() : { meetings: [] })
      .then((data) => setMeetings(data.meetings || []))
  }, [])

  const startMeeting = async () => {
    const code = meetingCode.trim() || Math.random().toString(36).slice(2, 8)
    await fetch(`${API_URL}/add_to_activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('meetly_token')}` },
      body: JSON.stringify({ meetingcode: code }),
    })
    window.location.hash = `meet/${code}`
  }

  const signOut = () => {
    localStorage.removeItem('meetly_token')
    window.location.hash = 'top'
  }

  return <main className="home-page">
    <header className="home-header"><a className="brand" href="#home"><Brand /><span>Meetly</span></a><nav><a className="home-active" href="#home">Workspace</a><a href="#history">History</a></nav><div className="home-user"><span>{user.name}</span><button onClick={signOut}>Sign out</button></div></header>
    <section className="home-content">
      <div className="home-welcome"><span className="eyebrow">YOUR WORKSPACE</span><h1>Good to see you,<br /><em>{user.name.split(' ')[0]}.</em></h1><p>Start a focused room or return to a conversation from your recent history.</p></div>
      <div className="home-actions"><label>Start or join a room<input value={meetingCode} onChange={(event) => setMeetingCode(event.target.value)} placeholder="Enter a meeting code" /></label><button className="button button-primary" onClick={startMeeting}>Enter meeting <span>→</span></button></div>
      <section className="history-section" id="history"><div className="section-heading compact"><div><span className="eyebrow">RECENT ROOMS</span><h2>Meeting history</h2></div><a href="#history">View all →</a></div>{meetings.length === 0 ? <div className="history-empty">Your recent rooms will appear here.</div> : <div className="history-list">{meetings.map((meeting) => <a className="history-row" href={`#meet/${meeting.meetingcode}`} key={meeting._id}><span className="history-icon">↗</span><span><strong>{meeting.meetingcode}</strong><small>{new Date(meeting.date).toLocaleString()}</small></span><b>Join room →</b></a>)}</div>}</section>
    </section>
  </main>
}

export default withAuthGuard(Home)