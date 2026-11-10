import { useEffect, useRef, useState } from 'react'
import Brand from '../../components/Brand'
import ChatPanel from '../../components/ChatPanel'
import VideoTile from '../../components/VideoTile'
import GamePanel from '../../games/GamePanel'

// Line icons for the control bar (one consistent set instead of mixed text symbols).
const ICONS = {
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  micOff: <><path d="M3 3l18 18M9 9v2a3 3 0 0 0 5.1 2.1M15 9.3V6a3 3 0 0 0-5.7-1.3" /><path d="M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.6 2.8M12 18v3" /></>,
  cam: <><rect x="2" y="6" width="14" height="12" rx="2.5" /><path d="M16 10.5l6-3.5v10l-6-3.5" /></>,
  camOff: <><path d="M3 3l18 18M16 16v.5A1.5 1.5 0 0 1 14.5 18H4.5A2.5 2.5 0 0 1 2 15.5v-7A2.5 2.5 0 0 1 4.5 6H6M10 6h4.5A1.5 1.5 0 0 1 16 7.5v3l6-3.5v10" /></>,
  screen: <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4M9 10.5l3-3 3 3M12 7.5V14" /></>,
  games: <><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 10.5v4M5 12.5h4" /><circle cx="15.5" cy="11.5" r="1" /><circle cx="18" cy="14" r="1" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />,
  invite: <><path d="M10 14a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.2 1.2" /><path d="M14 10a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.2-1.2" /></>,
  leave: <path d="M3 15.5c5.1-4.7 12.9-4.7 18 0l-2.4 2.7-3.7-1.6v-3a12 12 0 0 0-5.8 0v3l-3.7 1.6z" />,
}
const Icon = ({ name }) => <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>

export default function Room({ user, roomCode, media, meeting, screen, onLeave }) {
  // Chat and games share the right-hand side, so only one is open at a time.
  const [panel, setPanel] = useState(null)
  const chatOpen = panel === 'chat'
  const gamesOpen = panel === 'games'
  const togglePanel = (name) => setPanel((current) => (current === name ? null : name))
  const [notice, setNotice] = useState('')
  const [readCount, setReadCount] = useState(0)
  const unread = chatOpen ? 0 : meeting.messages.length - readCount

  useEffect(() => {
    if (chatOpen) setReadCount(meeting.messages.length)
  }, [chatOpen, meeting.messages.length])
  const peers = Object.values(meeting.peers)
  const knownPeers = useRef(new Map())
  const { game, selfId } = meeting
  const gamePhase = game?.phase
  const amPlaying = Boolean(game?.players.some((player) => player.id === selfId))
  // A game waiting for players that I haven't joined yet.
  const gameInvite = gamePhase === 'lobby' && !amPlaying
  const previousPhase = useRef(gamePhase)

  // Tell people when someone opens a game, and bring the board up for players when it starts.
  useEffect(() => {
    const before = previousPhase.current
    previousPhase.current = gamePhase
    if (gamePhase === before || !game) return
    if (gamePhase === 'lobby' && game.hostId !== selfId) {
      const host = game.players.find((player) => player.id === game.hostId)?.name || 'Someone'
      setNotice(`${host} wants to play ${game.name}. Open Games to join.`)
    } else if (gamePhase === 'playing' && amPlaying) {
      setPanel('games')
    }
  }, [gamePhase, game, selfId, amPlaying])

  // Announce arrivals and departures by name; the call itself updates silently.
  useEffect(() => {
    const previous = knownPeers.current
    const current = new Map(peers.map((peer) => [peer.id, peer.name]))
    const joinedName = [...current].find(([id]) => !previous.has(id))?.[1]
    const leftName = [...previous].find(([id]) => !current.has(id))?.[1]
    knownPeers.current = current
    if (meeting.status !== 'joined') return
    if (joinedName) setNotice(`${joinedName} joined.`)
    else if (leftName) setNotice(`${leftName} left.`)
  }, [peers, meeting.status])

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

  return <main className={`meeting-room${gamesOpen ? ' games-open' : ''}`}>
    <header className="meeting-header"><a className="brand" href="#home"><Brand /><span>Meetly</span></a><span className="room-label">Room {roomCode}</span><button className="leave-button" onClick={onLeave}>Leave room</button></header>
    {meeting.status === 'reconnecting' && <div className="connection-banner" role="status">Connection lost. Reconnecting…</div>}
    <section className={`meeting-stage people-${Math.min(peers.length + 1, 6)}`}>
      {screen.sharing
        ? <VideoTile stream={screen.screenStream} name={user.name} label="You · Sharing" muted showVideo micOn={media.micOn} />
        : <VideoTile stream={media.stream} name={user.name} label="You" muted mirrored showVideo={media.cameraOn} micOn={media.micOn} />}
      {peers.map((peer) => <VideoTile key={peer.id} stream={peer.stream} name={peer.name} label={peer.connection === 'failed' ? 'Connection failed' : peer.media.screen ? 'Sharing' : ''} showVideo={peer.media.video || peer.media.screen} micOn={peer.media.audio} />)}
      {peers.length === 0 && <div className="stage-empty">
        <h1>You are the only one here</h1>
        <p>Share the room link to bring your team in.</p>
        <button className="button button-primary" onClick={copyLink}>Copy room link <span>↗</span></button>
      </div>}
    </section>
    <nav className="meeting-controls" aria-label="Meeting controls">
      <button className={media.micOn ? '' : 'off'} onClick={media.toggleMic} disabled={!media.hasAudio} aria-pressed={!media.micOn}><Icon name={media.micOn ? 'mic' : 'micOff'} /><span>{media.micOn ? 'Mute' : 'Unmute'}</span></button>
      <button className={media.cameraOn ? '' : 'off'} onClick={media.toggleCamera} disabled={!media.hasVideo} aria-pressed={!media.cameraOn}><Icon name={media.cameraOn ? 'cam' : 'camOff'} /><span>{media.cameraOn ? 'Stop video' : 'Start video'}</span></button>
      {screen.supported && <button className={screen.sharing ? 'active-control' : ''} onClick={async () => { if (screen.sharing) screen.stop(); else if (!(await screen.start())) setNotice('Screen sharing was cancelled.') }}><Icon name="screen" /><span>{screen.sharing ? 'Stop share' : 'Share'}</span></button>}
      <button className={gamesOpen ? 'active-control' : ''} onClick={() => togglePanel('games')} aria-expanded={gamesOpen}><Icon name="games" /><span>Games</span>{gameInvite && !gamesOpen && <b className="unread-badge" aria-label="Game invite">!</b>}</button>
      <button className={chatOpen ? 'active-control' : ''} onClick={() => togglePanel('chat')} aria-expanded={chatOpen}><Icon name="chat" /><span>Chat</span>{unread > 0 && <b className="unread-badge" aria-label={`${unread} unread`}>{unread}</b>}</button>
      <button onClick={copyLink}><Icon name="invite" /><span>Invite</span></button>
      <i className="control-divider" aria-hidden="true" />
      <button className="leave-control" onClick={onLeave}><Icon name="leave" /><span>Leave</span></button>
    </nav>
    {chatOpen && <ChatPanel messages={meeting.messages} selfId={meeting.selfId} onSend={meeting.sendMessage} onClose={() => setPanel(null)} />}
    {gamesOpen && <GamePanel game={game} selfId={selfId} onAction={meeting.gameAction} onClose={() => setPanel(null)} onNotice={setNotice} />}
    <div className={`meeting-notice${notice ? ' visible' : ''}`} role="status">{notice}</div>
  </main>
}
