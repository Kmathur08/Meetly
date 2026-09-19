import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import connectToSocket from "./controllers/socketManager.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server)

app.set("port", process.env.PORT || 8080);
app.use(cors());
app.use(express.json({limit: "50kb"}));
app.use(express.urlencoded({extended: true, limit: "50kb"}));




const start = async () => {
    const connectionString = process.env.MONGODB_URI;
    if (connectionString) {
        await mongoose.connect(connectionString);
    } else {
        console.warn("MONGODB_URI is not configured; starting without database connection");
    }

    server.listen(app.get("port"), () => {
        console.log(`Server is running on port ${app.get("port")}`);
    });
}

start();
