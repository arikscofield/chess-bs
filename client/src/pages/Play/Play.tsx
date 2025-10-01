import '../Home/Home.css'

import {useNavigate, useParams} from "react-router";
import {useContext, useEffect, useRef, useState} from "react";
import {AckStatus, Color, type GameState, GameStatus, type Move, type PlayerState, type Rule,} from "@chess-bs/common";
import Player from "@chess-bs/common/dist/player.js";
import {SocketContext} from "../../components/Socket/SocketContext.ts";
import Board from "../../components/Board.tsx";
import BoardClass from "@chess-bs/common/dist/board.js";
import BluffButton from "../../components/BluffButton.tsx";
import CallBluffButton from "../../components/CallBluffButton.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import OwnRules from "../../components/OwnRules.tsx";


function Play() {
    const { gameCode: gameId } = useParams();
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [board, setBoard] = useState<BoardClass | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const playerRef = useRef<Player | null>(null);

    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.WAITING_FOR_PLAYER);
    const [view, setView] = useState<Color | null>(null);
    // const [turnColor, setTurnColor] = useState<Color>(Color.White);
    const turnColor = useRef<Color>(Color.White);
    const [isBluffing, setIsBluffing] = useState<boolean>(false);

    const [rulePool, setRulePool] = useState<Rule[]>([]);
    const [timers, setTimers] = useState<Map<Color, number>>(new Map());
    const timerInterval = useRef<number | null>(null);
    const timerUpdateTimestamp = useRef<number>(Date.now());

    const moveHistory = useRef<Move[]>([]);
    const [lastMove, setLastMove] = useState<Move | undefined>(undefined);
    const [animateMove, setAnimateMove] = useState<boolean>(false);

    const socket = useContext(SocketContext);

    useEffect(() => {
        if (isMounted) return;
        console.log(`Attempted to join game ${gameId} from url`);
        if (socket && gameId) {

            socket.on("gameState", (gameState: GameState) => {
                const {gameStatus: newGameStatus, grid: newGrid, enPassant: newEnPassant,
                    turn: newTurn, moveHistory: newMoveHistory, rulePool: newRulePool, timers: newTimers} = gameState;

                console.log("Received Game State: ");
                console.log(gameState);
                setGameState(gameState);
                setGameStatus(newGameStatus);
                // setTurnColor(newTurn);
                turnColor.current = newTurn;
                setBoard(new BoardClass(newGrid, newEnPassant));
                if (newRulePool) setRulePool(newRulePool);
                if (newTimers) setTimers(new Map(Object.entries(newTimers)) as Map<Color, number>);

                const newLastMove = newMoveHistory.at(-1);
                setLastMove(newLastMove);
                const shouldAnimate = newMoveHistory.length > moveHistory.current.length;
                moveHistory.current = newMoveHistory;

                if (shouldAnimate && newLastMove) {
                    setAnimateMove(true);

                    setTimeout(() => {
                        setAnimateMove(false);
                    }, 300)
                }

                switch (newGameStatus) {
                    case GameStatus.RUNNING:
                        startTimers();
                        break;
                    case GameStatus.WAITING_FOR_PLAYER:
                    case GameStatus.PAUSED:
                    case GameStatus.DONE:
                        endTimers();
                        break;
                }

                // const color = playerRef.current?.color;
                // if (color && color === newTurn) {
                //     timerUpdateTimestamp.current = Date.now();
                //     timerInterval.current = setInterval(() => {
                //         setTimers(prevTimers => {
                //             const newTimers = new Map(prevTimers);
                //             const now = Date.now();
                //             const elapsed = now - timerUpdateTimestamp.current;
                //             const current = newTimers.get(color);
                //             if (current === undefined) return newTimers;
                //             newTimers.set(color, current - elapsed);
                //             timerUpdateTimestamp.current = now;
                //             return newTimers;
                //         })
                //     }, 100)
                // }


            });

            socket.on("playerState", (newPlayerState: PlayerState) => {
                console.log("Received Player State: ");
                console.log(newPlayerState);
                setPlayerState(newPlayerState);
                setPlayer(Player.fromPlayerState(newPlayerState));
                // player.current = new Player(newPlayerState.playerId, newPlayerState.color, newPlayerState.rules.length);
                playerRef.current = Player.fromPlayerState(newPlayerState)
                if (!view) setView(newPlayerState.color);
            });

            socket.on("gameOver", (winner: Color, reason: string) => {
                console.log("Game Over. Winner:", winner)
                console.log("Reason:", reason);
                endTimers();
            })

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

    function startTimers() {
        if (timerInterval.current) return;
        timerUpdateTimestamp.current = Date.now();
        timerInterval.current = setInterval(() => {
            setTimers(prevTimers => {
                const newTimers = new Map(prevTimers);
                const now = Date.now();
                const elapsed = now - timerUpdateTimestamp.current;
                const current = newTimers.get(turnColor.current);
                if (current === undefined) return newTimers;
                newTimers.set(turnColor.current, Math.max(0, current - elapsed));
                timerUpdateTimestamp.current = now;
                return newTimers;
            })
        }, 100)
    }

    function endTimers() {
        if (timerInterval.current)
            clearInterval(timerInterval.current);
        timerInterval.current = null;
    }


    function formatTime(timeMs: number | undefined): string {
        if (timeMs === undefined) return "";

        let result = "";
        const tenths = Math.floor(timeMs % 1000 / 100);
        const seconds = Math.floor((timeMs / 1000) % 60);
        const minutes = Math.floor((timeMs / (60 * 1000)) % 60);
        const hours = Math.floor((timeMs / (60 * 60 * 1000)) % 60);

        if (hours > 0)
            result += (hours < 10 ? "0" + hours : hours) + ":";
        result += (minutes < 10 ? "0" + minutes : minutes) + ":";
        result += seconds < 10 ? "0" + seconds : seconds;
        if (hours === 0 && minutes === 0 && seconds < 10)
            result += "." + tenths;

        return result
    }


    if (!isMounted || !socket) return;

    if (!gameId) return;

    return (<div className={"flex flex-col h-screen w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>
            <div className={"grid grid-rows-2 w-[300px] h-full gap-2"}>
                <div className={"flex flex-col rounded-md bg-bg-2"}>

                </div>
                <OwnRules rules={player?.rules} color={player?.color || Color.White}/>
            </div>

            <div className={"flex flex-1 flex-col max-w-[min(calc(80vh-50px),80vw)]"}>
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>Opponent</div>

                    <div className={"float-end text-white text-xl"}>{formatTime(timers?.get(player?.color === Color.White ? Color.Black : Color.White))}</div>
                </div>
                {board && player && <Board
                    board={board}
                    player={player}
                    view={view || Color.White}
                    turn={turnColor.current}
                    isBluffing={isBluffing}
                    handleMove={handleMove}
                    lastMove={lastMove}
                    animateMove={animateMove}
                />
                }
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>You</div>
                    <div className={"flex flex-row justify-center gap-5 py-3"}>
                        <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                        <CallBluffButton gameId={gameId} />
                    </div>
                    <div className={"float-end text-white text-xl"}>{formatTime(timers?.get(player?.color ?? Color.White))}</div>
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