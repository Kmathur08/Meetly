import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lineCells, statusText } from '../src/games/catalog.js'

test('word search selections only follow straight lines', () => {
  assert.deepEqual(lineCells([0, 0], [0, 3]), [[0, 0], [0, 1], [0, 2], [0, 3]])
  assert.deepEqual(lineCells([3, 3], [1, 1]), [[3, 3], [2, 2], [1, 1]])
  assert.deepEqual(lineCells([2, 0], [0, 2]), [[2, 0], [1, 1], [0, 2]])
  assert.equal(lineCells([0, 0], [1, 2]), null)
})

test('the status line names whose turn it is and who won', () => {
  const players = [{ id: 'a', name: 'Asha' }, { id: 'b', name: 'Ben' }, { id: 'c', name: 'Chitra' }]
  const base = { players, winners: [], finished: false, current: 'a' }
  assert.equal(statusText(base, 'a'), 'Your turn')
  assert.equal(statusText(base, 'b'), 'Asha’s turn')
  assert.equal(statusText({ ...base, finished: true }, 'a'), 'It’s a draw.')
  assert.equal(statusText({ ...base, finished: true, winners: ['b'] }, 'b'), 'You win! 🎉')
  assert.equal(statusText({ ...base, finished: true, winners: ['a', 'b', 'c'] }, 'c'), 'Asha, Ben and You share the win!')
})
