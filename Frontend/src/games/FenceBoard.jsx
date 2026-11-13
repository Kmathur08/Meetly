import { useState } from 'react'
import { nameOf, PLAYER_COLORS } from './catalog'

const CELL = 34
const GROOVE = 8
const UNIT = CELL + GROOVE
const EDGE = 10 // room around the board for the coloured goal strips

// Which way a player is heading: towards row 0 is up, towards column 0 is left.
const arrowFor = (goal) => (goal.axis === 'r' ? (goal.line === 0 ? '↑' : '↓') : (goal.line === 0 ? '←' : '→'))

// Where a fence sits, in board pixels. Anchored at the groove crossing below-right of cell (r, c).
function fenceRect(kind, r, c) {
  const long = CELL * 2 + GROOVE
  return kind === 'h'
    ? { x: EDGE + c * UNIT, y: EDGE + r * UNIT + CELL, width: long, height: GROOVE }
    : { x: EDGE + c * UNIT + CELL, y: EDGE + r * UNIT, width: GROOVE, height: long }
}

// Same overlap rule as the server, so the preview can warn before sending.
function clashes(fences, kind, r, c) {
  return fences.some((f) => (f.r === r && f.c === c)
    || (kind === 'h' && f.kind === 'h' && f.r === r && Math.abs(f.c - c) === 1)
    || (kind === 'v' && f.kind === 'v' && f.c === c && Math.abs(f.r - r) === 1))
}

function GoalStrip({ goal, size, color }) {
  const full = size * UNIT - GROOVE
  const thick = 4
  const near = EDGE - thick - 2
  const far = EDGE + full + 2
  const at = goal.line === 0 ? near : far
  const props = goal.axis === 'r'
    ? { x: EDGE, y: at, width: full, height: thick }
    : { x: at, y: EDGE, width: thick, height: full }
  return <rect {...props} rx="2" fill={color} />
}

// Makes an SVG shape act like a button: focusable, named, and pressed with Enter or Space.
const pressable = (label, action) => ({
  role: 'button',
  tabIndex: 0,
  'aria-label': label,
  onClick: action,
  onKeyDown: (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  },
})

