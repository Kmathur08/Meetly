import { useCallback, useEffect, useRef, useState } from 'react'

export default function useScreenShare(onTrackChange) {
  const streamRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const supported = Boolean(navigator.mediaDevices?.getDisplayMedia)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScreenStream(null)
    setSharing(false)
    onTrackChange(null)
  }, [onTrackChange])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const [track] = stream.getVideoTracks()
      streamRef.current = stream
      // Fires when the user clicks the browser's own "Stop sharing" bar.
      track.addEventListener('ended', stop)
      setScreenStream(stream)
      setSharing(true)
      onTrackChange(track)
      return true
    } catch {
      return false
    }
  }, [onTrackChange, stop])

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])

  return { sharing, screenStream, supported, start, stop }
}
