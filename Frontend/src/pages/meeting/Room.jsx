import { useEffect, useRef, useState } from 'react'
import Brand from '../../components/Brand'
import ChatPanel from '../../components/ChatPanel'
import VideoTile from '../../components/VideoTile'
import GamePanel from '../../games/GamePanel'


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
      <button className={media.micOn ? '' : 'off'} onClick={media.toggleMic} disabled={!media.hasAudio}>{media.micOn ? '◉' : '⌁'} <span>{media.micOn ? 'Mute' : 'Unmute'}</span></button>
      <button className={media.cameraOn ? '' : 'off'} onClick={media.toggleCamera} disabled={!media.hasVideo}>{media.cameraOn ? '▣' : '□'} <span>{media.cameraOn ? 'Camera' : 'Camera off'}</span></button>
      {screen.supported && <button className={screen.sharing ? 'active-control' : ''} onClick={async () => { if (screen.sharing) screen.stop(); else if (!(await screen.start())) setNotice('Screen sharing was cancelled.') }}>▤ <span>{screen.sharing ? 'Stop share' : 'Share screen'}</span></button>}
      <button className={gamesOpen ? 'active-control' : ''} onClick={() => togglePanel('games')}>🎲 <span>Games</span>{gameInvite && !gamesOpen && <b className="unread-badge" aria-label="Game invite">!</b>}</button>
      <button className={chatOpen ? 'active-control' : ''} onClick={() => togglePanel('chat')}>☷ <span>Chat</span>{unread > 0 && <b className="unread-badge" aria-label={`${unread} unread`}>{unread}</b>}</button>
      <button onClick={copyLink}>↗ <span>Invite</span></button>
      <button className="off" onClick={onLeave}>✕ <span>Leave</span></button>
    </nav>
    {chatOpen && <ChatPanel messages={meeting.messages} selfId={meeting.selfId} onSend={meeting.sendMessage} onClose={() => setPanel(null)} />}
    {gamesOpen && <GamePanel game={game} selfId={selfId} onAction={meeting.gameAction} onClose={() => setPanel(null)} onNotice={setNotice} />}
    <div className={`meeting-notice${notice ? ' visible' : ''}`} role="status">{notice}</div>
  </main>
}
