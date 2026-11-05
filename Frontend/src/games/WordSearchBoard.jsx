import { useMemo, useRef, useState } from 'react'
import { lineCells, nameOf, PLAYER_COLORS } from './catalog'

const colorOf = (players, id) => PLAYER_COLORS[players.findIndex((player) => player.id === id)]
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

const cellAt = (x, y) => {
  const value = document.elementFromPoint(x, y)?.closest('[data-cell]')?.dataset.cell
  return value ? value.split(',').map(Number) : null
}

export default function WordSearchBoard({ board, selfId, onMove }) {
  const [selection, setSelection] = useState(null)
  const [anchor, setAnchor] = useState(null)
  const [miss, setMiss] = useState(false)
  // The drag lives in a ref too: a quick swipe can end before React re-renders with the new selection.
  const drag = useRef(null)
  const playing = !board.finished && board.players.some((player) => player.id === selfId && !player.gone)
  // Colour each found letter by whoever found the word. Unfound words are shown in grey once the game ends.
  const foundColors = useMemo(() => {
    const colors = new Map()
    for (const word of board.words) {
      if (!word.cells) continue
      const color = word.foundBy ? colorOf(board.players, word.foundBy) : '#9a97ad'
      for (const [r, c] of word.cells) colors.set(`${r},${c}`, color)
    }
    return colors
  }, [board.words, board.players])

  const previewCells = useMemo(() => {
    const cells = selection ? lineCells(selection.from, selection.to) : anchor ? [anchor] : null
    return new Set((cells || []).map(([r, c]) => `${r},${c}`))
  }, [selection, anchor])

  const submit = async (from, to) => {
    if (!lineCells(from, to)) return
    const reply = await onMove({ from, to }, { quiet: true })
    if (reply && !reply.ok) {
      setMiss(true)
      window.setTimeout(() => setMiss(false), 400)
    }
  }

  const onPointerDown = (event) => {
    if (!playing) return
    const cell = cellAt(event.clientX, event.clientY)
    if (!cell) return
    event.preventDefault()
    // Tap one end, then tap the other: easier than dragging on a small phone screen.
    if (anchor && !same(anchor, cell)) {
      setAnchor(null)
      submit(anchor, cell)
      return
    }
    drag.current = { from: cell, to: cell }
    setSelection(drag.current)
  }

  const onPointerMove = (event) => {
    if (!drag.current) return
    const cell = cellAt(event.clientX, event.clientY)
    if (!cell || same(cell, drag.current.to)) return
    drag.current = { ...drag.current, to: cell }
    setSelection(drag.current)
  }

  const onPointerUp = (event) => {
    const current = drag.current
    if (!current) return
    drag.current = null
    setSelection(null)
    const to = cellAt(event.clientX, event.clientY) || current.to
    if (same(current.from, to)) setAnchor(same(anchor, current.from) ? null : current.from)
    else {
      setAnchor(null)
      submit(current.from, to)
    }
  }

  const foundCount = board.words.filter((word) => word.foundBy).length

  return <div className="words">
    <p className="game-hint">Theme: <b>{board.theme}</b> · {foundCount} of {board.words.length} found{playing && ' · drag across a word, or tap its first and last letter'}</p>
    <div
      className={`words-grid${miss ? ' miss' : ''}${playing ? ' active' : ''}`}
      style={{ '--size': board.grid.length }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { drag.current = null; setSelection(null) }}
    >
      {board.grid.map((row, r) => [...row].map((letter, c) => {
        const key = `${r},${c}`
        const color = foundColors.get(key)
        return <span key={key} data-cell={key} className={`words-cell${previewCells.has(key) ? ' selecting' : ''}${color ? ' found' : ''}`} style={color ? { '--found': color } : undefined}>{letter}</span>
      }))}
    </div>
    <ul className="words-list">
      {board.words.map((word) => <li key={word.word} className={word.foundBy ? 'found' : ''} style={word.foundBy ? { '--found': colorOf(board.players, word.foundBy) } : undefined} title={word.foundBy ? `Found by ${nameOf(board.players, word.foundBy, selfId)}` : undefined}>{word.word}</li>)}
    </ul>
    <ul className="game-scores">
      {board.players.map((player, seat) => <li key={player.id} className={player.gone ? 'gone' : ''}>
        <i style={{ background: PLAYER_COLORS[seat] }} />{nameOf(board.players, player.id, selfId)}<span>{player.score}</span>
      </li>)}
    </ul>
  </div>
}
