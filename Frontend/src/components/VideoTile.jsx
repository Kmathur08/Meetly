import { useEffect, useRef } from 'react'

const initials = (name) => (name || '?').trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

export default function VideoTile({ stream, name, muted = false, mirrored = false, showVideo = true, micOn = true, label }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) videoRef.current.srcObject = stream || null
  }, [stream, showVideo])

  return <figure className={`video-tile${showVideo ? '' : ' no-video'}`}>
    {showVideo
      ? <video ref={videoRef} autoPlay playsInline muted={muted} className={mirrored ? 'mirrored' : ''} />
      // Keep audio playing for remote people who turned their camera off.
      : <>{!muted && <audio ref={videoRef} autoPlay />}<span className="tile-avatar">{initials(name)}</span></>}
    <figcaption>
      {!micOn && <span className="tile-muted" aria-label="Microphone off">⌁</span>}
      <span>{name}{label ? ` · ${label}` : ''}</span>
    </figcaption>
  </figure>
}
