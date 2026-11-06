import dotenv from "dotenv";
dotenv.config();

const splitList = (value) => (value || "").split(",").map((item) => item.trim()).filter(Boolean);

const config = {
    port: Number(process.env.PORT) || 8080,
    mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI,
    // Empty list means "any origin", which keeps local development working without extra setup.
    clientOrigins: splitList(process.env.CLIENT_ORIGIN),
    sessionDays: Number(process.env.SESSION_DAYS) || 7,
    // Where links in emails point. Falls back to the first allowed frontend origin.
    appUrl: (process.env.APP_URL || splitList(process.env.CLIENT_ORIGIN)[0] || "http://localhost:5173").replace(/\/+$/, ""),
    mail: {
        brevoApiKey: process.env.BREVO_API_KEY,
        from: process.env.MAIL_FROM,
        fromName: process.env.MAIL_FROM_NAME || "Meetly",
    },
    turn: {
        urls: splitList(process.env.TURN_URLS),
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
    },
};

// STUN alone fails behind many mobile and office NATs; a TURN relay is needed for those calls to connect.
export const iceServers = () => {
    const servers = [{urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]}];
    if(config.turn.urls.length) {
        servers.push({urls: config.turn.urls, username: config.turn.username, credential: config.turn.credential});
    }
    return servers;
};

export default config;

export const isAllowedOrigin = (origin) => !origin || config.clientOrigins.length === 0 || config.clientOrigins.includes(origin);

export const corsOptions = {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ["GET", "POST"],
};
