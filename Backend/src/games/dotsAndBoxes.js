import {advanceTurn, baseState, checkTurn, finish, isInt, publicState, removePlayer, seatOf, topScorers} from "./turns.js";

// Dots and boxes ("Dots & Houses"): players take turns joining two neighbouring dots. Closing the
// fourth side of a box builds a house there, scores a point and earns another turn.
export const DOT_SIZES = [4, 5, 6, 7];
const DEFAULT_DOTS = 5;

// Horizontal line (r, c) runs from dot (r, c) to (r, c + 1): (n + 1) rows of n lines.
// Vertical line (r, c) runs from dot (r, c) to (r + 1, c): n rows of (n + 1) lines. n = boxes per side.
const hIndex = (n, r, c) => r * n + c;
const vIndex = (n, r, c) => r * (n + 1) + c;

const boxClosed = (state, r, c) => {
    const n = state.boxesPerSide;
    return state.h[hIndex(n, r, c)] !== null && state.h[hIndex(n, r + 1, c)] !== null
        && state.v[vIndex(n, r, c)] !== null && state.v[vIndex(n, r, c + 1)] !== null;
};

export const dotsAndBoxes = {
    id: "dots-and-boxes",
    name: "Dots & Houses",
    minPlayers: 2,
    maxPlayers: 4,

    normalizeOptions(options) {
        return {dots: DOT_SIZES.includes(options?.dots) ? options.dots : DEFAULT_DOTS};
    },

    create(participants, options) {
        const n = this.normalizeOptions(options).dots - 1;
        return {
            ...baseState(participants),
            boxesPerSide: n,
            h: Array((n + 1) * n).fill(null),
            v: Array(n * (n + 1)).fill(null),
            boxes: Array(n * n).fill(null),
            last: null
        };
    },

    move(state, playerId, move) {
        const problem = checkTurn(state, playerId);
        if(problem) return {ok: false, error: problem};

        const n = state.boxesPerSide;
        const {kind, r, c} = move || {};
        let lines;
        let index;
        let touching;
        if(kind === "h" && isInt(r, 0, n) && isInt(c, 0, n - 1)) {
            lines = state.h;
            index = hIndex(n, r, c);
            touching = [[r - 1, c], [r, c]];
        } else if(kind === "v" && isInt(r, 0, n - 1) && isInt(c, 0, n)) {
            lines = state.v;
            index = vIndex(n, r, c);
            touching = [[r, c - 1], [r, c]];
        } else {
            return {ok: false, error: "That isn't a line on the board."};
        }
        if(lines[index] !== null) return {ok: false, error: "That line is already drawn."};

        const seat = seatOf(state, playerId);
        lines[index] = seat;
        state.last = {kind, r, c};

        let built = 0;
        for(const [br, bc] of touching) {
            if(br < 0 || bc < 0 || br >= n || bc >= n) continue;
            const box = br * n + bc;
            if(state.boxes[box] === null && boxClosed(state, br, bc)) {
                state.boxes[box] = seat;
                built += 1;
            }
        }
        state.players[seat].score += built;

        if(state.boxes.every((owner) => owner !== null)) {
            const winners = topScorers(state);
            finish(state, winners, winners.length > 1 ? "Tied on houses." : "Every house is built.");
        } else if(built === 0) {
            advanceTurn(state);
        }
        return {ok: true};
    },

    view(state) {
        return {...publicState(state), dots: state.boxesPerSide + 1, h: state.h, v: state.v, boxes: state.boxes, last: state.last};
    },

    removePlayer(state, playerId) {
        removePlayer(state, playerId, 2);
    }
};
