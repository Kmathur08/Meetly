import express from "express";
import {createServer} from "http";
import mongoose from "mongoose";
import cors from "cors";
import config, {corsOptions} from "./config/env.js";
import connectToSocket from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";
import {notFound, errorHandler} from "./middleware/errors.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server)

// Render and similar hosts sit behind one proxy hop; without this every client shares the proxy's IP in the rate limiter.
app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.use(express.json({limit: "50kb"}));
app.use(express.urlencoded({extended: true, limit: "50kb"}));
app.get("/health", (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({status: dbReady ? "ok" : "degraded"});
});
app.use("/api/v1/users", userRoutes);
app.use(notFound);
app.use(errorHandler);


const start = async () => {
    if(!config.mongoUri) {
        throw new Error("MONGO_URI or MONGODB_URI is required");
    }

    await mongoose.connect(config.mongoUri);
    server.listen(config.port, () => {
        console.log(`Server is running on port ${config.port}`);
    });
}

const shutdown = (signal) => {
    console.log(`${signal} received, closing connections`);
    io.close();
    server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
    });
    // Don't hang forever if a client keeps a connection open.
    setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((error) => {
    console.error("Unable to start backend:", error.message);
    process.exit(1);
});
