import {createContext} from "react";
import {type Socket} from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "@chess-bs/common";


export const SocketContext = createContext<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);



