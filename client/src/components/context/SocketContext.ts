import {createContext, useContext} from "react";
import {type Socket} from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "@chess-bs/common";


export const SocketContext = createContext<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);


export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocket must be used within an SocketProvider");
    }
    return context;
}
