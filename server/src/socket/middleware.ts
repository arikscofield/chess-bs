
import {parse} from "cookie";
import {getSessionByToken, getUserById} from "../db/helper.js";
import type {Server} from "socket.io";


export function setupMiddlewares(io: Server) {
    // Attach user to socket
    io.use(async (socket, next) => {
        const cookies = parse(socket.handshake.headers.cookie || '')
        const token = cookies.session_token;

        if (!token) {
            return next(new Error("Unauthorized: Missing session token"));
        }

        const session = await getSessionByToken(token);
        const isValidSession = session && session.expiresAt.getTime() > Date.now();

        if (!isValidSession) {
            return next(new Error("Unauthorized: Invalid or expired session"));
        }

        const user = await getUserById(session.userId);
        if (!user) {
            return next(new Error("Unauthorized: User not found"));
        }

        socket.data.user = user;
        next();
    })
}
