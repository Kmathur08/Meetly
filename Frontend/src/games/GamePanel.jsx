import { useState } from 'react'
import './games.css'
import BingoBoard from './BingoBoard'
import DotsBoard from './DotsBoard'
import FenceBoard from './FenceBoard'
import TicTacToeBoard from './TicTacToeBoard'
import WordSearchBoard from './WordSearchBoard'
import GameIcon from './GameIcon'
import Scoreboard from './Scoreboard'
import { GAMES, gameById, nameOf, statusText } from './catalog'

const BOARDS = {
  bingo: BingoBoard,
  'tic-tac-toe': TicTacToeBoard,
  'tic-tac-toe-fading': TicTacToeBoard,
  'dots-and-boxes': DotsBoard,
  'fence-race': FenceBoard,
  'word-search': WordSearchBoard,
}

function Picker({ onOpen, busy, tally }) {
  const [chosen, setChosen] = useState(null)
  const [value, setValue] = useState(null)
  const game = gameById(chosen)

  if (game) {
    const option = game.option
    const current = value ?? option?.initial
    return <div className="game-body">
      <button className="game-link" onClick={() => setChosen(null)}>← All games</button>
      <div className="game-intro"><GameIcon id={game.id} size={52} /><h3>{game.name}</h3><p>{game.blurb}</p><small>{game.players}</small></div>
      {option && <fieldset className="game-option">
        <legend>{option.label}</legend>
        {option.choices.map((choice) => <button key={choice.value} className={choice.value === current ? 'chosen' : ''} onClick={() => setValue(choice.value)}>{choice.label}</button>)}
      </fieldset>}
      <button className="button button-primary game-main" disabled={busy} onClick={() => onOpen(game.id, option ? { [option.key]: current } : {})}>Invite the room</button>
    </div>
  }

  return <div className="game-body">
    {tally}
    <p className="game-hint">Pick a game. Everyone in the room gets an invite to join.</p>
    <ul className="game-picker">
      {GAMES.map((item) => <li key={item.id}>
        <button onClick={() => { setChosen(item.id); setValue(null) }}>
          <GameIcon id={item.id} />
          <span><b>{item.name}</b><small>{item.players}</small></span>
        </button>
      </li>)}
    </ul>
  </div>
}

function Lobby({ game, selfId, act, busy, tally }) {
  const joined = game.players.some((player) => player.id === selfId)
  const isHost = game.hostId === selfId
  const missing = game.minPlayers - game.players.length
  const full = game.players.length >= game.maxPlayers
  const info = gameById(game.type)

  return <div className="game-body">
    <div className="game-intro"><GameIcon id={game.type} size={52} /><h3>{game.name}</h3><p>{info?.blurb}</p></div>
    <h4 className="game-subhead">Players · {game.players.length} of {game.maxPlayers}</h4>
    <ul className="game-lobby">
      {game.players.map((player) => <li key={player.id}>{nameOf(game.players, player.id, selfId)}{player.id === game.hostId && <small>host</small>}</li>)}
    </ul>
    <div className="game-actions">
      {isHost && <button className="button button-primary" disabled={busy || missing > 0} onClick={() => act('game-start')}>
        {missing > 0 ? `Waiting for ${missing} more` : 'Start game'}
      </button>}
      {!joined && <button className="button button-primary" disabled={busy || full} onClick={() => act('game-join')}>{full ? 'Game is full' : 'Join game'}</button>}
      {joined && !isHost && <p className="game-hint">You’re in. Waiting for {nameOf(game.players, game.hostId, selfId)} to start.</p>}
      {joined && !isHost && <button className="game-link" disabled={busy} onClick={() => act('game-leave')}>Step out</button>}
      {isHost && <button className="game-link" disabled={busy} onClick={() => act('game-close')}>Cancel game</button>}
    </div>
    {tally}
  </div>
}

export default function GamePanel({ game, scoreboard, selfId, onAction, onClose, onNotice }) {
  const [busy, setBusy] = useState(false)

  const act = async (event, args = [], { quiet = false } = {}) => {
    setBusy(true)
    const reply = await onAction(event, ...args)
    setBusy(false)
    if (!reply?.ok && reply?.error && !quiet) onNotice(reply.error)
    return reply
  }

  const Board = game ? BOARDS[game.type] : null
  const board = game?.board
  const watching = board && !board.players.some((player) => player.id === selfId && !player.gone)
  const isHost = game?.hostId === selfId
  // The room's running win tally: shown between games, not while a board needs the space.
  const tally = <Scoreboard scoreboard={scoreboard} busy={busy} onVote={(agree) => act('scores-reset', [agree])} />

  return <aside className="game-panel" aria-label="Games">
    <div className="game-heading"><strong>{game ? game.name : 'Games'}</strong><button onClick={onClose} aria-label="Close games">×</button></div>

    {!game && <Picker busy={busy} tally={tally} onOpen={(type, options) => act('game-open', [type, options])} />}

    {game?.phase === 'lobby' && <Lobby game={game} selfId={selfId} act={(event) => act(event)} busy={busy} tally={tally} />}

    {board && Board && <div className="game-body">
      <p className={`game-status${board.finished ? ' done' : board.current === selfId ? ' mine' : ''}`} aria-live="polite">
        {statusText(board, selfId) || (watching ? 'Game in progress' : 'Find the words!')}
        {board.finished && board.reason && <small>{board.reason}</small>}
      </p>
      {watching && !board.finished && <p className="game-hint">You’re watching this round.</p>}
      <Board board={board} selfId={selfId} onMove={(move, options) => act('game-move', [move], options)} />
      <div className="game-actions">
        {board.finished
          ? <>
            <button className="button button-primary" disabled={busy} onClick={() => act('game-rematch')}>Play again</button>
            <button className="game-link" disabled={busy} onClick={() => act('game-close')}>Choose another game</button>
          </>
          : isHost && <button className="game-link danger" disabled={busy} onClick={() => act('game-close')}>End game for everyone</button>}
      </div>
      {board.finished && tally}
    </div>}
  </aside>
}
