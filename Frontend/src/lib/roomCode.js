const LETTERS = 'abcdefghijkmnpqrstuvwxyz'
const ROOM_CODE_PATTERN = /^[a-zA-Z0-9-]{3,40}$/

// 10 random letters (~45 bits), so codes can't be guessed the way short Math.random codes could.
export function createRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  const letters = [...bytes].map((byte) => LETTERS[byte % LETTERS.length]).join('')
  return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7)}`
}

// Accepts a bare code or a full invite link and returns just the code, or '' if it isn't usable.
export function parseRoomCode(input) {
  const value = (input || '').trim()
  const fromLink = value.match(/#meet\/([^/?#\s]+)/)
  const code = fromLink ? decodeURIComponent(fromLink[1]) : value
  return ROOM_CODE_PATTERN.test(code) ? code : ''
}
