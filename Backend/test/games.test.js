import {test} from "node:test";
import assert from "node:assert/strict";
import {createGameRegistry} from "../src/controllers/games.js";
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

test("game sessions: lobby, start, play and finish", () => {
    const games = createGameRegistry();
    assert.equal(games.open("r", A, "chess").ok, false);
    assert.equal(games.open("r", A, "tic-tac-toe").ok, true);
    assert.equal(games.open("r", B, "bingo").ok, false);
    assert.equal(games.start("r", "a").ok, false);
    assert.equal(games.join("r", B).ok, true);
    assert.equal(games.join("r", C).ok, false);
    assert.equal(games.start("r", "b").ok, false);
    assert.equal(games.start("r", "a").ok, true);

    assert.equal(games.view("r", "c").phase, "playing");
    for(const [player, cell] of [["a", 0], ["b", 3], ["a", 1], ["b", 4], ["a", 2]]) assert.equal(games.move("r", player, {cell}).ok, true);
    assert.equal(games.view("r", "a").phase, "finished");

    assert.equal(games.rematch("r", C).ok, true);
    const lobby = games.view("r", "c");
    assert.equal(lobby.phase, "lobby");
    assert.equal(lobby.hostId, "c");
    assert.equal(lobby.players.length, 2);
});

test("game sessions: a player leaving mid-game hands the win to the other", () => {
    const games = createGameRegistry();
    games.open("r", A, "tic-tac-toe");
    games.join("r", B);
    games.start("r", "a");
    assert.equal(games.memberLeft("r", "a"), true);

    const view = games.view("r", "b");
    assert.equal(view.phase, "finished");
    assert.deepEqual(view.board.winners, ["b"]);
    assert.equal(view.hostId, "b");
    assert.equal(games.memberLeft("r", "nobody"), false);
});

test("game sessions: only the host ends a running game, anyone closes a finished one", () => {
    const games = createGameRegistry();
    games.open("r", A, "word-search");
    assert.equal(games.leave("r", "a").ok, true);
    assert.equal(games.view("r", "a"), null);

    games.open("r", A, "bingo");
    games.join("r", B);
    games.start("r", "a");
    assert.equal(games.close("r", "b").ok, false);
    assert.equal(games.close("r", "a").ok, true);
    assert.equal(games.view("r", "a"), null);
});

test("fence race: pawns step, jump and win on reaching the far side", () => {
    const game = GAMES["fence-race"];
    const state = game.create([A, B], {size: 7});
    assert.deepEqual(state.pawns, [[6, 3], [0, 3]]);
    assert.equal(game.move(state, "a", {type: "step", r: 4, c: 3}).ok, false);
    play(game, state, [
        ["a", {type: "step", r: 5, c: 3}], ["b", {type: "step", r: 1, c: 3}],
        ["a", {type: "step", r: 4, c: 3}], ["b", {type: "step", r: 2, c: 3}],
        ["a", {type: "step", r: 3, c: 3}]
    ]);
    // Ben is face to face with Asha, so he can jump straight over her.
    assert.ok(game.view(state).steps.some(([r, c]) => r === 4 && c === 3));
    play(game, state, [["b", {type: "step", r: 4, c: 3}], ["a", {type: "step", r: 2, c: 3}],
        ["b", {type: "step", r: 5, c: 3}], ["a", {type: "step", r: 1, c: 3}], ["b", {type: "step", r: 6, c: 3}]]);
    assert.equal(state.finished, true);
    assert.deepEqual(state.winners, ["b"]);
});

test("fence race: fences block, can't overlap, and can't shut anyone in", () => {
    const game = GAMES["fence-race"];
    const state = game.create([A, B], {size: 7});
    play(game, state, [["a", {type: "fence", kind: "h", r: 4, c: 2}]]);
    assert.equal(state.players[0].fences, 5);
    // Overlapping along its length, or crossing it, is refused.
    assert.equal(game.move(state, "b", {type: "fence", kind: "h", r: 4, c: 3}).ok, false);
    assert.equal(game.move(state, "b", {type: "fence", kind: "v", r: 4, c: 2}).ok, false);
    // A fence right above Asha stops her stepping up.
    play(game, state, [["b", {type: "fence", kind: "h", r: 5, c: 3}]]);
    assert.equal(game.move(state, "a", {type: "step", r: 5, c: 3}).ok, false);

    // Close Asha in the bottom-right corner pocket bit by bit; the last fence must be refused.
    const boxed = game.create([A, B], {size: 7});
    boxed.pawns[0] = [6, 6];
    play(game, boxed, [["a", {type: "fence", kind: "h", r: 4, c: 5}], ["b", {type: "step", r: 1, c: 3}]]);
    const result = game.move(boxed, "a", {type: "fence", kind: "v", r: 5, c: 4});
    assert.equal(result.ok, false);
    assert.match(result.error, /shut someone in/);
});

test("fence race: a player leaving ends a two-player race", () => {
    const game = GAMES["fence-race"];
    const state = game.create([A, B, C]);
    assert.equal(state.players[0].fences, 7);
    assert.deepEqual(state.goals[2], {axis: "c", line: 8});
    game.removePlayer(state, "c");
    assert.equal(state.finished, false);
    game.removePlayer(state, "b");
    assert.deepEqual(state.winners, ["a"]);
});
