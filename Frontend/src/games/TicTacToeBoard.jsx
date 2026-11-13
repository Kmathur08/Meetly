import { PLAYER_COLORS } from './catalog'

// Both marks drawn the same size and weight, in the player's colour.
function Mark({ mark }) {
  return <svg viewBox="0 0 40 40" className="ttt-mark" aria-hidden="true">
    {mark === 'O'
      ? <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="5" />
      : <path d="M9 9 L31 31 M31 9 L9 31" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />}
  </svg>
}

export default function TicTacToeBoard({ board, selfId, onMove }) {
  const myTurn = board.current === selfId
  const myMark = board.marks[selfId]
  const colorOf = (mark) => PLAYER_COLORS[mark === 'X' ? 0 : 1]

  return <div className="ttt">
    {myMark && <p className="game-hint">You are <b style={{ color: colorOf(myMark) }}>{myMark === 'X' ? 'Cross (X)' : 'Zero (O)'}</b>
      {board.fading && <> · faded marks vanish on that player’s next move</>}</p>}
    <div className="board-fit"><div className="ttt-grid" role="grid" aria-label="Zero and cross board">
      {board.cells.map((mark, cell) => {
        const winning = board.line?.includes(cell)
        const vanishing = !board.finished && board.vanishing.includes(cell)
        return <button
          key={cell}
          className={`ttt-cell${winning ? ' winning' : ''}${vanishing ? ' vanishing' : ''}`}
          style={mark ? { color: colorOf(mark) } : undefined}
          disabled={!myTurn || Boolean(mark)}
          onClick={() => onMove({ cell })}
          aria-label={mark ? `${mark}${vanishing ? ', vanishes next' : ''}` : `Empty square ${cell + 1}`}
        >{mark && <Mark mark={mark} />}</button>
      })}
    </div></div>
  </div>
}
