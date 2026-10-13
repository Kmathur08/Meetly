import { Server } from "socket.io";
import {isAllowedOrigin} from "../config/env.js";
import {findSession} from "../middleware/auth.js";
import {isValidRoomCode} from "../utils/validate.js";
import {createRoomRegistry} from "./rooms.js";

const MAX_CHAT_LENGTH = 500;

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
            methods: ["GET", "POST"]
        },
        maxHttpBufferSize: 64 * 1024
    });
    const rooms = createRoomRegistry();

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
    };

    io.on("connection", (socket) => {
        const reply = (ack, payload) => typeof ack === "function" && ack(payload);
        let chatWindowStart = 0;
        let chatCount = 0;
        const chatAllowed = () => {
            const now = Date.now();
            if(now - chatWindowStart > 10000) {
                chatWindowStart = now;
                chatCount = 0;
            }
            chatCount += 1;
            return chatCount <= 10;
        };

        socket.on("join-room", (roomCode, ack) => {
            if(!isValidRoomCode(roomCode)) return reply(ack, {ok: false, error: "That meeting code isn't valid."});

            // Switching rooms on the same connection must tell the old room we left.
            leaveCurrentRoom(socket);

            const participant = {id: socket.id, name: socket.data.user.name};
            const result = rooms.join(roomCode, participant);
            if(!result.ok) return reply(ack, {ok: false, error: result.error});

            socket.join(roomCode);
            socket.to(roomCode).emit("peer-joined", participant);
            reply(ack, {ok: true, self: participant, peers: result.peers, messages: result.messages});
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

        socket.on("leave-room", () => leaveCurrentRoom(socket));

        socket.on("disconnect", () => leaveCurrentRoom(socket));
    });

    return io;
}
export default connectToSocket;
