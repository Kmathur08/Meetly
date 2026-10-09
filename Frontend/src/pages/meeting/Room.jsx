import { useEffect, useState } from 'react'
import Brand from '../../components/Brand'
import ChatPanel from '../../components/ChatPanel'
import VideoTile from '../../components/VideoTile'
import useScreenShare from '../../hooks/useScreenShare'

export default function Room({ user, roomCode, media, meeting, onLeave }) {
  const screen = useScreenShare(meeting.setScreenTrack)
  const [chatOpen, setChatOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const peers = Object.values(meeting.peers)

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#meet/${roomCode}`)
      setNotice('Invite link copied.')
    } catch {
      setNotice(`Share this code: ${roomCode}`)
    }
  }

  return <main className="meeting-room">
    <header className="meeting-header"><a className="brand" href="#home"><Brand /><span>Meetly</span></a><span className="room-label">Room {roomCode}</span><button className="leave-button" onClick={onLeave}>Leave room</button></header>
    <section className={`meeting-stage people-${Math.min(peers.length + 1, 6)}`}>
      {screen.sharing
        ? <VideoTile stream={screen.screenStream} name={user.name} label="You Â· Sharing" muted showVideo micOn={media.micOn} />
        : <VideoTile stream={media.stream} name={user.name} label="You" muted mirrored showVideo={media.cameraOn} micOn={media.micOn} />}
      {peers.map((peer) => <VideoTile key={peer.id} stream={peer.stream} name={peer.name} showVideo={peer.media.video || peer.media.screen} micOn={peer.media.audio} />)}
      {peers.length === 0 && <div className="stage-empty">
        <h1>You are the only one here</h1>
        <p>Share the room link to bring your team in.</p>
        <button className="button button-primary" onClick={copyLink}>Copy room link <span>↗</span></button>
      </div>}
    </section>
    <nav className="meeting-controls" aria-label="Meeting controls">
      <button className={media.micOn ? '' : 'off'} onClick={media.toggleMic} disabled={!media.hasAudio}>{media.micOn ? '◉' : '⌁'} <span>{media.micOn ? 'Mute' : 'Unmute'}</span></button>
      <button className={media.cameraOn ? '' : 'off'} onClick={media.toggleCamera} disabled={!media.hasVideo}>{media.cameraOn ? '▣' : '□'} <span>{media.cameraOn ? 'Camera' : 'Camera off'}</span></button>
      {screen.supported && <button className={screen.sharing ? 'active-control' : ''} onClick={async () => { if (screen.sharing) screen.stop(); else if (!(await screen.start())) setNotice('Screen sharing was cancelled.') }}>â–¤ <span>{screen.sharing ? 'Stop share' : 'Share screen'}</span></button>}
      <button className={chatOpen ? 'active-control' : ''} onClick={() => setChatOpen(!chatOpen)}>☷ <span>Chat{meeting.messages.length ? ` (${meeting.messages.length})` : ''}</span></button>
      <button onClick={copyLink}>↗ <span>Invite</span></button>
      <button className="off" onClick={onLeave}>✕ <span>Leave</span></button>
    </nav>
    {chatOpen && <ChatPanel messages={meeting.messages} selfId={meeting.selfId} onSend={meeting.sendMessage} onClose={() => setChatOpen(false)} />}
    <div className={`meeting-notice${notice ? ' visible' : ''}`} role="status">{notice}</div>
  </main>
}
