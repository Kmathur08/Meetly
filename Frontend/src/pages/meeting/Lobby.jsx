import Brand from '../../components/Brand'
import VideoTile from '../../components/VideoTile'

export default function Lobby({ user, roomCode, media, onJoin }) {
  const join = (event) => {
    event.preventDefault()
    onJoin()
  }

  return <main className="meeting-lobby">
    <header className="meeting-header"><a className="brand" href="#home"><Brand /><span>Meetly</span></a><a className="back-home" href="#home">Back to home <span>↗</span></a></header>
    <section className="lobby-content">
      <div className="lobby-copy">
        <span className="eyebrow">MEETLY MEETING ROOM</span>
        <h1>Ready when<br /><em>you are.</em></h1>
        <p>Joining room <strong>{roomCode}</strong> as <strong>{user.name}</strong>. Check your camera and microphone, then step in.</p>
        <form className="join-card" onSubmit={join}>
          <div className="lobby-actions">
            <button className="button button-primary" type="submit">Enter meeting <span>→</span></button>
            <button className={`device-button${media.cameraOn ? '' : ' off'}`} type="button" onClick={media.toggleCamera} disabled={!media.hasVideo}>{media.cameraOn ? '▣ Camera on' : '□ Camera off'}</button>
            <button className={`device-button${media.micOn ? '' : ' off'}`} type="button" onClick={media.toggleMic} disabled={!media.hasAudio}>{media.micOn ? '◉ Mic on' : '⌁ Mic off'}</button>
          </div>
        </form>
        {media.error && <p className="meeting-notice visible" role="alert">{media.error}</p>}
      </div>
      <div className="preview-panel">
        <div className="preview-heading"><span>Preview</span><span className="secure-label">● Ready to connect</span></div>
        <div className="preview-frame">
          <VideoTile stream={media.stream} name={user.name} muted mirrored showVideo={media.cameraOn} micOn={media.micOn} />
        </div>
        <div className="preview-foot"><span><b>⌁</b> Browser-based</span><span><b>✓</b> Encrypted in transit</span></div>
      </div>
    </section>
  </main>
}
