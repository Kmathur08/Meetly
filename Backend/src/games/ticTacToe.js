import {advanceTurn, baseState, checkTurn, finish, isInt, publicState, removePlayer} from "./turns.js";

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const MARKS = ["X", "O"];
// In the vanishing version each player keeps at most this many marks on the board.
const MAX_MARKS = 3;
// The vanishing version can't end in a full board, so call it a draw after this many moves.
const MAX_FADING_MOVES = 60;

const createTicTacToe = ({id, name, fading}) => ({
    id,
    name,
    minPlayers: 2,
    maxPlayers: 2,

    create(participants) {
        return {...baseState(participants), cells: Array(9).fill(null), history: [[], []], moves: 0, line: null};
    },

    move(state, playerId, move) {
        const problem = checkTurn(state, playerId);
        if(problem) return {ok: false, error: problem};
        const cell = move?.cell;
        if(!isInt(cell, 0, 8) || state.cells[cell] !== null) return {ok: false, error: "Pick an empty square."};

        const seat = state.current;
        const mark = MARKS[seat];
        state.cells[cell] = mark;
        state.history[seat].push(cell);
        state.moves += 1;

        // The oldest mark disappears as the fourth one goes down, before checking for a win.
        if(fading && state.history[seat].length > MAX_MARKS) state.cells[state.history[seat].shift()] = null;

        const line = LINES.find((cells) => cells.every((c) => state.cells[c] === mark));
        if(line) {
            state.line = line;
            finish(state, [playerId], "Three in a row!");
        } else if(!fading && state.cells.every(Boolean)) {
            finish(state, [], "The board is full.");
        } else if(fading && state.moves >= MAX_FADING_MOVES) {
            finish(state, [], `No winner after ${MAX_FADING_MOVES} moves.`);
        } else {
            advanceTurn(state);
        }
        return {ok: true};
    },

    view(state) {
        // In the vanishing version, show which mark goes next for anyone who already has three.
        const vanishing = fading
            ? state.history.filter((cells) => cells.length === MAX_MARKS).map((cells) => cells[0])
            : [];
        return {
            ...publicState(state),
            marks: Object.fromEntries(state.players.map((player, seat) => [player.id, MARKS[seat]])),
            cells: state.cells,
            line: state.line,
            vanishing,
            fading
        };
    },

    removePlayer(state, playerId) {
        removePlayer(state, playerId, 2);
    }
});

export const ticTacToe = createTicTacToe({id: "tic-tac-toe", name: "Zero & Cross", fading: false});
export const vanishingTicTacToe = createTicTacToe({id: "tic-tac-toe-fading", name: "Zero & Cross: Vanishing", fading: true});
