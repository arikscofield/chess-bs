import {Server} from "socket.io";
import {
    type ClientToServerEvents,
    type ServerToClientEvents,
} from "@common/src/types.js";
import 'dotenv/config';
import { createServer } from "node:http";



import {Redis} from "ioredis";
import app from "./app.js";
import {InMemoryGameRepository} from "./game.repository.js";
import type {User} from "./db/schema.js";
import {setUpSocketHandlers} from "./socket/index.js";
import {setupMiddlewares} from "./socket/middleware.js";


const port = parseInt(process.env.PORT || "3000");
const clientPort = parseInt(process.env.CLIENT_PORT || "5173");

export interface SocketData {
    user?: User
}

const httpServer = createServer(app);

// TODO: Fix hard coded-ips
export const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
    cors: {
        origin: [`http://localhost:${clientPort}`, `http://192.168.1.201:${clientPort}`],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

export const gameRepository = new InMemoryGameRepository();

setupMiddlewares(io);
setUpSocketHandlers(io);

httpServer.listen(port, () => {
    console.log(`Server started on port ${port}`);
})
