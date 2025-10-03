import {type ReactNode, useMemo} from "react";
import {io, type Socket} from "socket.io-client";
import {SocketContext} from "./SocketContext.ts";
import type {ClientToServerEvents, ServerToClientEvents} from "@chess-bs/common";

// const SERVER_IP = "192.168.1.90";
const SERVER_IP = "localhost";
const SERVER_PORT = 3000;

function SocketProvider({ children }: { children: ReactNode }) {

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useMemo(
        () => io(`${SERVER_IP}:${SERVER_PORT}`, {
        withCredentials: true,
    }), []);

    return <SocketContext value={socket}>
        {children}
    </SocketContext>;
}


export default SocketProvider;