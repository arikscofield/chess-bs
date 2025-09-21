import './Play.css'
import {
    AckStatus,
    type ClientToServerEvents, Color,
    type GameState,
    GameStatus,
    type PlayerState,
    type ServerToClientEvents,
} from "@chess-bs/common";
import {useEffect, useRef, useState} from "react";
import {io, Socket} from "socket.io-client";
import Game from "./Game.tsx";
import Lobby from "./Lobby.tsx";
import {useSearchParams} from "react-router";
// import Player from "@chess-bs/common/dist/player.ts";

const SERVER_IP = "192.168.1.90"
const SERVER_PORT = 3000;

function Play() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [isMounted, setIsMounted] = useState(false);
    const [gameId, setGameId] = useState<string>("");
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);

    // const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

    useEffect(() => {
        const newSocket = io(`http://${SERVER_IP}:${SERVER_PORT}`, {
            withCredentials: true,
        });

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

        socket.current = newSocket;

        console.log(searchParams);
        const newGameId = searchParams.get("room");
        if (newGameId) {
            handleJoinGame(newGameId);
        }

        setIsMounted(true);

        return () => { newSocket.close(); };
    }, [])


    function handleCreateGame() {
        socket.current?.emit("createGame", Color.White, (response) => {
            if (response.status === AckStatus.OK && response.gameId) {
                console.log(`Created game: ${response.gameId}`)
                setGameId(response.gameId);
                setSearchParams({ room: response.gameId });
            } else {
                setGameId("");
                setSearchParams({ });
                console.error(response.message);
            }
        });
    }

    function handleJoinGame(gameId: string) {
        socket.current?.emit("joinGame", gameId, (response) => {
            if (response.status === AckStatus.OK) {
                console.log(`Joined game: ${gameId}`)
                setGameId(gameId);
                setSearchParams({ room: gameId });
            } else {
                setGameId("");
                setSearchParams({ });
                console.error(response.message);
            }
        });
    }


    if (!isMounted || !socket.current) return;

    if (!gameId || gameState?.gameStatus === GameStatus.WAITING_FOR_PLAYER) {
        return (<Lobby socket={socket.current} setGameId={setGameId} createGame={handleCreateGame} joinGame={handleJoinGame} />);
    }

    return (<Game gameId={gameId} socket={socket.current} gameState={gameState} playerState={playerState} />)
}

export default Play
