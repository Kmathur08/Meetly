// Wins per person for one room, kept across games until everyone agrees to reset.
// People are keyed by account id, so a reconnect (new socket) keeps their score.
// Kept free of socket.io so it can be unit tested.
export const createScoreboard = () => {
    const boards = new Map();

    const boardOf = (roomCode) => {
        if(!boards.has(roomCode)) boards.set(roomCode, {people: new Map(), votes: new Set()});
        return boards.get(roomCode);
    };

    // Everyone who played gets a row (even with 0 wins); each winner gets a point.
    // A draw has no winners, and a shared win gives each of them a point.
    // One account playing from two tabs still gets at most one point per game.
    const record = (roomCode, players, winnerIds) => {
        const board = boardOf(roomCode);
        const accounts = new Map(players.map((player) => [player.userId, player.name]));
        const winners = new Set(winnerIds);
        for(const [userId, name] of accounts) {
            const row = board.people.get(userId) || {name, wins: 0};
            row.name = name;
            if(winners.has(userId)) row.wins += 1;
            board.people.set(userId, row);
        }
        // The score moved on, so an old reset request no longer applies.
        board.votes.clear();
    };

    // Who must agree to a reset: the people on the scoreboard who are still in the room.
    const needed = (board, presentUserIds) => [...board.people.keys()].filter((userId) => presentUserIds.includes(userId));

    const resetIfAgreed = (board, presentUserIds) => {
        const voters = needed(board, presentUserIds);
        if(voters.length === 0 || !voters.every((userId) => board.votes.has(userId))) return false;
        for(const row of board.people.values()) row.wins = 0;
        board.votes.clear();
        return true;
    };

    // agree = true asks for (or agrees to) a reset; false takes the request back.
    const vote = (roomCode, userId, agree, presentUserIds) => {
        const board = boards.get(roomCode);
        if(!board || !board.people.has(userId)) return {ok: false, error: "Only people on the scoreboard can reset it."};
        if(agree && [...board.people.values()].every((row) => row.wins === 0)) return {ok: false, error: "The scores are already 0."};
        if(agree) board.votes.add(userId);
        else board.votes.delete(userId);
        return {ok: true, reset: agree ? resetIfAgreed(board, presentUserIds) : false};
    };

    // Someone left: drop their vote, and if everyone still here had agreed, reset now.
    // Returns true when the scoreboard changed.
    const memberLeft = (roomCode, userId, presentUserIds) => {
        const board = boards.get(roomCode);
        if(!board || presentUserIds.includes(userId)) return false;
        const hadVote = board.votes.delete(userId);
        return resetIfAgreed(board, presentUserIds) || hadVote;
    };

    // What one person sees. Account ids stay on the server; rows say only whether they are you.
    const view = (roomCode, viewerUserId, presentUserIds) => {
        const board = boards.get(roomCode);
        if(!board || board.people.size === 0) return null;
        const voters = needed(board, presentUserIds);
        return {
            rows: [...board.people.entries()]
                .map(([userId, row]) => ({
                    name: row.name,
                    wins: row.wins,
                    you: userId === viewerUserId,
                    here: presentUserIds.includes(userId),
                    agreed: board.votes.has(userId)
                }))
                .sort((a, b) => b.wins - a.wins),
            resetRequested: board.votes.size > 0,
            waitingFor: voters.filter((userId) => !board.votes.has(userId)).map((userId) => board.people.get(userId).name)
        };
    };

    const remove = (roomCode) => boards.delete(roomCode);

    return {record, vote, memberLeft, view, remove};
};
