import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './meeting.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/users'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080'

function Brand() {
  return <span className="brand-mark"><i /><i /><i /></span>
}

export default function VideoMeet() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const socketRef = useRef(null)
  const [name, setName] = useState('')
  const [room, setRoom] = useState(window.location.hash.split('/')[1] || '')
  const [joined, setJoined] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) return stream.getTracks().forEach((track) => track.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setNotice('Camera preview is unavailable. You can still join with audio off.'))
    return () => {
      active = false
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current?.getTracks().forEach((track) => track.stop())
      socketRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!joined) return undefined
    const socket = io(SOCKET_URL)
    socketRef.current = socket
    socket.emit('Accept-call', room.trim() || 'instant-meeting')
    socket.on('chat-message', (data, sender) => setMessages((current) => [...current, { data, sender }]))
    socket.on('user-joined', () => setNotice('A participant joined the room.'))
    socket.on('user-left', () => setNotice('A participant left the room.'))
    return () => socket.disconnect()
  }, [joined, room])

  const toggleTrack = (kind) => {
    const next = kind === 'video' ? !cameraOn : !micOn
    if (kind === 'video') setCameraOn(next)
    else setMicOn(next)
    streamRef.current?.getTracks().filter((track) => track.kind === kind).forEach((track) => { track.enabled = next })
  }

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop())
    screenStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = streamRef.current
    setSharing(false)
  }

  const toggleScreenShare = async () => {
    if (sharing) return stopScreenShare()
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = screenStream
      if (videoRef.current) videoRef.current.srcObject = screenStream
      setSharing(true)
      screenStream.getVideoTracks()[0].addEventListener('ended', stopScreenShare)
    } catch {
      setNotice('Screen sharing was cancelled or is unavailable in this browser.')
    }
  }

  const sendMessage = (event) => {
    event.preventDefault()
    if (!messageText.trim() || !socketRef.current) return
    socketRef.current.emit('chat-message', messageText.trim(), name.trim())
    setMessageText('')
  }

  const joinMeeting = async (event) => {
    event.preventDefault()
    if (!name.trim()) return setNotice('Add your name before entering the room.')
    const token = localStorage.getItem('meetly_token')
    if (token && room.trim()) fetch(`${API_URL}/add_to_activity`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ meetingcode: room.trim() }) })
    setJoined(true)
  }

  if (joined) return <main className="meeting-room"><header className="meeting-header"><a className="brand" href="#home"><Brand /><span>Meetly</span></a><span className="room-label">Room {room.trim() || 'instant-meeting'}</span><a className="leave-button" href="#home">Leave room</a></header><section className="meeting-stage"><div className="stage-empty"><span className="stage-avatar">{name.trim().slice(0, 2).toUpperCase()}</span><h1>{sharing ? 'You are sharing your screen' : 'You are the only one here'}</h1><p>{sharing ? 'Your shared screen is visible in the meeting preview.' : 'Share this room link to bring your team in.'}</p><button className="button button-primary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy room link <span>↗</span></button></div><div className="self-preview"><video ref={videoRef} autoPlay muted playsInline /><span>{name.trim()} · You{sharing ? ' · Sharing' : ''}</span></div></section><nav className="meeting-controls" aria-label="Meeting controls"><button className={micOn ? '' : 'off'} onClick={() => toggleTrack('audio')}>{micOn ? '◉' : '⌁'} <span>{micOn ? 'Mute' : 'Unmute'}</span></button><button className={cameraOn ? '' : 'off'} onClick={() => toggleTrack('video')}>{cameraOn ? '▣' : '□'} <span>{cameraOn ? 'Camera' : 'Camera off'}</span></button><button className={sharing ? 'active-control' : ''} onClick={toggleScreenShare}>▤ <span>{sharing ? 'Stop share' : 'Share screen'}</span></button><button className={chatOpen ? 'active-control' : ''} onClick={() => setChatOpen(!chatOpen)}>☷ <span>Chat{messages.length ? ` (${messages.length})` : ''}</span></button></nav>{chatOpen && <aside className="chat-panel"><div className="chat-heading"><strong>Room chat</strong><button onClick={() => setChatOpen(false)} aria-label="Close chat">×</button></div><div className="chat-messages">{messages.length === 0 ? <p className="chat-empty">Messages sent here stay with this room.</p> : messages.map((message, index) => <div className="chat-message" key={`${message.sender}-${index}`}><b>{message.sender || 'Guest'}</b><span>{message.data}</span></div>)}</div><form className="chat-form" onSubmit={sendMessage}><input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a message..." /><button type="submit">Send</button></form></aside>}<div className={`meeting-notice${notice ? ' visible' : ''}`}>{notice}</div></main>

  return <main className="meeting-lobby"><header className="meeting-header"><a className="brand" href="#home"><Brand /><span>Meetly</span></a><a className="back-home" href="#home">Back to home <span>↗</span></a></header><section className="lobby-content"><div className="lobby-copy"><span className="eyebrow">MEETLY MEETING ROOM</span><h1>Ready when<br /><em>you are.</em></h1><p>Join a clear, focused conversation from your browser. No downloads, no distractions.</p><form className="join-card" onSubmit={joinMeeting}><label>Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" autoComplete="name" /></label><label>Meeting code <span className="optional">optional</span><input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Paste a room code or link" /></label><div className="lobby-actions"><button className="button button-primary" type="submit">Enter meeting <span>→</span></button><button className={`device-button${cameraOn ? '' : ' off'}`} type="button" onClick={() => toggleTrack('video')}>{cameraOn ? '▣ Camera on' : '□ Camera off'}</button><button className={`device-button${micOn ? '' : ' off'}`} type="button" onClick={() => toggleTrack('audio')}>{micOn ? '◉ Mic on' : '⌁ Mic off'}</button></div></form>{notice && <p className="meeting-notice visible">{notice}</p>}</div><div className="preview-panel"><div className="preview-heading"><span>Preview</span><span className="secure-label">● Ready to connect</span></div><div className="preview-frame"><video ref={videoRef} autoPlay muted playsInline /><div className="preview-name">{name.trim() || 'Your preview'}</div><span className="preview-badge">{cameraOn ? 'HD' : 'Camera off'}</span></div><div className="preview-foot"><span><b>⌁</b> Browser-based</span><span><b>✓</b> Private by default</span></div></div></section></main>
}
