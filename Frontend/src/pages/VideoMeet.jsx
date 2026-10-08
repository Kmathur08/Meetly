import { useEffect, useState } from 'react'
import './meeting.css'
import { api } from '../lib/api'
import { createRoomCode, parseRoomCode } from '../lib/roomCode'
import { withAuthGuard } from '../utils/authGuard'
import useLocalMedia from '../hooks/useLocalMedia'
import useMeeting from '../hooks/useMeeting'
import Lobby from './meeting/Lobby'
import Room from './meeting/Room'

function VideoMeet({ user }) {
  const roomCode = parseRoomCode(window.location.hash)
  const [joined, setJoined] = useState(false)
  const media = useLocalMedia()
  const meeting = useMeeting({ roomCode, localStream: media.stream, enabled: joined && Boolean(roomCode) })

  useEffect(() => {
    // A bare #meet (or a broken code) gets a fresh room so there is always something to share.
    if (!roomCode) window.location.replace(`#meet/${createRoomCode()}`)
  }, [roomCode])

  const join = () => {
    setJoined(true)
    api('add_to_activity', { method: 'POST', body: { meetingcode: roomCode } }).catch(() => {})
  }

  const leave = () => { window.location.hash = 'home' }

  if (!roomCode) return null
  if (joined && meeting.status === 'error') {
    return <main className="guard-loading">{meeting.error} <a href="#home">Back to home</a></main>
  }
  if (joined) return <Room user={user} roomCode={roomCode} media={media} meeting={meeting} onLeave={leave} />
  return <Lobby user={user} roomCode={roomCode} media={media} onJoin={join} />
}

export default withAuthGuard(VideoMeet)
