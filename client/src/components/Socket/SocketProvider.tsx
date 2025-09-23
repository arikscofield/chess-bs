import {type ReactNode, useMemo} from "react";
import {io} from "socket.io-client";
import {SocketContext} from "./SocketContext.ts";

const SERVER_IP = "192.168.1.90";
const SERVER_PORT = 3000;

function SocketProvider({ children }: { children: ReactNode }) {

    const socket = useMemo(() => io(`http://${SERVER_IP}:${SERVER_PORT}`, {
        withCredentials: true,
    }), []);

    return <SocketContext value={socket}>
        {children}
    </SocketContext>;
}


export default SocketProvider;