import { useEffect, useRef, useState } from 'react'

function Brand() {
  return <span className="brand-mark"><i /><i /><i /></span>
}

export default function VideoMeet() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [name, setName] = useState('')
  const [room, setRoom] = useState('')
  const [joined, setJoined] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
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
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const toggleTrack = (kind) => {
    const next = kind === 'video' ? !cameraOn : !micOn
    if (kind === 'video') setCameraOn(next)
    else setMicOn(next)
    streamRef.current?.getTracks()
      .filter((track) => track.kind === kind)
      .forEach((track) => { track.enabled = next })
  }

  const joinMeeting = (event) => {
    event.preventDefault()
    if (!name.trim()) return setNotice('Add your name before entering the room.')
    setJoined(true)
  }

  if (joined) return <main className="meeting-room">
    <header className="meeting-header"><a className="brand" href="#top"><Brand /><span>Meetly</span></a><span className="room-label">Room {room.trim() || 'instant-meeting'}</span><a className="leave-button" href="#top">Leave room</a></header>
    <section className="meeting-stage"><div className="stage-empty"><span className="stage-avatar">{name.trim().slice(0, 2).toUpperCase()}</span><h1>You are the only one here</h1><p>Share this room link to bring your team in.</p><button className="button button-primary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy room link <span>↗</span></button></div><div className="self-preview"><video ref={videoRef} autoPlay muted playsInline /><span>{name.trim()} · You</span></div></section>
    <nav className="meeting-controls" aria-label="Meeting controls"><button className={micOn ? '' : 'off'} onClick={() => toggleTrack('audio')} aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}>{micOn ? '◉' : '⌁'} <span>{micOn ? 'Mute' : 'Unmute'}</span></button><button className={cameraOn ? '' : 'off'} onClick={() => toggleTrack('video')} aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}>{cameraOn ? '▣' : '□'} <span>{cameraOn ? 'Camera' : 'Camera off'}</span></button><button onClick={() => setNotice('Screen sharing will be available when another participant joins.')}>▤ <span>Share</span></button><button onClick={() => setNotice('Chat is ready for this room.')}>☷ <span>Chat</span></button></nav>
    <div className={`meeting-notice${notice ? ' visible' : ''}`}>{notice}</div>
  </main>

  return <main className="meeting-lobby"><header className="meeting-header"><a className="brand" href="#top"><Brand /><span>Meetly</span></a><a className="back-home" href="#top">Back to home <span>↗</span></a></header><section className="lobby-content"><div className="lobby-copy"><span className="eyebrow">MEETLY MEETING ROOM</span><h1>Ready when<br /><em>you are.</em></h1><p>Join a clear, focused conversation from your browser. No downloads, no distractions.</p><form className="join-card" onSubmit={joinMeeting}><label>Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" autoComplete="name" /></label><label>Meeting code <span className="optional">optional</span><input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Paste a room code or link" /></label><div className="lobby-actions"><button className="button button-primary" type="submit">Enter meeting <span>→</span></button><button className={`device-button${cameraOn ? '' : ' off'}`} type="button" onClick={() => toggleTrack('video')}>{cameraOn ? '▣ Camera on' : '□ Camera off'}</button><button className={`device-button${micOn ? '' : ' off'}`} type="button" onClick={() => toggleTrack('audio')}>{micOn ? '◉ Mic on' : '⌁ Mic off'}</button></div></form>{notice && <p className="meeting-notice visible">{notice}</p>}</div><div className="preview-panel"><div className="preview-heading"><span>Preview</span><span className="secure-label">● Ready to connect</span></div><div className="preview-frame"><video ref={videoRef} autoPlay muted playsInline /><div className="preview-name">{name.trim() || 'Your preview'}</div><span className="preview-badge">{cameraOn ? 'HD' : 'Camera off'}</span></div><div className="preview-foot"><span><b>⌁</b> Browser-based</span><span><b>✓</b> Private by default</span></div></div></section></main>
}
