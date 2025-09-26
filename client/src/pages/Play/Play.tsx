import '../Home/Home.css'

import {useNavigate, useParams} from "react-router";
import {useContext, useEffect, useRef, useState} from "react";
import {
    AckStatus,
    Color,
    type GameState, type Move,
    type PlayerState,
} from "@chess-bs/common";
import Player from "@chess-bs/common/dist/player.js";
import {SocketContext} from "../../components/Socket/SocketContext.ts";
import Board from "../../components/Board.tsx";
import BoardClass from "@chess-bs/common/dist/board.js";
import {Group} from "@mantine/core";
import BluffButton from "../../components/BluffButton.tsx";
import CallBluffButton from "../../components/CallBluffButton.tsx";
import Chatroom from "../../components/Chatroom.tsx";


function Play() {
    const { gameCode: gameId } = useParams();
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [board, setBoard] = useState<BoardClass | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);

    const [view, setView] = useState<Color | null>(null);
    const [turnColor, setTurnColor] = useState<Color>(Color.White);
    const [isBluffing, setIsBluffing] = useState<boolean>(false);

    const moveHistory = useRef<Move[]>([]);
    const [lastMove, setLastMove] = useState<Move | undefined>(undefined);
    const [animateMove, setAnimateMove] = useState<boolean>(false);

    const socket = useContext(SocketContext);

    useEffect(() => {
        if (isMounted) return;
        console.log(`Attempted to join game ${gameId} from url`);
        if (socket && gameId) {

            socket.on("gameState", (gameState: GameState) => {
                console.log("Received Game State: ");
                console.log(gameState);
                setGameState(gameState);
                setTurnColor(gameState.turn);
                setBoard(new BoardClass(gameState.grid, gameState.enPassant));

                const newLastMove = gameState.moveHistory.at(-1);
                setLastMove(newLastMove);
                const shouldAnimate = gameState.moveHistory.length > moveHistory.current.length;
                moveHistory.current = gameState.moveHistory;

                if (shouldAnimate && newLastMove) {
                    setAnimateMove(true);

                    setTimeout(() => {
                        setAnimateMove(false);
                    }, 300)
                }


            });

            socket.on("playerState", (playerState: PlayerState) => {
                console.log("Received Player State: ");
                console.log(playerState);
                setPlayerState(playerState);
                setPlayer(Player.fromPlayerState(playerState));
                if (!view) setView(playerState.color);
            });

            handleJoinGame(gameId);
        } else {
            navigate("/");
        }

        setIsMounted(true);
    }, [])


    function handleJoinGame(gameId: string) {
        if (!socket) {
            console.error("Socket not connected");
            return;
        }

        socket.emit("joinGame", gameId, (response) => {
            if (response.status === AckStatus.OK) {
                console.log(`Joined game: ${gameId}`)
            } else {
                navigate("/");
                console.error(response.message);
            }
        });
    }

    function handleMove(move: Move) {
        if (!socket) {
            console.error("Socket not connected");
            return;
        }

        socket.emit("move", gameId || "", move, (response) => {
            if (response.status === AckStatus.OK) {
                console.log("Move successful")

            } else if (response.status === AckStatus.ERROR) {
                console.error(response.message);
            }
        })
    }


    if (!isMounted || !socket) return;

    if (!gameId) return;

    return (<div className={"flex flex-col h-screen w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>
            <div className={"grid grid-rows-2 w-[300px] h-full gap-2"}>
                <div className={"flex flex-col rounded-md bg-bg-2"}>

                </div>
                <div className={"flex flex-col rounded-md bg-bg-2"}>

                </div>
            </div>

            <div className={"flex flex-1 flex-col max-w-[min(calc(80vh-50px),80vw)]"}>
                {board && player && <Board
                    board={board}
                    player={player}
                    view={view || Color.White}
                    turn={turnColor}
                    isBluffing={isBluffing}
                    handleMove={handleMove}
                    lastMove={lastMove}
                    animateMove={animateMove}
                />
                }
                <div className={"flex flex-row justify-center gap-5 py-3"}>
                    <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                    <CallBluffButton gameId={gameId} />
                </div>
            </div>

            <div className={"grid grid-rows-2 w-[300px] h-full gap-2 "}>
                <div className={"flex flex-col rounded-md bg-bg-2"}>

                </div>
                <Chatroom
                    gameId={gameId}
                />
            </div>
        </div>
    </div>)
}


export default Play;