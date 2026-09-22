import httpStatus from "http-status";
import {Session} from "../models/session.model.js";
import {hashToken} from "../utils/tokens.js";

export const readBearerToken = (header) => {
    const match = /^Bearer ([a-f0-9]{64})$/.exec(header || "");
    return match ? match[1] : null;
};

// Resolves a raw token to its session and user; shared by the REST guard and the socket handshake.
export const findSession = async (token) => {
    if(!token) return null;
    const session = await Session.findOne({tokenHash: hashToken(token), expiresAt: {$gt: new Date()}}).populate("user");
    return session?.user ? session : null;
};

export const authGuard = async (req, res, next) => {
    const token = readBearerToken(req.headers.authorization);
    if(!token) return res.status(httpStatus.UNAUTHORIZED).json({message: "Authentication required"});

    const session = await findSession(token);
    if(!session) return res.status(httpStatus.UNAUTHORIZED).json({message: "Session expired"});

    req.session = session;
    req.user = session.user;
    next();
};
