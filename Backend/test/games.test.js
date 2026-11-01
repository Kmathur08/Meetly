import {test} from "node:test";
import assert from "node:assert/strict";
import {GAMES} from "../src/games/index.js";

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
