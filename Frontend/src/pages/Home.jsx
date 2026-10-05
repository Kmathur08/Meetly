import { useEffect, useState } from 'react'
import { withAuthGuard } from '../utils/authGuard'
import './home.css'
import Brand from '../components/Brand'
import { api, clearToken } from '../lib/api'
import { createRoomCode, parseRoomCode } from '../lib/roomCode'

function Home({ user }) {
  const [meetings, setMeetings] = useState([])
  const [meetingCode, setMeetingCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api('get_all_activity')
      .then((data) => setMeetings(data.meetings || []))
      .catch(() => setMeetings([]))
  }, [])

  // The meeting page records the visit itself, so this only navigates.
  const startMeeting = () => {
    if (meetingCode.trim() && !parseRoomCode(meetingCode)) return setError('That meeting code or link doesn\'t look right.')
    window.location.hash = `meet/${parseRoomCode(meetingCode) || createRoomCode()}`
  }

  const signOut = async () => {
    await api('logout', { method: 'POST' }).catch(() => {})
    clearToken()
    window.location.hash = 'top'
  }

  return <main className="home-page">
    <header className="home-header"><a className="brand" href="#home"><Brand /><span>Meetly</span></a><nav><a className="home-active" href="#home">Workspace</a><a href="#history">History</a></nav><div className="home-user"><span>{user.name}</span><button onClick={signOut}>Sign out</button></div></header>
    <section className="home-content">
      <div className="home-welcome"><span className="eyebrow">YOUR WORKSPACE</span><h1>Good to see you,<br /><em>{user.name.split(' ')[0]}.</em></h1><p>Start a focused room or return to a conversation from your recent history.</p></div>
      <div className="home-actions"><label>Start or join a room<input value={meetingCode} onChange={(event) => { setMeetingCode(event.target.value); setError('') }} placeholder="Enter a code or paste a link" /></label>{error && <p className="home-error" role="alert">{error}</p>}<button className="button button-primary" onClick={startMeeting}>Enter meeting <span>→</span></button></div>
      <section className="history-section" id="history"><div className="section-heading compact"><div><span className="eyebrow">RECENT ROOMS</span><h2>Meeting history</h2></div><a href="#history">View all →</a></div>{meetings.length === 0 ? <div className="history-empty">Your recent rooms will appear here.</div> : <div className="history-list">{meetings.map((meeting) => <a className="history-row" href={`#meet/${meeting.meetingcode}`} key={meeting._id}><span className="history-icon">↗</span><span><strong>{meeting.meetingcode}</strong><small>{new Date(meeting.date).toLocaleString()}</small></span><b>Join room →</b></a>)}</div>}</section>
    </section>
  </main>
}

export default withAuthGuard(Home)