import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import connectToSocket from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server)

app.set("port", process.env.PORT || 8080);
app.use(cors());
app.use(express.json({limit: "50kb"}));
app.use(express.urlencoded({extended: true, limit: "50kb"}));
app.use("/api/v1/users", userRoutes);




const start = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if(!mongoUri) {
        throw new Error("MONGO_URI or MONGODB_URI is required");
    }

    await mongoose.connect(mongoUri);
    server.listen(app.get("port"), () => {
        console.log(`Server is running on port ${app.get("port")}`);
    });
}

start().catch((error) => {
    console.error("Unable to start backend:", error.message);
    process.exit(1);
});
