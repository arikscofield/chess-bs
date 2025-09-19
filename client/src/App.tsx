import './App.css'
import Board from "./Board.tsx";
import {
    AckStatus,
    type ClientToServerEvents,
    Color,
    type GameState,
    type Move,
    type Piece,
    PieceType,
    type ServerToClientEvents,
    type Square,
} from "@chess-bs/common";
import {useEffect, useRef, useState} from "react";
import {io, Socket} from "socket.io-client";
import BoardClass from "@chess-bs/common/dist/board";
import Player from "@chess-bs/common/dist/player";


function App() {

    const [gameId, setGameId] = useState<string>("");
    const [playerId, setPlayerId] = useState<string>("");
    const player = useRef<Player | null>(null);
    const [view, setView] = useState<Color>(Color.White);
    const [turnColor, setTurnColor] = useState<Color>(Color.White);
    const [promotionMove, setPromotionMove] = useState<Move | null>(null);
    const [isBluffing, setIsBluffing] = useState<boolean>(false);

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
            setTurnColor(turn); // TODO: Uncomment

        });

        return () => { newSocket.close(); };
    }, [])


    function handleCreateGame() {
        socket?.emit("createGame", playerId, Color.White, (response) => {
            console.log("createGame Ack:");
            console.log(response);
            if (response.status === AckStatus.OK && response.gameId && response.player) {
                setGameId(response.gameId);
                setView(response.player.color || Color.White);
                player.current = Player.from(response.player) || null;
            } else {
                console.error(response.message);
            }
        });
    }

    function handleJoinGame() {
        socket?.emit("joinGame", gameIdInput, playerId, (response) => {
            console.log("createGame Ack:");
            console.log(response);
            if (response.status === AckStatus.OK && response.player) {
                console.log("joined game")
                setGameId(gameIdInput);
                setView(response.player?.color || Color.White);
                player.current = Player.from(response.player) || null;
            } else {
                console.error(response.message);
            }
        });
    }

    function handleBluff() {
        setIsBluffing((prev) => !prev);
    }

    function handleCallBluff() {
        socket?.emit("callBluff", gameId, playerId, (response) => {
            if (response.status === AckStatus.OK) {
                if (response.result) {
                    console.log("Bluff successful");
                } else {
                    console.log("Bluff failed");
                    // setTurnColor((prev) => prev === Color.White ? Color.Black : Color.White);
                }
            } else {
                console.error(response.message);
            }
        })
    }

    function handleMove(move: Move) {
        socket?.emit("move", gameId, playerId, move, (response) => {
            if (response.status === AckStatus.OK) {
                console.log("Move successful")

            } else if (response.status === AckStatus.ERROR) {
                console.error(response.message);
            }
        })
    }


    function handleSelectPromotion(pieceType: PieceType) {
        if (!promotionMove) return;

        const move = promotionMove;
        move.promotion = pieceType;
        handleMove(move);
        setPromotionMove(null);
    }


    function loadPlayerId() {
        // TODO: Uncomment
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
                onClick={() => {handleCreateGame();}}
            >
                Create Game
            </button>
            <button
                onClick={() => {handleJoinGame();}}
            >
                Join Game
            </button>
            <input
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
            />
            <Board
                board={new BoardClass(grid, enPassant)}
                player={player.current}
                view={view}
                turn={turnColor}
                isBluffing={isBluffing}
                promotionMove={promotionMove}
                handleMove={handleMove}
                setPromotionMove={setPromotionMove}
                handleSelectPromotion={handleSelectPromotion}
            />
            <button className={"bg-red-500"}
                    onClick={() => {handleBluff();}}
            >
                Bluff
            </button>
            <button className={""}
                    onClick={() => {handleCallBluff();}}
            >
                Call Bluff
            </button>
        </>
    )
}

export default App
