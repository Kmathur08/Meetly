import {GAMES} from "../games/index.js";

// One game per room. A game goes lobby -> playing -> finished. Whoever opens it is the host:
// they start it, can end it early, and the role passes on if they leave.
// Kept free of socket.io so it can be unit tested.
export const createGameRegistry = ({random = Math.random} = {}) => {
    const sessions = new Map();

    const fail = (error) => ({ok: false, error});

    const open = (roomCode, host, type, options) => {
        const game = GAMES[type];
        if(!game) return fail("That game doesn't exist.");
        const current = sessions.get(roomCode);
        if(current && current.phase !== "finished") return fail("Finish the current game first.");

        sessions.set(roomCode, {
            type,
            options: game.normalizeOptions ? game.normalizeOptions(options) : {},
            phase: "lobby",
            hostId: host.id,
            players: [{id: host.id, name: host.name}],
            state: null
        });
        return {ok: true};
    };

    const join = (roomCode, participant) => {
        const session = sessions.get(roomCode);
        if(!session || session.phase !== "lobby") return fail("There's no game waiting for players.");
        if(session.players.some((player) => player.id === participant.id)) return {ok: true};
        if(session.players.length >= GAMES[session.type].maxPlayers) return fail("This game is full.");
        session.players.push({id: participant.id, name: participant.name});
        return {ok: true};
    };

    const dropPlayer = (roomCode, session, playerId) => {
        session.players = session.players.filter((player) => player.id !== playerId);
        if(session.hostId === playerId) session.hostId = session.players[0]?.id ?? null;
        if(session.phase === "lobby" && session.players.length === 0) sessions.delete(roomCode);
    };

    const leave = (roomCode, playerId) => {
        const session = sessions.get(roomCode);
        if(!session || session.phase !== "lobby") return fail("You can only step out before the game starts.");
        if(!session.players.some((player) => player.id === playerId)) return fail("You haven't joined this game.");
        dropPlayer(roomCode, session, playerId);
        return {ok: true};
    };

    const start = (roomCode, playerId) => {
        const session = sessions.get(roomCode);
        if(!session || session.phase !== "lobby") return fail("There's no game waiting to start.");
        if(session.hostId !== playerId) return fail("Only the host can start the game.");
        const game = GAMES[session.type];
        if(session.players.length < game.minPlayers) return fail(`${game.name} needs at least ${game.minPlayers} players.`);

        session.state = game.create(session.players, session.options, random);
        session.phase = "playing";
        return {ok: true};
    };

    const move = (roomCode, playerId, payload) => {
        const session = sessions.get(roomCode);
        if(!session || session.phase !== "playing") return fail("No game is being played.");
        const result = GAMES[session.type].move(session.state, playerId, payload);
        if(session.state.finished) session.phase = "finished";
        return result;
    };

    // The host can call off a lobby or a running game. A finished game can be closed by anyone.
    const close = (roomCode, playerId) => {
        const session = sessions.get(roomCode);
        if(!session) return fail("There's no game to close.");
        if(session.phase !== "finished" && session.hostId !== playerId) return fail("Only the host can end the game.");
        sessions.delete(roomCode);
        return {ok: true};
    };

    // After a game ends, anyone can set up the same game again; those still around stay signed up.
    const rematch = (roomCode, participant) => {
        const session = sessions.get(roomCode);
        if(!session || session.phase !== "finished") return fail("The game isn't over yet.");
        const players = session.players.some((player) => player.id === participant.id)
            ? session.players
            : [{id: participant.id, name: participant.name}, ...session.players];
        sessions.set(roomCode, {
            ...session,
            phase: "lobby",
            hostId: participant.id,
            players: players.slice(0, GAMES[session.type].maxPlayers),
            state: null
        });
        return {ok: true};
    };

    // Returns true when the game changed and everyone should get the new state.
    const memberLeft = (roomCode, playerId) => {
        const session = sessions.get(roomCode);
        if(!session) return false;
        const wasPlayer = session.players.some((player) => player.id === playerId);
        if(!wasPlayer && session.hostId !== playerId) return false;

        dropPlayer(roomCode, session, playerId);
        if(session.phase === "playing") {
            GAMES[session.type].removePlayer(session.state, playerId);
            if(session.state.finished) session.phase = "finished";
        }
        return true;
    };

    const view = (roomCode, viewerId) => {
        const session = sessions.get(roomCode);
        if(!session) return null;
        const game = GAMES[session.type];
        return {
            type: session.type,
            name: game.name,
            phase: session.phase,
            hostId: session.hostId,
            players: session.players,
            options: session.options,
            minPlayers: game.minPlayers,
            maxPlayers: game.maxPlayers,
            board: session.state ? game.view(session.state, viewerId) : null
        };
    };

    const remove = (roomCode) => sessions.delete(roomCode);

    return {open, join, leave, start, move, close, rematch, memberLeft, view, remove};
};
