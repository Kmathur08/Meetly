import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { connectSocket } from '../lib/socket'

const FALLBACK_ICE = [{ urls: ['stun:stun.l.google.com:19302'] }]

// Joins a room and keeps one RTCPeerConnection per other participant (a full mesh).
// Negotiation follows the "perfect negotiation" pattern, so both sides can renegotiate without glare.
export default function useMeeting({ roomCode, localStream, enabled }) {
  const socketRef = useRef(null)
  const connectionsRef = useRef(new Map())
  const localStreamRef = useRef(localStream)
  const [selfId, setSelfId] = useState(null)
  const [peers, setPeers] = useState({})
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  localStreamRef.current = localStream

  const updatePeer = useCallback((id, patch) => {
    setPeers((current) => current[id] ? { ...current, [id]: { ...current[id], ...patch } } : current)
  }, [])

  const removePeer = useCallback((id) => {
    connectionsRef.current.get(id)?.pc.close()
    connectionsRef.current.delete(id)
    setPeers((current) => {
      const { [id]: _removed, ...rest } = current
      return rest
    })
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    let iceServers = FALLBACK_ICE
    const socket = connectSocket()
    socketRef.current = socket
    const connections = connectionsRef.current

    const sendSignal = (to, payload) => socket.emit('signal', to, payload)

    const createConnection = (peer, polite) => {
      const pc = new RTCPeerConnection({ iceServers })
      const remoteStream = new MediaStream()
      const entry = { pc, polite, makingOffer: false, ignoreOffer: false }
      connections.set(peer.id, entry)
      setPeers((current) => ({ ...current, [peer.id]: { id: peer.id, name: peer.name, stream: remoteStream, media: { audio: true, video: true, screen: false }, connection: 'connecting' } }))

      localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current))

      pc.ontrack = ({ track }) => {
        remoteStream.addTrack(track)
        // A new MediaStream reference makes React hand the updated tracks to the <video> element.
        updatePeer(peer.id, { stream: new MediaStream(remoteStream.getTracks()) })
        track.onended = () => remoteStream.removeTrack(track)
      }
      pc.onicecandidate = ({ candidate }) => candidate && sendSignal(peer.id, { candidate })
      pc.onconnectionstatechange = () => updatePeer(peer.id, { connection: pc.connectionState })
      pc.onnegotiationneeded = async () => {
        try {
          entry.makingOffer = true
          await pc.setLocalDescription()
          sendSignal(peer.id, { description: pc.localDescription })
        } catch (err) {
          console.error('Negotiation failed', err)
        } finally {
          entry.makingOffer = false
        }
      }
      return entry
    }

    const handleSignal = async (fromId, { description, candidate } = {}) => {
      const entry = connections.get(fromId)
      if (!entry) return
      const { pc } = entry
      try {
        if (description) {
          const collision = description.type === 'offer' && (entry.makingOffer || pc.signalingState !== 'stable')
          entry.ignoreOffer = !entry.polite && collision
          if (entry.ignoreOffer) return
          await pc.setRemoteDescription(description)
          if (description.type === 'offer') {
            await pc.setLocalDescription()
            sendSignal(fromId, { description: pc.localDescription })
          }
        } else if (candidate) {
          try {
            await pc.addIceCandidate(candidate)
          } catch (err) {
            if (!entry.ignoreOffer) throw err
          }
        }
      } catch (err) {
        console.error('Signal handling failed', err)
      }
    }

    const closeAll = () => {
      connections.forEach(({ pc }) => pc.close())
      connections.clear()
      setPeers({})
    }

    const join = () => {
      setStatus('joining')
      socket.emit('join-room', roomCode, (reply) => {
        if (cancelled) return
        if (!reply?.ok) {
          setStatus('error')
          setError(reply?.error || 'Could not join this room.')
          return
        }
        setSelfId(reply.self.id)
        setMessages(reply.messages)
        // The newcomer is the impolite side, so existing members yield if both offer at once.
        reply.peers.forEach((peer) => createConnection(peer, false))
        setStatus('joined')
      })
    }

    socket.on('connect', join)
    socket.on('disconnect', () => {
      closeAll()
      setStatus('reconnecting')
    })
    socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') {
        setStatus('error')
        setError('Your session has expired. Please sign in again.')
        socket.disconnect()
      } else {
        setStatus('reconnecting')
      }
    })
    socket.on('peer-joined', (peer) => createConnection(peer, true))
    socket.on('peer-left', removePeer)
    socket.on('signal', handleSignal)
    socket.on('chat-message', (message) => setMessages((current) => [...current, message]))

    // Connect only once the TURN/STUN list is known, so the first peer connections already use it.
    api('ice-servers')
      .then((data) => { if (data.iceServers?.length) iceServers = data.iceServers })
      .catch(() => {})
      .finally(() => { if (!cancelled) socket.connect() })

    return () => {
      cancelled = true
      socket.emit('leave-room')
      socket.disconnect()
      closeAll()
      socketRef.current = null
    }
  }, [enabled, roomCode, removePeer, updatePeer])

  const sendMessage = useCallback((text) => socketRef.current?.emit('chat-message', text), [])

  return { selfId, peers, messages, status, error, sendMessage }
}
