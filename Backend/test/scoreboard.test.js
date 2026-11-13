import {test} from "node:test";
import assert from "node:assert/strict";
import {createGameRegistry} from "../src/controllers/games.js";
import {createScoreboard} from "../src/controllers/scoreboard.js";

const A = {id: "sa", name: "Asha", userId: "ua"};
const B = {id: "sb", name: "Ben", userId: "ub"};

// Plays one game of zero & cross in which `winner` ("a" or "b") gets the top row, or a draw.
const playTicTacToe = (games, result) => {
    games.open("r", A, "tic-tac-toe");
    games.join("r", B);
    games.start("r", "sa");
    const moves = {
        a: [["sa", 0], ["sb", 3], ["sa", 1], ["sb", 4], ["sa", 2]],
        b: [["sa", 0], ["sb", 3], ["sa", 1], ["sb", 4], ["sa", 8], ["sb", 5]],
        draw: [0, 1, 2, 4, 3, 5, 7, 6, 8].map((cell, i) => [i % 2 ? "sb" : "sa", cell])
    }[result];
    for(const [player, cell] of moves) assert.equal(games.move("r", player, {cell}).ok, true);
    games.close("r", "sa");
};

test("scoreboard: wins add up across games, keyed by account", () => {
    const scores = createScoreboard();
    const games = createGameRegistry({onResult: scores.record});
    playTicTacToe(games, "a");
    playTicTacToe(games, "a");
    playTicTacToe(games, "b");
    playTicTacToe(games, "draw");

    const view = scores.view("r", "ua", ["ua", "ub"]);
    assert.deepEqual(view.rows.map(({name, wins, you}) => ({name, wins, you})), [
        {name: "Asha", wins: 2, you: true},
        {name: "Ben", wins: 1, you: false}
    ]);
    // A reconnect is a new socket but the same account, so the score carries on.
    games.open("r", {...A, id: "sa2"}, "tic-tac-toe");
    assert.equal(scores.view("r", "ua", ["ua"]).rows[0].wins, 2);
});

test("scoreboard: resets to 0 only when everyone here agrees", () => {
    const scores = createScoreboard();
    scores.record("r", [{userId: "ua", name: "Asha"}, {userId: "ub", name: "Ben"}], ["ua"]);

    assert.deepEqual(scores.vote("r", "ua", true, ["ua", "ub"]), {ok: true, reset: false});
    let view = scores.view("r", "ub", ["ua", "ub"]);
    assert.equal(view.resetRequested, true);
    assert.deepEqual(view.waitingFor, ["Ben"]);

    // Taking it back cancels the request.
    scores.vote("r", "ua", false, ["ua", "ub"]);
    assert.equal(scores.view("r", "ub", ["ua", "ub"]).resetRequested, false);

    scores.vote("r", "ua", true, ["ua", "ub"]);
    assert.deepEqual(scores.vote("r", "ub", true, ["ua", "ub"]), {ok: true, reset: true});
    view = scores.view("r", "ua", ["ua", "ub"]);
    assert.deepEqual(view.rows.map((row) => row.wins), [0, 0]);
    assert.equal(view.resetRequested, false);
    assert.equal(scores.vote("r", "ua", true, ["ua", "ub"]).ok, false);
});

test("scoreboard: a new win cancels a pending reset, and outsiders can't vote", () => {
    const scores = createScoreboard();
    scores.record("r", [{userId: "ua", name: "Asha"}, {userId: "ub", name: "Ben"}], ["ua"]);
    scores.vote("r", "ua", true, ["ua", "ub"]);
    scores.record("r", [{userId: "ua", name: "Asha"}, {userId: "ub", name: "Ben"}], ["ub"]);
    assert.equal(scores.view("r", "ua", ["ua", "ub"]).resetRequested, false);
    assert.equal(scores.vote("r", "uc", true, ["ua", "ub", "uc"]).ok, false);
});

test("scoreboard: if the only holdout leaves, the reset goes through", () => {
    const scores = createScoreboard();
    scores.record("r", [{userId: "ua", name: "Asha"}, {userId: "ub", name: "Ben"}], ["ua"]);
    scores.vote("r", "ua", true, ["ua", "ub"]);
    assert.equal(scores.memberLeft("r", "ub", ["ua"]), true);
    assert.equal(scores.view("r", "ua", ["ua"]).rows[0].wins, 0);
});

test("scoreboard: one account in two seats scores once per win", () => {
    const scores = createScoreboard();
    scores.record("r", [{userId: "ua", name: "Asha"}, {userId: "ua", name: "Asha"}, {userId: "ub", name: "Ben"}], ["ua", "ua"]);
    assert.deepEqual(scores.view("r", "ua", ["ua", "ub"]).rows.map((row) => row.wins), [1, 0]);
});
