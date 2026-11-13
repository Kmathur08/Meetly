import { Server } from "socket.io";
import {isAllowedOrigin} from "../config/env.js";
import {findSession} from "../middleware/auth.js";
import {isValidRoomCode} from "../utils/validate.js";
import {createGameRegistry} from "./games.js";
import {createRoomRegistry} from "./rooms.js";
import {createScoreboard} from "./scoreboard.js";

const MAX_CHAT_LENGTH = 500;

// Allows at most `limit` calls per `windowMs` for one connection.
const createLimiter = (limit, windowMs) => {
    let windowStart = 0;
    let count = 0;
    return () => {
        const now = Date.now();
        if(now - windowStart > windowMs) {
            windowStart = now;
            count = 0;
        }
        count += 1;
        return count <= limit;
    };
};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
            methods: ["GET", "POST"]
        },
        maxHttpBufferSize: 64 * 1024
    });
    const rooms = createRoomRegistry();
    const scores = createScoreboard();
    const games = createGameRegistry({onResult: scores.record});

    // Account ids of the people in a room (members are tracked by connection).
    const userIdOf = (socketId) => io.sockets.sockets.get(socketId)?.data.user?.id;
    const presentUsers = (roomCode) => rooms.peersOf(roomCode).map((member) => userIdOf(member.id)).filter(Boolean);
    const scoreView = (roomCode, socketId) => scores.view(roomCode, userIdOf(socketId), presentUsers(roomCode));

    // Every member gets their own view: a Bingo card, for example, is only sent to its owner,
    // and the scoreboard marks which row is theirs.
    const broadcastGame = (roomCode) => {
        for(const member of rooms.peersOf(roomCode)) {
            io.to(member.id).emit("game-state", games.view(roomCode, member.id));
            io.to(member.id).emit("scoreboard", scoreView(roomCode, member.id));
        }
    };
    const broadcastScores = (roomCode) => {
        for(const member of rooms.peersOf(roomCode)) io.to(member.id).emit("scoreboard", scoreView(roomCode, member.id));
    };

    io.use(async (socket, next) => {
        try {
            const session = await findSession(socket.handshake.auth?.token);
            if(!session) return next(new Error("unauthorized"));
            socket.data.user = {id: session.user._id.toString(), name: session.user.name};
            next();
        } catch {
            next(new Error("unauthorized"));
        }
    });

    const leaveCurrentRoom = (socket) => {
        const left = rooms.leave(socket.id);
        if(!left) return;
        socket.leave(left.roomCode);
        socket.to(left.roomCode).emit("peer-left", socket.id);
        if(left.empty) {
            games.remove(left.roomCode);
            scores.remove(left.roomCode);
            return;
        }
        // Their pending reset vote goes; who is "here" changes for everyone either way.
        scores.memberLeft(left.roomCode, socket.data.user.id, presentUsers(left.roomCode));
        if(games.memberLeft(left.roomCode, socket.id)) broadcastGame(left.roomCode);
        else broadcastScores(left.roomCode);
    };

    io.on("connection", (socket) => {
        const reply = (ack, payload) => typeof ack === "function" && ack(payload);
        const chatAllowed = createLimiter(10, 10000);
        const gameAllowed = createLimiter(30, 5000);
        const self = () => ({id: socket.id, name: socket.data.user.name, userId: socket.data.user.id});

        socket.on("join-room", (roomCode, ack) => {
            if(!isValidRoomCode(roomCode)) return reply(ack, {ok: false, error: "That meeting code isn't valid."});

            // Switching rooms on the same connection must tell the old room we left.
            leaveCurrentRoom(socket);

            const participant = {id: socket.id, name: socket.data.user.name};
            const result = rooms.join(roomCode, participant);
            if(!result.ok) return reply(ack, {ok: false, error: result.error});

            socket.join(roomCode);
            socket.to(roomCode).emit("peer-joined", participant);
            reply(ack, {ok: true, self: participant, peers: result.peers, messages: result.messages, game: games.view(roomCode, socket.id), scoreboard: scoreView(roomCode, socket.id)});
            // Someone back on the scoreboard changes who still has to agree to a reset.
            broadcastScores(roomCode);
        });

        socket.on("signal", (toId, signalMessage) => {
            // Only relay between people in the same room, so a socket can't message arbitrary users.
            if(typeof toId !== "string" || !rooms.sameRoom(socket.id, toId)) return;
            io.to(toId).emit("signal", socket.id, signalMessage);
        });

        socket.on("chat-message", (rawText) => {
            const roomCode = rooms.roomOf(socket.id);
            if(roomCode === undefined || typeof rawText !== "string" || !chatAllowed()) return;

            const text = rawText.trim().slice(0, MAX_CHAT_LENGTH);
            if(!text) return;

            const message = {from: socket.id, sender: socket.data.user.name, text, at: Date.now()};
            rooms.addMessage(roomCode, message);
            io.to(roomCode).emit("chat-message", message);
        });

        socket.on("media-state", (state) => {
            const roomCode = rooms.roomOf(socket.id);
            if(roomCode === undefined || typeof state !== "object" || state === null) return;
            socket.to(roomCode).emit("peer-media", socket.id, {
                audio: Boolean(state.audio),
                video: Boolean(state.video),
                screen: Boolean(state.screen)
            });
        });

        // Game actions all reply through the ack, and on success everyone in the room gets the new state.
        const onGameAction = (event, handler) => socket.on(event, (...args) => {
            const ack = typeof args.at(-1) === "function" ? args.pop() : null;
            const roomCode = rooms.roomOf(socket.id);
            if(roomCode === undefined) return reply(ack, {ok: false, error: "Join the room first."});
            if(!gameAllowed()) return reply(ack, {ok: false, error: "Slow down a little."});
            let result;
            try {
                result = handler(roomCode, ...args);
            } catch(err) {
                console.error(`Game action ${event} failed`, err);
                result = {ok: false, error: "Something went wrong with the game."};
            }
            if(result.ok) broadcastGame(roomCode);
            reply(ack, result);
        });

        onGameAction("game-open", (roomCode, type, options) => games.open(roomCode, self(), type, options));
        onGameAction("game-join", (roomCode) => games.join(roomCode, self()));
        onGameAction("game-leave", (roomCode) => games.leave(roomCode, socket.id));
        onGameAction("game-start", (roomCode) => games.start(roomCode, socket.id));
        onGameAction("game-move", (roomCode, move) => games.move(roomCode, socket.id, move));
        onGameAction("game-close", (roomCode) => games.close(roomCode, socket.id));
        onGameAction("game-rematch", (roomCode) => games.rematch(roomCode, self()));
        // Ask for (true) or take back (false) a reset of the room's win tally; it resets once everyone here agrees.
        onGameAction("scores-reset", (roomCode, agree) => scores.vote(roomCode, socket.data.user.id, agree === true, presentUsers(roomCode)));

        socket.on("leave-room", () => leaveCurrentRoom(socket));

        socket.on("disconnect", () => leaveCurrentRoom(socket));
    });

    return io;
}
export default connectToSocket;
