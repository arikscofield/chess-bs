import {type ReactNode, useMemo} from "react";
import {io, type Socket} from "socket.io-client";
import {SocketContext} from "./SocketContext.ts";
import type {ClientToServerEvents, ServerToClientEvents} from "@chess-bs/common";
import {useAuth} from "./AuthContext.ts";
import {API_BASE} from "../../utils/api.ts";


function SocketProvider({ children }: { children: ReactNode }) {
    const { user, isConnected } = useAuth();

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useMemo(() => {
        if (!isConnected || !user) return null;

        return io(`${API_BASE}`, {
                withCredentials: true,
            })
    }, [user, isConnected]);

    return <SocketContext value={socket}>
        {children}
    </SocketContext>;
}


export default SocketProvider;