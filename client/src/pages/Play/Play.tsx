import '../Home/Home.css'

import {useNavigate, useParams} from "react-router";
import {useContext, useEffect, useRef, useState} from "react";
import {
    AckStatus,
    BluffPunishment,
    Color,
    CreateGameColor,
    type GameInfo,
    GameResult,
    type GameState,
    GameStatus,
    type Move,
    type PlayerState,
    type ReplayInfo, type ReplayTimerInfo,
    // type Rule as RuleType,
    type Turn,
} from "@chess-bs/common";
import Player from "@chess-bs/common/dist/player.js";
import Rule from "@chess-bs/common/src/rule.js";
import {SocketContext} from "../../components/Socket/SocketContext.ts";
import Board from "../../components/Board.tsx";
import BoardClass from "@chess-bs/common/dist/board.js";
import BluffButton from "../../components/BluffButton.tsx";
import CallBluffButton from "../../components/CallBluffButton.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import OwnRules from "../../components/OwnRules.tsx";
import Timer from "../../components/Timer.tsx";
import GameLobby from "./GameLobby.tsx";
import RuleList from "../../components/RuleList.tsx";
import {useGameViewer} from "../../components/GameViewer.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import {Group, Panel, Separator} from "react-resizable-panels";
import {MdOutlineDragIndicator} from "react-icons/md";
import GameoverModal from "../../components/GameoverModal.tsx";
import Replay from "./Replay.tsx";


