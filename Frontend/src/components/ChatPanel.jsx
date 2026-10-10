import { useEffect, useRef, useState } from 'react'

const MAX_LENGTH = 500

export default function ChatPanel({ messages, selfId, onSend, onClose }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages.length])

  const submit = (event) => {
    event.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return <aside className="chat-panel" aria-label="Room chat">
    <div className="chat-heading"><strong>Room chat</strong><button onClick={onClose} aria-label="Close chat">×</button></div>
    <div className="chat-messages" aria-live="polite" ref={listRef}>
      {messages.length === 0
        ? <p className="chat-empty">Messages are visible to everyone in this room while it's open.</p>
        : messages.map((message) => <div className={`chat-message${message.from === selfId ? ' own' : ''}`} key={`${message.from}-${message.at}`}>
          <b>{message.from === selfId ? 'You' : message.sender}</b>
          <span>{message.text}</span>
        </div>)}
    </div>
    <form className="chat-form" onSubmit={submit}>
      <input value={text} onChange={(event) => setText(event.target.value)} maxLength={MAX_LENGTH} placeholder="Write a message..." aria-label="Message" />
      <button type="submit" disabled={!text.trim()}>Send</button>
    </form>
  </aside>
}
