import {type ReactNode, useMemo} from "react";
import {io, type Socket} from "socket.io-client";
import {SocketContext} from "./SocketContext.ts";
import type {ClientToServerEvents, ServerToClientEvents} from "@chess-bs/common";


// const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP;
const SERVER_IP = window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT;

function SocketProvider({ children }: { children: ReactNode }) {

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useMemo(
        () => io(`http://${SERVER_IP}:${SERVER_PORT}`, {
        withCredentials: true,
    }), []);

    return <SocketContext value={socket}>
        {children}
    </SocketContext>;
}


export default SocketProvider;