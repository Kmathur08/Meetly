// Tracks who is in which meeting room. Kept free of socket.io so it can be unit tested.
export const createRoomRegistry = () => {
    const rooms = new Map();
    const membership = new Map();

    const peersOf = (roomCode) => [...(rooms.get(roomCode)?.members.values() || [])];

    const join = (roomCode, participant) => {
        if(membership.has(participant.id)) leave(participant.id);

        if(!rooms.has(roomCode)) rooms.set(roomCode, {members: new Map(), messages: []});
        const room = rooms.get(roomCode);
        const peers = peersOf(roomCode);

        room.members.set(participant.id, participant);
        membership.set(participant.id, roomCode);
        return {ok: true, peers, messages: [...room.messages]};
    };

    const leave = (socketId) => {
        const roomCode = membership.get(socketId);
        if(roomCode === undefined) return null;

        membership.delete(socketId);
        const room = rooms.get(roomCode);
        room.members.delete(socketId);
        const empty = room.members.size === 0;
        if(empty) rooms.delete(roomCode);
        return {roomCode, empty};
    };

    const roomOf = (socketId) => membership.get(socketId);

    const participant = (socketId) => {
        const roomCode = membership.get(socketId);
        return roomCode === undefined ? undefined : rooms.get(roomCode).members.get(socketId);
    };

    const addMessage = (roomCode, message) => {
        const room = rooms.get(roomCode);
        if(!room) return;
        room.messages.push(message);
    };

    const sameRoom = (a, b) => membership.has(a) && membership.get(a) === membership.get(b);

    return {join, leave, roomOf, participant, peersOf, addMessage, sameRoom};
};
