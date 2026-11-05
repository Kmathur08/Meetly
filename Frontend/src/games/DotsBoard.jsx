import { nameOf, PLAYER_COLORS } from './catalog'

const GAP = 56
const PAD = 16

// A little house drawn inside a finished box, in the builder's colour.
function House({ x, y, color }) {
  const s = GAP
  return <g transform={`translate(${x} ${y})`}>
    <rect x="3" y="3" width={s - 6} height={s - 6} rx="5" fill={color} opacity="0.13" />
    <path d={`M${s * 0.22} ${s * 0.5} L${s * 0.5} ${s * 0.24} L${s * 0.78} ${s * 0.5} Z`} fill={color} />
    <rect x={s * 0.3} y={s * 0.49} width={s * 0.4} height={s * 0.28} fill={color} opacity="0.85" />
    <rect x={s * 0.45} y={s * 0.6} width={s * 0.1} height={s * 0.17} fill="#fff" />
  </g>
}

export default function DotsBoard({ board, selfId, onMove }) {
  const n = board.dots - 1
  const size = PAD * 2 + GAP * n
  const myTurn = board.current === selfId
  const isLast = (kind, r, c) => board.last && board.last.kind === kind && board.last.r === r && board.last.c === c

  const line = (kind, r, c, owner) => {
    const x1 = PAD + c * GAP
    const y1 = PAD + r * GAP
    const x2 = kind === 'h' ? x1 + GAP : x1
    const y2 = kind === 'h' ? y1 : y1 + GAP
    const key = `${kind}${r}-${c}`
    if (owner !== null) {
      return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={PLAYER_COLORS[owner]} strokeWidth={isLast(kind, r, c) ? 7 : 5} strokeLinecap="round" />
    }
    return <g key={key} className={`dot-slot${myTurn ? ' open' : ''}`} onClick={myTurn ? () => onMove({ kind, r, c }) : undefined}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="dot-ghost" />
      {/* A fat invisible line makes the target easy to hit on a phone. */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="22" />
    </g>
  }

  const lines = []
  for (let r = 0; r <= n; r += 1) for (let c = 0; c < n; c += 1) lines.push(line('h', r, c, board.h[r * n + c]))
  for (let r = 0; r < n; r += 1) for (let c = 0; c <= n; c += 1) lines.push(line('v', r, c, board.v[r * (n + 1) + c]))

  return <div className="dots">
    <svg viewBox={`0 0 ${size} ${size}`} className="dots-board" role="img" aria-label="Dots and houses board">
      {board.boxes.map((owner, i) => owner !== null && <House key={i} x={PAD + (i % n) * GAP} y={PAD + Math.floor(i / n) * GAP} color={PLAYER_COLORS[owner]} />)}
      {lines}
      {Array.from({ length: board.dots * board.dots }, (_, i) => <circle key={i} cx={PAD + (i % board.dots) * GAP} cy={PAD + Math.floor(i / board.dots) * GAP} r="5" className="dot" />)}
    </svg>
    <ul className="game-scores">
      {board.players.map((player, seat) => <li key={player.id} className={`${player.gone ? 'gone' : ''}${player.id === board.current ? ' turn' : ''}`}>
        <i style={{ background: PLAYER_COLORS[seat] }} />{nameOf(board.players, player.id, selfId)}
        <span>{player.score} 🏠</span>
      </li>)}
    </ul>
  </div>
}
