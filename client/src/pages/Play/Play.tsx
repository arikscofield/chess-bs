import '../Home/Home.css'

import {useNavigate, useParams} from "react-router";
import {useContext, useEffect, useRef, useState} from "react";
import {
    AckStatus, BluffPunishment,
    Color, CreateGameColor,
    type GameInfo,
    type GameState,
    GameStatus,
    type Move,
    type PlayerState,
    type Rule,
} from "@chess-bs/common";
import Player from "@chess-bs/common/dist/player.js";
import {SocketContext} from "../../components/Socket/SocketContext.ts";
import Board from "../../components/Board.tsx";
import BoardClass from "@chess-bs/common/dist/board.js";
import BluffButton from "../../components/BluffButton.tsx";
import CallBluffButton from "../../components/CallBluffButton.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import OwnRules from "../../components/OwnRules.tsx";
import Timer from "../../components/Timer.tsx";
import GameLobby from "../../components/GameLobby.tsx";
import RuleList from "../../components/RuleList.tsx";


function Play() {
    const { gameCode: gameId } = useParams();
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);
    // const [gameState, setGameState] = useState<GameState | null>(null);
    const [board, setBoard] = useState<BoardClass | null>(null);
    // const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const playerRef = useRef<Player | null>(null);

    // Game Info (non-changing)
    const [rulePool, setRulePool] = useState<Rule[]>([]);
    const [usesTimer, setUsesTimer] = useState<boolean>(false);
    const [timeStartMs, setTimeStartMs] = useState<number | null>(null);
    const [timeIncrementMs, setTimeIncrementMs] = useState<number | null>(null);
    const [bluffPunishment, setBluffPunishment] = useState<BluffPunishment | null>(null);
    const [creatorColor, setCreatorColor] = useState<CreateGameColor | null>(null);

    // Game State (changing)
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.WAITING_FOR_PLAYER);
    const [view, setView] = useState<Color | null>(null);
    // const [turnColor, setTurnColor] = useState<Color>(Color.White);
    const moveHistory = useRef<Move[]>([]);
    const [lastMove, setLastMove] = useState<Move | undefined>(undefined);
    const turnColor = useRef<Color>(Color.White);
    const [timers, setTimers] = useState<Map<Color, number>>(new Map());
    const timerInterval = useRef<number | null>(null);
    const timerUpdateTimestamp = useRef<number>(Date.now());

    // UI / Other
    const [isBluffing, setIsBluffing] = useState<boolean>(false);
    const [animateMove, setAnimateMove] = useState<boolean>(false);
    const socket = useContext(SocketContext);

    useEffect(() => {
        if (isMounted) return;
        console.log(`Attempted to join game ${gameId} from url`);
        if (socket && gameId) {

            socket.on("gameInfo", (gameInfo: GameInfo) => {
                const {rulePool: newRulePool, usesTimer: newUsesTimer, timeStartMs: newTimeStartMs, timeIncrementMs: newTimeIncrementMs, bluffPunishment: newBluffPunishment, creatorColor: newCreatorColor} = gameInfo;

                console.log("Received Game Info: ");
                console.log(gameInfo);

                setRulePool(newRulePool);
                setUsesTimer(newUsesTimer);
                setTimeStartMs(newTimeStartMs)
                setTimeIncrementMs(newTimeIncrementMs);
                setBluffPunishment(newBluffPunishment);
                setCreatorColor(newCreatorColor);
            })


            socket.on("gameState", (gameState: GameState) => {
                const {gameStatus: newGameStatus, grid: newGrid, enPassant: newEnPassant,
                    turn: newTurn, moveHistory: newMoveHistory, rulePool: newRulePool, timers: newTimers} = gameState;

                console.log("Received Game State: ");
                console.log(gameState);
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
            });

            socket.on("playerState", (newPlayerState: PlayerState) => {
                console.log("Received Player State: ");
                console.log(newPlayerState);
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


    if (!isMounted || !socket) return;

    if (!gameId) return;

    if (gameStatus === GameStatus.WAITING_FOR_PLAYER) {
        return (<GameLobby
            gameId={gameId}
            usesTimer={usesTimer}
            timeStartMs={timeStartMs}
            timeIncrementMs={timeIncrementMs}
            bluffPunishment={bluffPunishment}
            creatorColor={creatorColor}
            rulePool={rulePool}
        />)
    }

    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>
            <div className={"grid grid-rows-2 w-[300px] h-full gap-2"}>
                <div className={"flex flex-col rounded-md bg-bg-2 overflow-y-auto"}>
                    <h3 className={"text-white text-xl font-bold text-center"}>Game Rules</h3>
                    <RuleList enabledRules={rulePool} size={"xs"} color={player?.color || Color.White} onlyShowEnabled={true}/>
                </div>
                <OwnRules rules={player?.rules} color={player?.color || Color.White}/>
            </div>

            <div className={"flex flex-1 flex-col max-w-[min(calc(80vh-50px),80vw)]"}>
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>Opponent</div>

                    <Timer
                        timeMs={timers?.get(player?.color === Color.White ? Color.Black : Color.White)}
                        color={player?.color === Color.White ? Color.Black : Color.White}
                        turn={turnColor.current}
                    />
                </div>
                {board && player && <Board
                    board={board}
                    gameStatus={gameStatus}
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
                    <Timer
                        timeMs={timers?.get(player?.color ?? Color.White)}
                        color={player?.color || Color.White}
                        turn={turnColor.current}
                    />
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