// Tile artwork for each game: a gradient tile with a small line drawing of the board.
const TILES = {
  bingo: ['#7b5cff', '#d946ef'],
  'tic-tac-toe': ['#3b82f6', '#6366f1'],
  'tic-tac-toe-fading': ['#a855f7', '#ec4899'],
  'dots-and-boxes': ['#f59e0b', '#f97316'],
  'fence-race': ['#ef4444', '#db2777'],
  'word-search': ['#14b8a6', '#22c55e'],
}

const ART = {
  // A bingo card: 3x3 numbers with a winning line struck through.
  bingo: <>
    <rect x="11" y="11" width="26" height="26" rx="4" stroke="#fff" strokeOpacity=".9" />
    {[17, 24, 31].flatMap((y) => [17, 24, 31].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.1" fill="#fff" fillOpacity={x === y ? 1 : 0.55} stroke="none" />))}
    <path d="M14.5 14.5l19 19" stroke="#fff" strokeWidth="2.4" />
  </>,
  // Zero & Cross: the grid with an O and an X.
  'tic-tac-toe': <>
    <path d="M19.7 10v28M28.3 10v28M10 19.7h28M10 28.3h28" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" />
    <circle cx="15" cy="15" r="3.3" stroke="#fff" strokeWidth="2.4" />
    <path d="M20.8 20.8l6.4 6.4M27.2 20.8l-6.4 6.4" stroke="#fff" strokeWidth="2.6" />
    <circle cx="33" cy="33" r="3.3" stroke="#fff" strokeWidth="2.4" />
  </>,
  // Vanishing: a solid X with an older one fading out.
  'tic-tac-toe-fading': <>
    <path d="M19.7 10v28M28.3 10v28M10 19.7h28M10 28.3h28" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" />
    <path d="M12 12l6 6M18 12l-6 6" stroke="#fff" strokeWidth="2.4" strokeOpacity=".28" />
    <path d="M21 21l6 6M27 21l-6 6" stroke="#fff" strokeWidth="2.4" strokeOpacity=".6" />
    <path d="M30 30l6 6M36 30l-6 6" stroke="#fff" strokeWidth="2.6" />
  </>,
  // Dots & Houses: dots, a few joined lines and one claimed box.
  'dots-and-boxes': <>
    <rect x="13" y="13" width="11" height="11" fill="#fff" fillOpacity=".35" stroke="none" />
    <path d="M13 13h11v11H13zM24 13h11M35 24v11M13 35h11" stroke="#fff" strokeWidth="2.2" />
    {[13, 24, 35].flatMap((y) => [13, 24, 35].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill="#fff" stroke="none" />))}
  </>,
  // Fence Race: a grid of squares, two fences and a pawn heading for the top edge.
  'fence-race': <>
    {[12, 20.5, 29].flatMap((y) => [12, 20.5, 29].map((x) => <rect key={`${x}${y}`} x={x} y={y} width="7" height="7" rx="1.6" fill="#fff" fillOpacity=".35" stroke="none" />))}
    <path d="M12 9.5h15.5M38.5 20.5v15.5" stroke="#fff" strokeWidth="2.6" />
    <circle cx="24" cy="24" r="3.6" fill="#fff" stroke="none" />
  </>,
  // Word Search: a letter grid with a found word highlighted.
  'word-search': <>
    {[13, 20, 27, 34].flatMap((x) => [13, 35].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#fff" fillOpacity=".55" stroke="none" />))}
    <rect x="8.5" y="18" width="31" height="12" rx="6" fill="#fff" stroke="none" />
    {['A', 'B', 'C'].map((ch, i) => <text key={ch} x={15.5 + i * 8.5} y="27.4" fill="#0f9f84" stroke="none" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="Space Grotesk, DM Sans, sans-serif">{ch}</text>)}
  </>,
}

export default function GameIcon({ id, size = 44 }) {
  const [from, to] = TILES[id] || ['#6b6880', '#4a475e']
  const grad = `game-grad-${id}`
  return <svg className="game-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <defs>
      <linearGradient id={grad} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
    </defs>
    <rect width="48" height="48" rx="13" fill={`url(#${grad})`} />
    <rect x=".5" y=".5" width="47" height="47" rx="12.5" stroke="#fff" strokeOpacity=".18" strokeWidth="1" />
    {ART[id]}
  </svg>
}
