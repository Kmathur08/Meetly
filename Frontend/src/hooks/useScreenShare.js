import { useCallback, useEffect, useRef, useState } from 'react'

export default function useScreenShare() {
  const streamRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const supported = Boolean(navigator.mediaDevices?.getDisplayMedia)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScreenStream(null)
    setSharing(false)
  }, [])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const [track] = stream.getVideoTracks()
      streamRef.current = stream
      // Fires when the user clicks the browser's own "Stop sharing" bar.
      track.addEventListener('ended', stop)
      setScreenStream(stream)
      setSharing(true)
      return true
    } catch {
      return false
    }
  }, [stop])

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])

  return { sharing, screenStream, supported, start, stop }
}
