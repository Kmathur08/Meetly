// What the game picker shows. The server holds the rules; these ids must match Backend/src/games.
export const GAMES = [
  {
    id: 'bingo',
    name: 'Bingo',
    players: '2–6 players',
    blurb: 'Everyone gets a 5×5 card of 1–25. Call numbers in turn; first to cross 5 lines shouts BINGO.',
  },
  {
    id: 'tic-tac-toe',
    name: 'Zero & Cross',
    players: '2 players',
    blurb: 'The classic. Get three in a row before your friend does.',
  },
  {
    id: 'tic-tac-toe-fading',
    name: 'Zero & Cross: Vanishing',
    players: '2 players',
    blurb: 'Only three marks each. Your fourth move wipes out your oldest one, so nobody can draw.',
  },
  {
    id: 'dots-and-boxes',
    name: 'Dots & Houses',
    players: '2–4 players',
    blurb: 'Join two dots per turn. Close the fourth side of a box to build a house and go again.',
    option: { key: 'dots', label: 'Board', choices: [4, 5, 6, 7].map((dots) => ({ value: dots, label: `${dots}×${dots} dots` })), initial: 5 },
  },
  {
    id: 'word-search',
    name: 'Word Search',
    players: '1–6 players',
    blurb: 'One shared grid. Drag across a hidden word to claim it before anyone else.',
    option: {
      key: 'theme',
      label: 'Theme',
      choices: ['Random', 'Animals', 'Fruits', 'Space', 'Sports', 'Kitchen', 'Weather'].map((theme) => ({ value: theme, label: theme })),
      initial: 'Random',
    },
  },
]

export const gameById = (id) => GAMES.find((game) => game.id === id)

// Seat colours, shared by every board so a player keeps one colour throughout.
export const PLAYER_COLORS = ['#4c3ce3', '#e0457b', '#12a17f', '#e8901c', '#2f86d6', '#8a5a44']

export const nameOf = (players, id, selfId) => (id === selfId ? 'You' : players.find((player) => player.id === id)?.name || 'Someone')

// One line describing the result or whose turn it is.
export function statusText(board, selfId) {
  const { players, winners, finished, current } = board
  if (finished) {
    if (winners.length === 0) return 'It’s a draw.'
    if (winners.length === 1) return winners[0] === selfId ? 'You win! 🎉' : `${nameOf(players, winners[0], selfId)} wins!`
    const names = winners.map((id) => nameOf(players, id, selfId))
    return `${names.slice(0, -1).join(', ')} and ${names.at(-1)} share the win!`
  }
  if (!current) return ''
  return current === selfId ? 'Your turn' : `${nameOf(players, current, selfId)}’s turn`
}

// Cells on the straight line from `from` to `to`, or null if it isn't horizontal, vertical or diagonal.
export function lineCells(from, to) {
  const dr = to[0] - from[0]
  const dc = to[1] - from[1]
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null
  const steps = Math.max(Math.abs(dr), Math.abs(dc))
  return Array.from({ length: steps + 1 }, (_, i) => [from[0] + Math.sign(dr) * i, from[1] + Math.sign(dc) * i])
}
