import {test} from "node:test";
import assert from "node:assert/strict";
import {GAMES} from "../src/games/index.js";
import {BINGO_LINES, countLines} from "../src/games/bingo.js";
import {buildPuzzle, GRID_SIZE} from "../src/games/wordSearch.js";

const A = {id: "a", name: "Asha"};
const B = {id: "b", name: "Ben"};
const C = {id: "c", name: "Chitra"};

const play = (game, state, moves) => {
    for(const [player, move] of moves) {
        const result = game.move(state, player, move);
        assert.equal(result.ok, true, `${player} ${JSON.stringify(move)}: ${result.error}`);
    }
};

test("zero & cross: three in a row wins and turns alternate", () => {
    const game = GAMES["tic-tac-toe"];
    const state = game.create([A, B]);
    assert.equal(game.move(state, "b", {cell: 0}).ok, false);
    play(game, state, [["a", {cell: 0}], ["b", {cell: 3}], ["a", {cell: 1}], ["b", {cell: 4}], ["a", {cell: 2}]]);

    const view = game.view(state);
    assert.deepEqual(view.winners, ["a"]);
    assert.deepEqual(view.line, [0, 1, 2]);
    assert.equal(game.move(state, "b", {cell: 5}).ok, false);
});

test("zero & cross: a full board with no line is a draw", () => {
    const game = GAMES["tic-tac-toe"];
    const state = game.create([A, B]);
    play(game, state, [0, 1, 2, 4, 3, 5, 7, 6, 8].map((cell, i) => [i % 2 ? "b" : "a", {cell}]));
    assert.equal(state.finished, true);
    assert.deepEqual(state.winners, []);
});

test("vanishing zero & cross: the fourth mark removes the oldest one", () => {
    const game = GAMES["tic-tac-toe-fading"];
    const state = game.create([A, B]);
    play(game, state, [["a", {cell: 0}], ["b", {cell: 3}], ["a", {cell: 1}], ["b", {cell: 4}], ["a", {cell: 8}], ["b", {cell: 7}]]);
    assert.deepEqual(game.view(state).vanishing, [0, 3]);

    play(game, state, [["a", {cell: 6}]]);
    assert.equal(state.cells[0], null);
    assert.equal(state.cells[6], "X");
    assert.equal(state.cells.filter((cell) => cell === "X").length, 3);
});

test("vanishing zero & cross: the mark that vanishes can't count towards a line", () => {
    const game = GAMES["tic-tac-toe-fading"];
    const state = game.create([A, B]);
    // X holds 0 and 1 (oldest is 0) plus 8; placing 2 removes 0 first, so 0-1-2 is not a win.
    play(game, state, [["a", {cell: 0}], ["b", {cell: 3}], ["a", {cell: 1}], ["b", {cell: 4}], ["a", {cell: 8}], ["b", {cell: 6}], ["a", {cell: 2}]]);
    assert.equal(state.finished, false);
    assert.equal(state.cells[0], null);
});

test("bingo: lines are counted across rows, columns and diagonals", () => {
    assert.equal(BINGO_LINES.length, 12);
    const card = Array.from({length: 25}, (_, i) => i + 1);
    assert.equal(countLines(card, new Set([1, 2, 3, 4, 5])), 1);
    assert.equal(countLines(card, new Set([1, 7, 13, 19, 25, 2, 3, 4, 5])), 2);
});

test("bingo: cards stay private and the first to five lines wins", () => {
    const game = GAMES.bingo;
    const state = game.create([A, B], {}, () => 0.5);
    state.cards.a = Array.from({length: 25}, (_, i) => i + 1);

    assert.equal(game.view(state, "b").card.length, 25);
    assert.equal(game.view(state, "b").cards, null);
    assert.equal(game.view(state, "spectator").card, null);

    // Calling four columns of Asha's card, then 5, completes four columns, the top row and a diagonal.
    const calls = [1, 6, 11, 16, 21, 2, 7, 12, 17, 22, 3, 8, 13, 18, 23, 4, 9, 14, 19, 24, 5];
    let turn = 0;
    for(const number of calls) {
        if(state.finished) break;
        const player = turn % 2 ? "b" : "a";
        assert.equal(game.move(state, player, {number}).ok, true);
        turn += 1;
    }
    assert.equal(state.finished, true);
    assert.ok(state.winners.includes("a"));
    assert.ok(game.view(state, "b").cards.a);
});

