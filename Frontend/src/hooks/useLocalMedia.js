import { useCallback, useEffect, useRef, useState } from 'react'

const CONSTRAINTS = {
  video: { width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: { echoCancellation: true, noiseSuppression: true },
}

// Owns the camera and microphone for the whole meeting, from the lobby preview through the call.
export default function useLocalMedia() {
  const streamRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const acquire = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser can\'t use a camera or microphone. Try a recent Chrome, Edge or Firefox over HTTPS.')
        return
      }
      try {
        const media = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
        if (!active) return media.getTracks().forEach((track) => track.stop())
        streamRef.current = media
        setStream(media)
      } catch {
        // Fall back to audio only, e.g. when the camera is busy in another app.
        try {
          const media = await navigator.mediaDevices.getUserMedia({ audio: CONSTRAINTS.audio })
          if (!active) return media.getTracks().forEach((track) => track.stop())
          streamRef.current = media
          setStream(media)
          setCameraOn(false)
          setError('Camera unavailable. You can still join with audio.')
        } catch {
          setCameraOn(false)
          setMicOn(false)
          setError('Camera and microphone are blocked. Allow access in your browser to be seen and heard.')
        }
      }
    }
    acquire()
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const setTrackEnabled = (kind, enabled) => {
    streamRef.current?.getTracks().filter((track) => track.kind === kind).forEach((track) => { track.enabled = enabled })
  }

  const toggleCamera = useCallback(() => {
    setCameraOn((on) => {
      setTrackEnabled('video', !on)
      return !on
    })
  }, [])

  const toggleMic = useCallback(() => {
    setMicOn((on) => {
      setTrackEnabled('audio', !on)
      return !on
    })
  }, [])

  const hasVideo = Boolean(stream?.getVideoTracks().length)
  const hasAudio = Boolean(stream?.getAudioTracks().length)

  return { stream, cameraOn: cameraOn && hasVideo, micOn: micOn && hasAudio, hasVideo, hasAudio, toggleCamera, toggleMic, error }
}
