import './App.css'
import Board from "./Board.tsx";
import {
    AckStatus,
    type Piece,
    type Square,
    type ClientToServerEvents,
    Color,
    type GameState, type Move,
    type ServerToClientEvents
} from "@chess-bs/common";
import {useEffect, useState} from "react";
import {io, Socket} from "socket.io-client";
import BoardClass from "@chess-bs/common/dist/board";


function App() {

    const [gameId, setGameId] = useState<string>("");
    const [playerId, setPlayerId] = useState<string>("");
    const [view, setView] = useState<Color>(Color.White);
    const [turnColor, setTurnColor] = useState<Color>(Color.White);

    // Board data
    const [grid, setGrid] = useState<(Piece | null)[][]>([]);
    const [enPassant, setEnPassant] = useState<Square | null>(null);

    const [gameIdInput, setGameIdInput] = useState<string>("");
    const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);


    useEffect(() => {
        loadPlayerId();
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        newSocket.on("gameState", ({grid: newGrid, enPassant: newEnPassant, turn}: GameState) => {
            console.log(newGrid);
            console.log(newEnPassant);
            console.log(turn);
            setGrid(newGrid);
            setEnPassant(newEnPassant);
            setTurnColor(turn);

        });

        return () => { newSocket.close(); };
    }, [])


    function handleMove (move: Move) {
        socket?.emit("move", gameId, playerId, move, (response) => {
            if (response.status === AckStatus.OK) {
                console.log("Move successful")

            } else if (response.status === AckStatus.ERROR) {
                console.error(response.message);
            }
        })
    }


    function loadPlayerId() {
        const savedPlayerId = localStorage.getItem("playerId");
        if (savedPlayerId) {
            setPlayerId(savedPlayerId);
            console.log("Loaded playerId from localstorage: ", savedPlayerId);
        } else {
            const newPlayerId = Math.random().toString(36).substring(2, 10);
            setPlayerId(newPlayerId);
            localStorage.setItem("playerId", newPlayerId);
        }
    }

    return (
        <>
            <button
                onClick={() => {
                    socket?.emit("createGame", playerId, Color.White, (response) => {
                        console.log("createGame Ack:");
                        console.log(response);
                        if (response.status === AckStatus.OK && response.gameId) {
                            setGameId(response.gameId);
                            setView(response.color || Color.White);
                        } else {
                            console.error(response.message);
                        }
                    });
                }}
            >
                Create Game
            </button>
            <button
                onClick={() => {
                    socket?.emit("joinGame", gameIdInput, playerId, (response) => {
                        console.log("createGame Ack:");
                        console.log(response);
                        if (response.status === AckStatus.OK) {
                            console.log("joined game")
                            setGameId(gameIdInput);
                            setView(response.color || Color.White);
                        } else {
                            console.error(response.message);
                        }
                    });
                }}
            >
                Join Game
            </button>
            <input
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
            />
            <Board
                board={new BoardClass(grid, enPassant)}
                view={view}
                turn={turnColor}
                handleMove={handleMove}
            />
        </>
    )
}

export default App
