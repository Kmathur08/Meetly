import dotenv from "dotenv";
dotenv.config();

const splitList = (value) => (value || "").split(",").map((item) => item.trim()).filter(Boolean);

const config = {
    port: Number(process.env.PORT) || 8080,
    mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI,
    // Empty list means "any origin", which keeps local development working without extra setup.
    clientOrigins: splitList(process.env.CLIENT_ORIGIN),
    sessionDays: Number(process.env.SESSION_DAYS) || 7,
};

export default config;
