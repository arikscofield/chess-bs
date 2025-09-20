import './Play.css'
import {
    type ClientToServerEvents,
    type GameState,
    GameStatus,
    type PlayerState,
    type ServerToClientEvents,
} from "@chess-bs/common";
import {useEffect, useState} from "react";
import {io, Socket} from "socket.io-client";
import Game from "./Game.tsx";
import Lobby from "./Lobby.tsx";
// import Player from "@chess-bs/common/dist/player.ts";


function Play() {

    const [gameId, setGameId] = useState<string>("");
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.WAITING_FOR_PLAYER);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);

    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);


    useEffect(() => {
        const newSocket = io("http://localhost:3000", {
            withCredentials: true,
        });
        setSocket(newSocket);

        newSocket.on("gameState", (gameState: GameState) => {
            console.log("Received Game State: ");
            console.log(gameState);
            setGameState(gameState);
        });

        newSocket.on("playerState", (playerState: PlayerState) => {
            console.log("Received Player State: ");
            console.log(playerState);
            setPlayerState(playerState);
        });

        return () => { newSocket.close(); };
    }, [])


    if (!socket) return;

    if (!gameId || gameState?.gameStatus === GameStatus.WAITING_FOR_PLAYER) {
        return (<Lobby socket={socket} setGameId={setGameId} />);
    }

    return (<Game gameId={gameId} socket={socket} gameState={gameState} playerState={playerState} />)
}

export default Play
