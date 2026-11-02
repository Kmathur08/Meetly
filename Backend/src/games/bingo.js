import {activePlayers, advanceTurn, baseState, checkTurn, finish, isInt, publicState, removePlayer, seatOf, shuffle} from "./turns.js";

// Each player has their own 5x5 card holding 1 to 25 in a random order. Players take turns calling
// a number, everyone crosses it off, and the first to complete five lines (rows, columns or
// diagonals) gets BINGO.
const SIZE = 5;
const NUMBERS = Array.from({length: SIZE * SIZE}, (_, i) => i + 1);
const LINES_TO_WIN = 5;

export const BINGO_LINES = (() => {
    const lines = [];
    for(let i = 0; i < SIZE; i += 1) {
        lines.push(Array.from({length: SIZE}, (_, j) => i * SIZE + j));
        lines.push(Array.from({length: SIZE}, (_, j) => j * SIZE + i));
    }
    lines.push(Array.from({length: SIZE}, (_, i) => i * SIZE + i));
    lines.push(Array.from({length: SIZE}, (_, i) => i * SIZE + (SIZE - 1 - i)));
    return lines;
})();

export const countLines = (card, called) => BINGO_LINES.filter((line) => line.every((cell) => called.has(card[cell]))).length;

export const bingo = {
    id: "bingo",
    name: "Bingo",
    minPlayers: 2,
    maxPlayers: 6,

    create(participants, _options, random = Math.random) {
        const state = baseState(participants);
        state.cards = Object.fromEntries(state.players.map((player) => [player.id, shuffle(NUMBERS, random)]));
        state.called = [];
        state.random = random;
        return state;
    },

    move(state, playerId, move) {
        // Before the first number is called, anyone can reshuffle their own card.
        if(move?.action === "shuffle") {
            if(state.finished || seatOf(state, playerId) === -1) return {ok: false, error: "You are watching this game."};
            if(state.called.length > 0) return {ok: false, error: "Cards are locked once numbers are called."};
            state.cards[playerId] = shuffle(NUMBERS, state.random);
            return {ok: true};
        }

        const problem = checkTurn(state, playerId);
        if(problem) return {ok: false, error: problem};
        const number = move?.number;
        if(!isInt(number, 1, SIZE * SIZE) || state.called.includes(number)) return {ok: false, error: "Pick a number that hasn't been called."};

        state.called.push(number);
        const called = new Set(state.called);
        for(const player of activePlayers(state)) player.score = countLines(state.cards[player.id], called);

        // One number can complete lines for several people at once; they share the win.
        const winners = activePlayers(state).filter((player) => player.score >= LINES_TO_WIN).map((player) => player.id);
        if(winners.length) finish(state, winners, "BINGO!");
        else advanceTurn(state);
        return {ok: true};
    },

    view(state, viewerId) {
        return {
            ...publicState(state),
            card: state.cards[viewerId] && seatOf(state, viewerId) !== -1 ? state.cards[viewerId] : null,
            // Everyone's card is revealed once the game is over.
            cards: state.finished ? state.cards : null,
            called: state.called,
            linesToWin: LINES_TO_WIN
        };
    },

    removePlayer(state, playerId) {
        removePlayer(state, playerId, 2);
    }
};
