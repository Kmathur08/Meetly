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

app.use(cors(corsOptions));
app.use(express.json({limit: "50kb"}));
app.use(express.urlencoded({extended: true, limit: "50kb"}));
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

start().catch((error) => {
    console.error("Unable to start backend:", error.message);
    process.exit(1);
});