function Play() {
    const { gameCode: gameId } = useParams();
    const navigate = useNavigate();

    const [isMounted, setIsMounted] = useState(false);
    const [currentBoard, setCurrentBoard] = useState<BoardClass | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const playerRef = useRef<Player | null>(null);

    // Game Info (non-changing)
    const [rulePool, setRulePool] = useState<Rule[]>([]);
    const [usesTimer, setUsesTimer] = useState<boolean>(false);
    const [timeStartMs, setTimeStartMs] = useState<number | null>(null);
    const [timeIncrementMs, setTimeIncrementMs] = useState<number | null>(null);
    const [bluffPunishment, setBluffPunishment] = useState<BluffPunishment | null>(null);
    const [creatorColor, setCreatorColor] = useState<CreateGameColor | null>(null);
    const [startBoard, setStartBoard] = useState(BoardClass.defaultBoard());

    // Game State (changing)
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.WAITING_FOR_PLAYER);
    const [view, setView] = useState<Color | null>(Color.White);
    const turnHistory = useRef<Turn[]>([]);
    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory.current)
    const turnColor = useRef<Color>(Color.White);
    const [timers, setTimers] = useState<Map<Color, number>>(new Map());
    const timerInterval = useRef<number | null>(null);
    const timerUpdateTimestamp = useRef<number>(Date.now());

    // UI / Other
    const [isBluffing, setIsBluffing] = useState<boolean>(false);
    const [animateMove, setAnimateMove] = useState<boolean>(false);
    const [viewingReplay, setViewingReplay] = useState<boolean>(false);
    const socket = useContext(SocketContext);

    const [GameoverModalOpen, setGameoverModalOpen] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult>(GameResult.Tie);
    const [gameResultReason, setGameResultReason] = useState<string>("");
    const [playerRuleIds, setPlayerRuleIds] = useState<Record<Color, number[]>>({} as Record<Color, number[]>);
    const [replayTimerInfo, setReplayTimerInfo] = useState<ReplayTimerInfo | undefined>(undefined);

    useEffect(() => {
        if (isMounted) return;
        console.log(`Attempted to join game ${gameId} from url`);
        if (socket && gameId) {

            socket.on("gameInfo", (gameInfo: GameInfo) => {
                const {startGrid: newStartGrid, rulePool: newRulePool, usesTimer: newUsesTimer, timeStartMs: newTimeStartMs, timeIncrementMs: newTimeIncrementMs, bluffPunishment: newBluffPunishment, creatorColor: newCreatorColor} = gameInfo;

                console.log("Received Game Info: ");
                console.log(gameInfo);

                setStartBoard(new BoardClass(newStartGrid));
                setRulePool(newRulePool);
                setUsesTimer(newUsesTimer);
                setTimeStartMs(newTimeStartMs)
                setTimeIncrementMs(newTimeIncrementMs);
                setBluffPunishment(newBluffPunishment);
                setCreatorColor(newCreatorColor);
            })


            socket.on("gameState", (gameState: GameState) => {
                const {gameStatus: newGameStatus, grid: newGrid, enPassant: newEnPassant,
                    turn: newTurn, turnHistory: newTurnHistory, rulePool: newRulePool, timers: newTimers} = gameState;

                console.log("Received Game State: ");
                console.log(gameState);
                setGameStatus(newGameStatus);
                // setTurnColor(newTurn);
                turnColor.current = newTurn;
                setCurrentBoard(new BoardClass(newGrid, newEnPassant));
                if (newRulePool) setRulePool(newRulePool);
                if (newTimers) setTimers(new Map(Object.entries(newTimers)) as Map<Color, number>);

                const shouldAnimate = newTurnHistory.length > turnHistory.current.length;
                turnHistory.current = newTurnHistory;

                if (shouldAnimate && highlightedMove) {
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
                setView(newPlayerState.color); // TODO: don't always change if the user manually swapped?
            });

            socket.on("replayInfo", (replayInfo: ReplayInfo) => {
                const {startGrid: newStartGrid, playerRuleIds: newPlayerRuleIds, rulePoolIds: newRulePoolIds, timerInfo: newTimerInfo, bluffPunishment: newBluffPunishment, turnHistory: newTurnHistory} = replayInfo;

                console.log("Received Replay Info: ");
                console.log(replayInfo);

                setGameStatus(GameStatus.DONE);
                setStartBoard(new BoardClass(newStartGrid));
                setPlayerRuleIds(newPlayerRuleIds);
                setRulePool(newRulePoolIds.map((ruleId) => Rule.getRuleFromId(ruleId)).filter((rule) => rule !== undefined));
                setReplayTimerInfo(newTimerInfo ? {
                    gameStartTimestamp: new Date(newTimerInfo?.gameStartTimestamp.toString()),
                    startMs: newTimerInfo.startMs,
                    incrementMs: newTimerInfo?.incrementMs,
                } : undefined);

                setBluffPunishment(newBluffPunishment);
                turnHistory.current = newTurnHistory;
                setViewingReplay(true);
            });

            socket.on("gameOver", (gameResult: GameResult, reason: string) => {
                console.log("Game Over. Result:", gameResult)
                console.log("Reason:", reason);
                endTimers();
                setGameStatus(GameStatus.DONE);
                setGameResult(gameResult);
                setGameResultReason(reason);
                setGameoverModalOpen(true);
            })

            handleJoinGame(gameId);
        } else {
            navigate("/");
        }

        setIsMounted(true);
    }, [])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {

            switch (e.key) {
                case " ":
                    if (document.activeElement == document.getElementById("chat-input"))
                        break;
                    setIsBluffing((prev) => !prev);
                    break;

            }
        }
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
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
                setIsBluffing(false);
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


    if (viewingReplay) {
        return <Replay
            startBoard={startBoard}
            turnHistory={turnHistory}
            playerRuleIds={playerRuleIds}
            replayTimerInfo={replayTimerInfo}
        />
    }

    return (<div className={"flex flex-col min-h-[calc(100vh-82px)] w-screen"}>
        <div className={"flex flex-row gap-5 justify-center items-center h-[calc(90vh-50px)]"}>

            {/* Left Side*/}
            <div className={"w-[300px] h-full"}>
                <Group className={""}
                    // style={{ height: 'calc(90vh-50px)' }}
                       orientation={"vertical"}
                       defaultLayout={{
                           "rule-pool": 1,
                           "own-rules": 1
                       }}
                >
                    <Panel
                        id={"rule-pool"}
                        minSize={"250px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2 "}>
                            <h3 className={"text-white text-xl font-bold text-center"}>Game Rules</h3>
                            <RuleList enabledRules={rulePool} size={"xs"} color={player?.color || Color.White} onlyShowEnabled={true} wrapChips={true}/>
                        </div>
                    </Panel>

                    <Separator className={"flex flex-row justify-center h-4 my-1 outline-none bg-bg-2/50 hover:bg-bg-2"}>
                        <MdOutlineDragIndicator color={"gray"} className={"rotate-90"}/>
                    </Separator>

                    <Panel
                        id={"own-rules"}
                        minSize={"200px"}
                    >
                        <OwnRules rules={player?.rules} color={player?.color || Color.White}/>
                    </Panel>
                </Group>
            </div>

            {/* Board */}
            <div className={"flex flex-1 flex-col max-w-[min(calc(80vh-50px),80vw)]"}>
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>{"Opponent"}</div>

                    <Timer
                        timeMs={timers?.get(player?.color === Color.White ? Color.Black : Color.White)}
                        isRunning={player?.color !== turnColor.current}
                    />
                </div>
                {visibleBoard !== null && player && <Board
                    board={visibleBoard}
                    gameStatus={gameStatus}
                    player={player}
                    view={view || Color.White}
                    turn={turnColor.current}
                    canMove={viewMoveIndex == -1}
                    isBluffing={isBluffing}
                    handleMove={handleMove}
                    highlightedMove={highlightedMove}
                    animateMove={animateMove}
                />
                }
                <div className={"flex flex-row justify-between"}>
                    <div className={"float-start text-white text-xl"}>{"You"}</div>
                    <div className={"flex flex-row justify-center gap-5 py-3"}>
                        <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                        <CallBluffButton gameId={gameId} />
                    </div>
                    <Timer
                        timeMs={timers?.get(player?.color ?? Color.White)}
                        isRunning={player?.color === turnColor.current}
                    />
                </div>

            </div>

            {/* Right Side */}
            <div className={"hidden lg:block w-[300px] h-full"}>
                <Group className={""}
                       // style={{ height: 'calc(90vh-50px)' }}
                       orientation={"vertical"}
                       defaultLayout={{
                           "turn-history": 1.3,
                           "chat": 1
                       }}
                >
                    <Panel
                        id={"turn-history"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-md h-full bg-bg-2"}>
                            <TurnHistory
                                turnHistory={turnHistory.current}
                                viewMoveIndex={viewMoveIndex}
                                setViewMoveIndex={setViewMoveIndex}
                            />
                        </div>
                    </Panel>

                    <Separator className={"flex flex-row justify-center h-4 my-1 outline-none bg-bg-2/50 hover:bg-bg-2"}>
                        <MdOutlineDragIndicator color={"gray"} className={"rotate-90"}/>
                    </Separator>

                    <Panel
                        id={"chat"}
                        minSize={"100px"}
                    >
                        <Chatroom
                                gameId={gameId}
                        />
                    </Panel>
                </Group>


            </div>
        </div>


        <GameoverModal
            opened={GameoverModalOpen}
            onClose={() => setGameoverModalOpen(false)}
            playerColor={player?.color || Color.White}
            gameResult={gameResult}
            reason={gameResultReason}
        />
    </div>)
}


export default Play;