import {type ReactNode, useMemo} from "react";
import {io, type Socket} from "socket.io-client";
import {SocketContext} from "./SocketContext.ts";
import type {ClientToServerEvents, ServerToClientEvents} from "@chess-bs/common";
import {useAuth} from "./AuthContext.ts";


// const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP;
const SERVER_IP = window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_BACKEND_SERVER_PORT;

function SocketProvider({ children }: { children: ReactNode }) {
    const { user, isConnected } = useAuth();

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useMemo(() => {
        if (!isConnected || !user) return null;

        return io(`http://${SERVER_IP}:${SERVER_PORT}`, {
                withCredentials: true,
            })
    }, [user, isConnected]);

    return <SocketContext value={socket}>
        {children}
    </SocketContext>;
}


export default SocketProvider;