test("bingo: numbers can't be called twice and cards lock after the first call", () => {
    const game = GAMES.bingo;
    const state = game.create([A, B]);
    assert.equal(game.move(state, "b", {action: "shuffle"}).ok, true);
    play(game, state, [["a", {number: 7}]]);
    assert.equal(game.move(state, "b", {number: 7}).ok, false);
    assert.equal(game.move(state, "b", {action: "shuffle"}).ok, false);
});

test("dots & houses: closing a box scores and gives another turn", () => {
    const game = GAMES["dots-and-boxes"];
    const state = game.create([A, B], {dots: 4});
    play(game, state, [
        ["a", {kind: "h", r: 0, c: 0}],
        ["b", {kind: "h", r: 1, c: 0}],
        ["a", {kind: "v", r: 0, c: 0}],
        ["b", {kind: "v", r: 0, c: 1}]
    ]);
    assert.equal(state.players[1].score, 1);
    assert.equal(state.boxes[0], 1);
    // Ben closed a box, so it's still Ben's turn.
    assert.equal(game.view(state).current, "b");
    assert.equal(game.move(state, "b", {kind: "h", r: 0, c: 0}).ok, false);
    assert.equal(game.move(state, "b", {kind: "h", r: 9, c: 0}).ok, false);
});

test("dots & houses: the game ends when every box is built", () => {
    const game = GAMES["dots-and-boxes"];
    const state = game.create([A, B], {dots: 99});
    assert.equal(game.view(state).dots, 5);

    const small = game.create([A, B], {dots: 4});
    const lines = [];
    for(let r = 0; r <= 3; r += 1) for(let c = 0; c < 3; c += 1) lines.push({kind: "h", r, c});
    for(let r = 0; r < 3; r += 1) for(let c = 0; c <= 3; c += 1) lines.push({kind: "v", r, c});
    for(const line of lines) {
        const current = game.view(small).current;
        assert.equal(game.move(small, current, line).ok, true);
    }
    assert.equal(small.finished, true);
    assert.equal(small.players[0].score + small.players[1].score, 9);
});

test("word search: every placed word reads correctly in the grid", () => {
    const words = ["ELEPHANT", "TIGER", "ZEBRA", "LION", "PANDA", "CAMEL", "RABBIT", "PARROT"];
    const {grid, placed} = buildPuzzle(words);
    assert.equal(grid.length, GRID_SIZE);
    assert.ok(grid.every((row) => /^[A-Z]+$/.test(row) && row.length === GRID_SIZE));
    assert.ok(placed.length >= 6);
    for(const {word, cells} of placed) assert.equal(cells.map(([r, c]) => grid[r][c]).join(""), word);
});

test("word search: the first finder claims a word, forwards or backwards", () => {
    const game = GAMES["word-search"];
    const state = game.create([A, B], {theme: "Fruits"});
    assert.equal(state.theme, "Fruits");
    const [first, ...rest] = state.words;
    const start = first.cells[0];
    const end = first.cells[first.cells.length - 1];

    assert.equal(game.view(state).words[0].cells, null);
    assert.equal(game.move(state, "a", {from: [0, 0], to: [0, 0]}).ok, false);
    assert.equal(game.move(state, "b", {from: end, to: start}).ok, true);
    assert.equal(game.move(state, "a", {from: start, to: end}).ok, false);
    assert.equal(state.players[1].score, 1);

    for(const word of rest) play(game, state, [["a", {from: word.cells[0], to: word.cells[word.cells.length - 1]}]]);
    assert.equal(state.finished, true);
    assert.deepEqual(state.winners, rest.length > 1 ? ["a"] : ["a", "b"]);
});
