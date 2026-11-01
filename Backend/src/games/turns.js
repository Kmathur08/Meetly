// Shared turn and player bookkeeping for the game engines.
// Players keep their seat (and colour) after leaving; they are just skipped from then on.

export const createPlayers = (participants) => participants.map(({id, name}) => ({id, name, score: 0, gone: false}));

export const baseState = (participants) => ({
    players: createPlayers(participants),
    current: 0,
    finished: false,
    winners: [],
    reason: ""
});

export const seatOf = (state, playerId) => state.players.findIndex((player) => player.id === playerId && !player.gone);

export const activePlayers = (state) => state.players.filter((player) => !player.gone);

export const checkTurn = (state, playerId) => {
    if(state.finished) return "The game is over.";
    const seat = seatOf(state, playerId);
    if(seat === -1) return "You are watching this game.";
    if(seat !== state.current) return "Wait for your turn.";
    return null;
};

export const advanceTurn = (state) => {
    const count = state.players.length;
    for(let step = 1; step <= count; step += 1) {
        const seat = (state.current + step) % count;
        if(!state.players[seat].gone) {
            state.current = seat;
            return;
        }
    }
};

export const finish = (state, winnerIds, reason = "") => {
    state.finished = true;
    state.winners = winnerIds;
    state.reason = reason;
};

export const topScorers = (state) => {
    const active = activePlayers(state);
    const best = Math.max(0, ...active.map((player) => player.score));
    return best === 0 ? [] : active.filter((player) => player.score === best).map((player) => player.id);
};

// Marks a player as gone. Below minPlayers the game ends and whoever is left wins.
export const removePlayer = (state, playerId, minPlayers) => {
    const seat = seatOf(state, playerId);
    if(seat === -1 || state.finished) return;
    const player = state.players[seat];
    player.gone = true;

    const left = activePlayers(state);
    if(left.length < minPlayers) {
        finish(state, left.map((p) => p.id), `${player.name} left the game.`);
        return;
    }
    if(state.current === seat) advanceTurn(state);
};

export const publicState = (state) => ({
    players: state.players.map(({id, name, score, gone}) => ({id, name, score, gone})),
    current: state.finished ? null : state.players[state.current]?.id ?? null,
    finished: state.finished,
    winners: state.winners,
    reason: state.reason
});

export const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export const shuffle = (items, random = Math.random) => {
    const list = [...items];
    for(let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
};