export default function FenceBoard({ board, selfId, onMove }) {
  const [mode, setMode] = useState('move')
  const [kind, setKind] = useState('h')
  const [spot, setSpot] = useState(null)

  const { size, pawns, goals, fences, steps, players } = board
  const mySeat = players.findIndex((player) => player.id === selfId && !player.gone)
  const myTurn = board.current === selfId
  const me = players[mySeat]
  const canFence = myTurn && me?.fences > 0
  const placing = canFence && mode === 'fence'
  const span = EDGE * 2 + size * UNIT - GROOVE

  const send = async (move) => {
    const reply = await onMove(move)
    if (reply?.ok) {
      setSpot(null)
      setMode('move')
    }
  }

  const pending = placing && spot ? { kind, ...spot, bad: clashes(fences, kind, spot.r, spot.c) } : null

  return <div className="fence">
    {mySeat !== -1 && goals[mySeat] && <p className="game-hint">
      Get your <b style={{ color: PLAYER_COLORS[mySeat] }}>pawn</b> to the {arrowFor(goals[mySeat])} side marked in your colour.
    </p>}

    {myTurn && <div className="fence-tools" role="group" aria-label="Your move">
      <button className={mode === 'move' ? 'chosen' : ''} onClick={() => { setMode('move'); setSpot(null) }}>Move pawn</button>
      <button className={mode === 'fence' ? 'chosen' : ''} disabled={!canFence} onClick={() => setMode('fence')}>
        Place fence ({me?.fences ?? 0})
      </button>
      {placing && <button onClick={() => setKind(kind === 'h' ? 'v' : 'h')} aria-label="Rotate fence">
        {kind === 'h' ? '━ Across' : '┃ Down'} ⟳
      </button>}
    </div>}

    <div className="board-fit"><svg viewBox={`0 0 ${span} ${span}`} className="fence-board" role="group" aria-label="Fence race board"
      onPointerLeave={(e) => placing && e.pointerType === 'mouse' && setSpot(null)}>
      {goals.map((goal, seat) => !players[seat]?.gone && <GoalStrip key={seat} goal={goal} size={size} color={PLAYER_COLORS[seat]} />)}

      {Array.from({ length: size * size }, (_, i) => {
        const r = Math.floor(i / size)
        const c = i % size
        const open = myTurn && mode === 'move' && steps.some(([sr, sc]) => sr === r && sc === c)
        return <rect key={i} x={EDGE + c * UNIT} y={EDGE + r * UNIT} width={CELL} height={CELL} rx="6"
          className={`fence-cell${open ? ' open' : ''}`}
          {...(open ? pressable(`Move to row ${r + 1}, column ${c + 1}`, () => send({ type: 'step', r, c })) : {})} />
      })}

      {fences.map((f) => {
        const last = board.last?.type === 'fence' && board.last.kind === f.kind && board.last.r === f.r && board.last.c === f.c
        return <rect key={`${f.kind}${f.r}-${f.c}`} {...fenceRect(f.kind, f.r, f.c)} rx="3"
          fill={PLAYER_COLORS[f.seat]} className={last ? 'fence-last' : undefined} />
      })}

      {pending && <rect {...fenceRect(pending.kind, pending.r, pending.c)} rx="3"
        className={`fence-ghost${pending.bad ? ' bad' : ''}`} />}

      {pawns.map(([r, c], seat) => players[seat] && !players[seat].gone && <g key={seat}>
        {players[seat].id === board.current && <circle cx={EDGE + c * UNIT + CELL / 2} cy={EDGE + r * UNIT + CELL / 2} r={CELL / 2 - 1}
          fill="none" stroke={PLAYER_COLORS[seat]} strokeWidth="2" opacity="0.5" />}
        <circle cx={EDGE + c * UNIT + CELL / 2} cy={EDGE + r * UNIT + CELL / 2} r={CELL / 2 - 6}
          fill={PLAYER_COLORS[seat]} stroke="#fff" strokeWidth="2.5" />
      </g>)}

      {/* Tap targets on every groove crossing, used while placing a fence. */}
      {placing && Array.from({ length: (size - 1) ** 2 }, (_, i) => {
        const r = Math.floor(i / (size - 1))
        const c = i % (size - 1)
        const chosen = spot?.r === r && spot?.c === c
        return <circle key={`s${i}`} cx={EDGE + c * UNIT + CELL + GROOVE / 2} cy={EDGE + r * UNIT + CELL + GROOVE / 2} r={UNIT / 2}
          className="fence-spot" onPointerEnter={(e) => e.pointerType === 'mouse' && setSpot({ r, c })}
          // Tabbing to a spot previews the fence there; Enter or Space then places it.
          onFocus={() => setSpot({ r, c })}
          {...pressable(`Place fence ${kind === 'h' ? 'across' : 'down'} at row ${r + 1}, column ${c + 1}`,
            () => (chosen && !clashes(fences, kind, r, c) ? send({ type: 'fence', kind, r, c }) : setSpot({ r, c })))} />
      })}
    </svg></div>

    {placing && <p className="game-hint fence-tip">
      {pending
        ? pending.bad ? 'That spot overlaps a fence.' : 'Click or tap again to place it.'
        : 'Tap between squares to put down a fence.'}
    </p>}

    <ul className="game-scores">
      {players.map((player, seat) => <li key={player.id} className={`${player.gone ? 'gone' : ''}${player.id === board.current ? ' turn' : ''}`}>
        <i style={{ background: PLAYER_COLORS[seat] }} />{nameOf(players, player.id, selfId)} <small>{arrowFor(goals[seat])}</small>
        <span>{player.fences} ▮</span>
      </li>)}
    </ul>
  </div>
}
