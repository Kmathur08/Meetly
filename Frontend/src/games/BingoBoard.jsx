import { useMemo } from 'react'
import { nameOf, PLAYER_COLORS } from './catalog'

const SIZE = 5
const LETTERS = 'BINGO'
const LINES = (() => {
  const lines = []
  for (let i = 0; i < SIZE; i += 1) {
    lines.push(Array.from({ length: SIZE }, (_, j) => i * SIZE + j))
    lines.push(Array.from({ length: SIZE }, (_, j) => j * SIZE + i))
  }
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + i))
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)))
  return lines
})()

function Card({ card, called, onPick, canPick, lastCalled }) {
  const lineCells = useMemo(() => {
    const cells = new Set()
    for (const line of LINES) if (line.every((cell) => called.has(card[cell]))) line.forEach((cell) => cells.add(cell))
    return cells
  }, [card, called])

  return <div className="bingo-grid">
    {card.map((number, cell) => {
      const crossed = called.has(number)
      return <button
        key={number}
        className={`bingo-cell${crossed ? ' crossed' : ''}${lineCells.has(cell) ? ' in-line' : ''}${number === lastCalled ? ' last' : ''}`}
        disabled={!canPick || crossed}
        onClick={() => onPick(number)}
        aria-label={crossed ? `${number}, crossed` : `Call ${number}`}
      >{number}</button>
    })}
  </div>
}

export default function BingoBoard({ board, selfId, onMove }) {
  const called = useMemo(() => new Set(board.called), [board.called])
  const lastCalled = board.called.at(-1)
  const myTurn = board.current === selfId
  const me = board.players.find((player) => player.id === selfId)
  const myLines = me?.score || 0

  return <div className="bingo">
    {/* One row for the last call, the tip and the shuffle button, so the card gets the height. */}
    <div className="bingo-called">
      <span className="bingo-last" aria-live="polite">{lastCalled ?? '–'}</span>
      <span className="bingo-called-text">
        {board.called.length === 0 ? 'No numbers called yet' : `${board.called.length} of 25 called`}
        {board.card && myTurn && <small>Tap a number to call it for everyone.</small>}
      </span>
      {board.card && board.called.length === 0 && !board.finished && <button className="game-link" onClick={() => onMove({ action: 'shuffle' })}>↻ Shuffle</button>}
    </div>

    {board.card && <>
      <div className="board-fit">
        <div className="bingo-letters" aria-label={`${myLines} of ${board.linesToWin} lines`}>
          {[...LETTERS].map((letter, i) => <span key={letter} className={i < myLines ? 'lit' : ''}>{letter}</span>)}
        </div>
        <Card card={board.card} called={called} lastCalled={lastCalled} canPick={myTurn} onPick={(number) => onMove({ number })} />
      </div>
    </>}

    {board.cards && <details className="bingo-reveal">
      <summary>See everyone’s cards</summary>
      {board.players.filter((player) => player.id !== selfId && board.cards[player.id]).map((player) => <div key={player.id}>
        <b>{player.name}</b>
        <Card card={board.cards[player.id]} called={called} lastCalled={lastCalled} canPick={false} onPick={() => {}} />
      </div>)}
    </details>}

    <ul className="game-scores">
      {board.players.map((player, seat) => <li key={player.id} className={player.gone ? 'gone' : ''}>
        <i style={{ background: PLAYER_COLORS[seat] }} />{nameOf(board.players, player.id, selfId)}
        <span>{LETTERS.slice(0, Math.min(player.score, LETTERS.length)) || '·'}</span>
      </li>)}
    </ul>
  </div>
}
