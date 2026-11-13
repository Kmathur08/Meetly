import {advanceTurn, baseState, checkTurn, finish, isInt, publicState, removePlayer, seatOf} from "./turns.js";

// Fence Race: race your pawn to the far side of the board. Each turn either step one square or
// drop a two-square fence to slow someone down, but every player must always keep a way through.
export const BOARD_SIZES = [7, 9];
const DEFAULT_SIZE = 9;

// Fences per player, by board size and player count.
const FENCES = {7: {2: 6, 3: 5, 4: 4}, 9: {2: 10, 3: 7, 4: 5}};

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Seat 0 starts at the bottom and heads up, seat 1 the reverse; seats 2 and 3 cross left and right.
const seatSetup = (seat, n) => {
    const mid = Math.floor(n / 2);
    return [
        {pos: [n - 1, mid], goal: {axis: "r", line: 0}},
        {pos: [0, mid], goal: {axis: "r", line: n - 1}},
        {pos: [mid, 0], goal: {axis: "c", line: n - 1}},
        {pos: [mid, n - 1], goal: {axis: "c", line: 0}}
    ][seat];
};

const atGoal = ([r, c], goal) => (goal.axis === "r" ? r : c) === goal.line;

// A fence is anchored on the groove crossing below-right of cell (r, c).
// "h" runs along the bottom of (r, c) and (r, c + 1); "v" along the right of (r, c) and (r + 1, c).
const fenceKey = (kind, r, c) => `${kind}${r},${c}`;

const blocked = (state, [r, c], [dr, dc]) => {
    const has = (kind, fr, fc) => state.fenceSet.has(fenceKey(kind, fr, fc));
    if(dr === 1) return has("h", r, c) || has("h", r, c - 1);
    if(dr === -1) return has("h", r - 1, c) || has("h", r - 1, c - 1);
    if(dc === 1) return has("v", r, c) || has("v", r - 1, c);
    return has("v", r, c - 1) || has("v", r - 1, c - 1);
};

const onBoard = (state, [r, c]) => r >= 0 && c >= 0 && r < state.size && c < state.size;

const canPass = (state, from, dir) => {
    const to = [from[0] + dir[0], from[1] + dir[1]];
    return onBoard(state, to) && !blocked(state, from, dir);
};

const pawnAt = (state, [r, c]) => state.players.findIndex((player, seat) =>
    !player.gone && state.pawns[seat][0] === r && state.pawns[seat][1] === c);

// Squares the seat can step to. A pawn in the way can be jumped; if a fence or the edge stops
// the jump, the player may slip diagonally past it instead.
export const legalSteps = (state, seat) => {
    const from = state.pawns[seat];
    const steps = [];
    const add = (cell) => {
        if(pawnAt(state, cell) === -1 && !steps.some(([r, c]) => r === cell[0] && c === cell[1])) steps.push(cell);
    };
    for(const dir of DIRS) {
        if(!canPass(state, from, dir)) continue;
        const next = [from[0] + dir[0], from[1] + dir[1]];
        if(pawnAt(state, next) === -1) {
            add(next);
            continue;
        }
        const beyond = [next[0] + dir[0], next[1] + dir[1]];
        if(canPass(state, next, dir) && pawnAt(state, beyond) === -1) {
            add(beyond);
            continue;
        }
        for(const side of dir[0] === 0 ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]]) {
            if(canPass(state, next, side)) add([next[0] + side[0], next[1] + side[1]]);
        }
    }
    return steps;
};

// Pawns don't count here: they move, fences don't.
const hasPath = (state, seat) => {
    const goal = state.goals[seat];
    const seen = new Set();
    const queue = [state.pawns[seat]];
    seen.add(queue[0].join(","));
    while(queue.length) {
        const cell = queue.shift();
        if(atGoal(cell, goal)) return true;
        for(const dir of DIRS) {
            if(!canPass(state, cell, dir)) continue;
            const next = [cell[0] + dir[0], cell[1] + dir[1]];
            const key = next.join(",");
            if(!seen.has(key)) {
                seen.add(key);
                queue.push(next);
            }
        }
    }
    return false;
};

const fenceClash = (state, kind, r, c) => {
    const has = (k, fr, fc) => state.fenceSet.has(fenceKey(k, fr, fc));
    if(has("h", r, c) || has("v", r, c)) return true;
    return kind === "h" ? has("h", r, c - 1) || has("h", r, c + 1) : has("v", r - 1, c) || has("v", r + 1, c);
};

export const fenceRace = {
    id: "fence-race",
    name: "Fence Race",
    minPlayers: 2,
    maxPlayers: 4,

    normalizeOptions(options) {
        return {size: BOARD_SIZES.includes(options?.size) ? options.size : DEFAULT_SIZE};
    },

    create(participants, options) {
        const {size} = this.normalizeOptions(options);
        const setups = participants.map((_, seat) => seatSetup(seat, size));
        const base = baseState(participants);
        const fences = FENCES[size][participants.length] ?? FENCES[size][4];
        base.players.forEach((player) => {
            player.fences = fences;
        });
        return {
            ...base,
            size,
            pawns: setups.map((setup) => setup.pos),
            goals: setups.map((setup) => setup.goal),
            fences: [],
            fenceSet: new Set(),
            last: null
        };
    },

    move(state, playerId, move) {
        const problem = checkTurn(state, playerId);
        if(problem) return {ok: false, error: problem};
        const seat = seatOf(state, playerId);
        const player = state.players[seat];
        const {type, kind, r, c} = move || {};

        if(type === "step") {
            const target = legalSteps(state, seat).find(([sr, sc]) => sr === r && sc === c);
            if(!target) return {ok: false, error: "You can't move there."};
            state.pawns[seat] = target;
            state.last = {type, seat};
            if(atGoal(target, state.goals[seat])) {
                finish(state, [player.id], `${player.name} made it across.`);
            } else {
                advanceTurn(state);
            }
            return {ok: true};
        }

        if(type === "fence") {
            const max = state.size - 2;
            if(!(kind === "h" || kind === "v") || !isInt(r, 0, max) || !isInt(c, 0, max)) {
                return {ok: false, error: "That isn't a spot for a fence."};
            }
            if(player.fences <= 0) return {ok: false, error: "You have no fences left."};
            if(fenceClash(state, kind, r, c)) return {ok: false, error: "That fence overlaps another one."};

            const key = fenceKey(kind, r, c);
            state.fenceSet.add(key);
            const trapped = state.players.some((other, otherSeat) => !other.gone && !hasPath(state, otherSeat));
            if(trapped) {
                state.fenceSet.delete(key);
                return {ok: false, error: "That would shut someone in. Everyone needs a way through."};
            }
            state.fences.push({kind, r, c, seat});
            player.fences -= 1;
            state.last = {type, kind, r, c};
            advanceTurn(state);
            return {ok: true};
        }

        return {ok: false, error: "Move your pawn or place a fence."};
    },

    view(state) {
        const current = state.finished ? -1 : state.current;
        return {
            ...publicState(state),
            players: state.players.map(({id, name, gone, fences}) => ({id, name, gone, fences})),
            size: state.size,
            pawns: state.pawns,
            goals: state.goals,
            fences: state.fences,
            last: state.last,
            steps: current === -1 ? [] : legalSteps(state, current)
        };
    },

    removePlayer(state, playerId) {
        removePlayer(state, playerId, 2);
    }
};
