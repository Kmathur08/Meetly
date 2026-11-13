// Wins per person in this room across all games. Resetting to 0 needs everyone here to agree.
export default function Scoreboard({ scoreboard, onVote, busy }) {
  if (!scoreboard) return null
  const { rows, resetRequested, waitingFor } = scoreboard
  const me = rows.find((row) => row.you)
  const allZero = rows.every((row) => row.wins === 0)
  const askers = rows.filter((row) => row.agreed).map((row) => (row.you ? 'You' : row.name))

  return <section className="tally" aria-label="Scoreboard">
    <div className="tally-head">
      <h4>Scoreboard</h4>
      {me && !resetRequested && !allZero && <button className="game-link" disabled={busy} onClick={() => onVote(true)}>Reset to 0</button>}
    </div>
    <ol className="tally-rows">
      {rows.map((row, i) => <li key={`${row.name}-${i}`} className={`${row.you ? 'you' : ''}${row.here ? '' : ' away'}`}>
        <span>{row.you ? 'You' : row.name}{!row.here && <small> · left</small>}</span>
        <b>{row.wins}</b><small>{row.wins === 1 ? 'win' : 'wins'}</small>
      </li>)}
    </ol>
    {resetRequested && <div className="tally-reset" role="status">
      {me?.agreed
        ? <>
          <p>Waiting for {waitingFor.join(', ')} to agree to reset the scores.</p>
          <button className="game-link" disabled={busy} onClick={() => onVote(false)}>Cancel</button>
        </>
        : <>
          <p>{askers.join(', ')} {askers.length === 1 && askers[0] !== 'You' ? 'wants' : 'want'} to reset the scores to 0.</p>
          {me && <button className="button button-primary" disabled={busy} onClick={() => onVote(true)}>Agree</button>}
        </>}
    </div>}
  </section>
}
