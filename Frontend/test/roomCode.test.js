import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRoomCode, parseRoomCode } from '../src/lib/roomCode.js'

test('new room codes look like abc-defg-hij and differ each time', () => {
  const codes = new Set(Array.from({ length: 200 }, createRoomCode))
  assert.equal(codes.size, 200)
  for (const code of codes) assert.match(code, /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/)
})

test('invite links and bare codes both resolve to the code', () => {
  assert.equal(parseRoomCode('https://meetly.app/#meet/abc-defg-hij'), 'abc-defg-hij')
  assert.equal(parseRoomCode('  team-standup  '), 'team-standup')
  assert.equal(parseRoomCode('#meet/abc-defg-hij'), 'abc-defg-hij')
})

test('unusable input gives an empty code', () => {
  assert.equal(parseRoomCode(''), '')
  assert.equal(parseRoomCode('has spaces'), '')
  assert.equal(parseRoomCode('#meet'), '')
  assert.equal(parseRoomCode(undefined), '')
})
