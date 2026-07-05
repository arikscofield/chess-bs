import {Group, Panel, Separator} from "react-resizable-panels";
import RuleList from "../../components/RuleList.tsx";
import {MdOutlineDragIndicator} from "react-icons/md";
import {
    Color,
    type GameMoveSendRequest, GameStatus,
    getMoveNotation,
    type Move,
    type PlayerDTO
} from "@chess-bs/common";
import OwnRules from "../../components/OwnRules.tsx";
import Board from "../../components/Board.tsx";
import Timer from "../../components/Timer.tsx";
import {CallBluffButtonOnline} from "../../components/CallBluffButton.tsx";
import BluffButton from "../../components/BluffButton.tsx";
import TurnHistory from "../../components/TurnHistory.tsx";
import Chatroom from "../../components/Chatroom.tsx";
import {useAtom, useAtomValue, useSetAtom} from "jotai";
import {
    addTurnAtom, addTurnTimestampAtom,
    clockInfoAtom, drawOfferedColorAtom,
    gameIdAtom,
    gameResultAtom,
    gameResultReasonAtom,
    gameStatusAtom,
    isBluffingAtom, isDragMoveAtom,
    playerAtom,
    playersAtom,
    removeTurnAtom,
    rulePoolIdsAtom,
    startBoardAtom,
    turnColorAtom,
    turnHistoryAtom,
    viewAtom
} from "./atoms.ts";
import {useGameViewer} from "../../hooks/GameViewer.ts";
import {useSocket} from "../../components/context/SocketContext.ts";
import {type CSSProperties, useEffect, useState} from "react";
import GameActions from "../../components/GameActions.tsx";
import {useClockState} from "../../hooks/LiveClock.ts";
import {usePieceAnimations} from "../../hooks/PieceAnimation.ts";

// Usable height inside AppShell.Main, derived from Mantine's own CSS vars
// (header height + top/bottom padding). Stays correct if you change either.
// dvh keeps the bottom row from being cut off by the mobile browser toolbar.
const PLAY_AREA_STYLE = {
    "--play-h": "calc(100dvh - var(--app-shell-header-offset) - var(--app-shell-padding) * 2)",
} as CSSProperties;

type MobileTab = "rules" | "history" | "chat";

function Play() {
    const socket = useSocket();

    const gameId = useAtomValue(gameIdAtom);
    const startBoard = useAtomValue(startBoardAtom);
    const gameStatus = useAtomValue(gameStatusAtom);
    const rulePoolIds = useAtomValue(rulePoolIdsAtom);
    const players = useAtomValue(playersAtom);
    const player = useAtomValue(playerAtom);
    const turnHistory = useAtomValue(turnHistoryAtom);
    const clockInfo = useAtomValue(clockInfoAtom);
    const gameResult = useAtomValue(gameResultAtom);
    const gameResultReason = useAtomValue(gameResultReasonAtom);

    const [view, setView] = useAtom(viewAtom);
    const [turnColor, setTurnColor] = useAtom(turnColorAtom);
    const [isBluffing, setIsBluffing] = useAtom(isBluffingAtom);
    const [drawOfferedColor, setDrawOfferedColor] = useAtom(drawOfferedColorAtom);
    const [isDragMove, setIsDragMove] = useAtom(isDragMoveAtom);

    const addTurn = useSetAtom(addTurnAtom);
    const removeTurn = useSetAtom(removeTurnAtom);
    const addTurnTimestamp = useSetAtom(addTurnTimestampAtom);

    const { visibleBoard, viewMoveIndex, setViewMoveIndex, highlightedMove } = useGameViewer(startBoard, turnHistory);
    const clockState = useClockState(turnHistory, clockInfo, -1);
    const { activeAnimations, clearAnimations, hiddenSquares } = usePieceAnimations(turnHistory, viewMoveIndex, isDragMove);

    const [opponent, setOpponent] = useState<PlayerDTO | null>(null)
    const [mobileTab, setMobileTab] = useState<MobileTab>("history");


    useEffect(() => {
        const oppColor = player?.color === Color.White ? Color.Black : Color.White;
        setOpponent(players.find(player => player.color === oppColor) ?? null);
    }, [player, players])


    function handleMove(move: Move) {
        if (!socket) {
            console.error("socket not connected");
            return;
        }

        if (!gameId) {
            console.error("Couldn't get game id to send move");
            return;
        }

        const payload: GameMoveSendRequest = {
            gameId: gameId,
            move: move,
        }

        if (visibleBoard)
            move.notation = getMoveNotation(visibleBoard, move);
        const oldTurnColor = turnColor;

        addTurn(move);
        setTurnColor(turnColor === Color.White ? Color.Black : Color.White);

        socket.emit("game:move:send", payload, (ok, message, appliedAt) => {
            if (!ok) {
                removeTurn(-1);
                setTurnColor(oldTurnColor);
                clearAnimations();
                console.error(message);
            }

            setIsBluffing(false);
            if (appliedAt) addTurnTimestamp(appliedAt, -1);
        })
    }

    const topColor: Color = view === undefined ? (player?.color === Color.White ? Color.Black : Color.White) : (view === Color.White ? Color.Black : Color.White)
    const bottomColor: Color = topColor === Color.White ? Color.Black : Color.White;
    const topClock = clockState.get(topColor);
    const bottomClock = clockState.get(bottomColor);

    const bluffCallDisabled =
        turnColor !== player?.color ||
        turnHistory.length === 0 ||
        !("from" in (turnHistory.at(-1) ?? {}));

    const mobileTabs: { id: MobileTab; label: string }[] = [
        { id: "rules", label: "Rules" },
        { id: "history", label: "History" },
        { id: "chat", label: "Chat" },
    ];


    return (<div style={PLAY_AREA_STYLE} className={"flex flex-col min-h-[var(--play-h)] w-full text-white"}>

        <div className={"flex flex-col xl:flex-row gap-3 xl:gap-5 justify-center items-stretch xl:items-start min-h-[var(--play-h)] xl:h-[var(--play-h)]"}>

            {/* Left Side (desktop only) */}
            <div className={"hidden xl:block w-[300px] h-full"}>
                <Group orientation={"vertical"}
                       defaultLayout={{
                           "rule-pool": 1,
                           "own-rules": 1
                       }}
                >
                    <Panel id={"rule-pool"} minSize={"100px"}>
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10"}>
                            <h3 className={"text-base font-semibold text-center pt-2 text-gray-300 uppercase "}>Game Rules</h3>
                            <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={player?.color || Color.White} onlyShowEnabled={true} wrapChips={true}/>
                        </div>
                    </Panel>

                    <Separator className={"flex flex-row justify-center h-4 my-1 outline-none bg-bg-2/50 hover:bg-bg-2"}>
                        <MdOutlineDragIndicator color={"gray"} className={"rotate-90"}/>
                    </Separator>

                    <Panel
                        id={"own-rules"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10"}>
                            <h3 className={"text-base font-semibold text-center pt-2 text-gray-300 uppercase "}>Your Rules</h3>
                            <OwnRules ruleIds={player?.ruleIds ?? []} color={player?.color || Color.White}/>
                        </div>
                    </Panel>
                </Group>
            </div>

            {/* Board */}
            <div className={"flex flex-col items-center justify-center flex-1 w-full min-w-0 max-w-full xl:max-w-[min(calc(100dvh_-_100px),75vw)]"}>

                {/* Top Player */}
                <div className={"flex flex-row justify-between w-full mb-0.5"}>
                    <div className={"flex flex-row justify-center items-end gap-1"}>
                        {/* Player Name*/}
                        <p className={"text-base font-semibold"}>{view === player?.color || view === undefined ? opponent?.username : player?.username}</p>
                        {/* Piece Eval */}
                        <p className={"text-sm text-gray-400 "}>{visibleBoard?.getPieceEval(topColor, true)}</p>
                    </div>

                    {clockInfo.usesClock && topClock && <Timer
                        baseMs={topClock.baseMs}
                        anchorMs={topClock.anchorMs}
                        isRunning={gameStatus !== GameStatus.DONE && topClock.running}
                    />}
                </div>

                {/* Board */}
                <div className={"w-full max-w-[min(92vw,calc(100dvh_-_240px))] xl:max-w-[min(calc(100dvh_-_180px),65vw)] aspect-square"}>
                    {visibleBoard !== null && player && <Board
                        board={visibleBoard}
                        gameStatus={gameStatus}
                        player={player}
                        view={view ?? player.color}
                        turn={turnColor}
                        canMove={viewMoveIndex == -1}
                        isBluffing={isBluffing}
                        handleMove={handleMove}
                        highlightedMove={highlightedMove}
                        animations={activeAnimations}
                        hiddenSquares={hiddenSquares}
                        setIsDragMove={setIsDragMove}
                    />}
                </div>

                {/* Bottom Player */}
                <div className={"flex flex-row justify-between w-full mt-1"}>
                    <div className={"flex flex-row justify-center items-start gap-1"}>
                        {/* Player Name*/}
                        <p className={"text-base font-semibold"}>{view === player?.color || view === undefined ? player?.username : opponent?.username}</p>
                        {/* Piece Eval */}
                        <p className={"text-sm text-gray-400 "}>{visibleBoard?.getPieceEval(bottomColor, true)}</p>
                    </div>

                    <div className={"hidden xl:flex flex-row justify-center gap-2"}>
                        <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                        <CallBluffButtonOnline
                            gameId={gameId}
                            disabled={bluffCallDisabled}
                        />
                    </div>

                    {clockInfo.usesClock && bottomClock && <Timer
                        baseMs={bottomClock.baseMs}
                        anchorMs={bottomClock.anchorMs}
                        isRunning={gameStatus !== GameStatus.DONE && bottomClock.running}
                    />}
                </div>

                <div className={"xl:hidden flex flex-row justify-around gap-2 w-full mt-2 [&>*]:min-h-11 [&>*]:flex-1"}>
                    <BluffButton isBluffing={isBluffing} setIsBluffing={setIsBluffing}/>
                    <CallBluffButtonOnline
                        gameId={gameId}
                        disabled={bluffCallDisabled}
                    />
                </div>

            </div>

            {/* Mobile secondary content: tabbed Rules / History / Chat */}
            <div className={"xl:hidden flex flex-col w-full mt-3"}>
                <div className={"flex flex-row gap-1 mb-2"}>
                    {mobileTabs.map(({ id, label }) => (
                        <button
                            key={id}
                            type={"button"}
                            onClick={() => setMobileTab(id)}
                            className={`flex-1 min-h-11 rounded-lg text-sm font-semibold uppercase transition-colors ${
                                mobileTab === id ? "bg-bg-2 text-white" : "bg-bg-2/40 text-gray-400 hover:bg-bg-2/70"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className={"h-[50dvh] min-h-[300px]"}>
                    {mobileTab === "rules" && (
                        <div className={"flex flex-col gap-2 h-full overflow-y-auto"}>
                            <div className={"flex flex-col rounded-lg bg-bg-2 border border-white/10"}>
                                <h3 className={"text-base font-semibold text-center pt-2 text-gray-300 uppercase "}>Your Rules</h3>
                                <OwnRules ruleIds={player?.ruleIds ?? []} color={player?.color || Color.White}/>
                            </div>
                            <div className={"flex flex-col rounded-lg bg-bg-2 border border-white/10"}>
                                <h3 className={"text-base font-semibold text-center pt-2 text-gray-300 uppercase "}>Game Rules</h3>
                                <RuleList enabledRuleIds={rulePoolIds} size={"xs"} color={player?.color || Color.White} onlyShowEnabled={true} wrapChips={true}/>
                            </div>
                        </div>
                    )}

                    {mobileTab === "history" && (
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
                            <div className={"flex-1 min-h-0"}>
                                <TurnHistory
                                    turnHistory={turnHistory}
                                    viewMoveIndex={viewMoveIndex}
                                    setViewMoveIndex={setViewMoveIndex}
                                    setView={setView}
                                    playerColor={player?.color ?? Color.White}
                                />
                            </div>

                            <div className={"shrink-0 w-full pt-2 pb-1"}>
                                <GameActions gameId={gameId}
                                             color={player?.color ?? Color.White}
                                             drawOfferedColor={drawOfferedColor}
                                             setDrawOfferedColor={setDrawOfferedColor}
                                             gameStatus={gameStatus}
                                             gameResult={gameResult}
                                             gameResultReason={gameResultReason}
                                />
                            </div>
                        </div>
                    )}

                    {mobileTab === "chat" && (
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
                            <h3 className={"text-base font-semibold text-center pt-1 text-gray-300 uppercase "}>Chat</h3>
                            <Chatroom
                                gameId={gameId}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side (desktop only) */}
            <div className={"hidden xl:block w-[300px] h-full"}>
                <Group orientation={"vertical"}
                       defaultLayout={{
                           "turn-history": 1.3,
                           "chat": 1
                       }}
                >
                    <Panel
                        id={"turn-history"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
                            <div className={"flex-1 min-h-0"}>
                                <TurnHistory
                                    turnHistory={turnHistory}
                                    viewMoveIndex={viewMoveIndex}
                                    setViewMoveIndex={setViewMoveIndex}
                                    setView={setView}
                                    playerColor={player?.color ?? Color.White}
                                />
                            </div>

                            <div className={"shrink-0 w-full pt-2 pb-1"}>
                                <GameActions gameId={gameId}
                                             color={player?.color ?? Color.White}
                                             drawOfferedColor={drawOfferedColor}
                                             setDrawOfferedColor={setDrawOfferedColor}
                                             gameStatus={gameStatus}
                                             gameResult={gameResult}
                                             gameResultReason={gameResultReason}
                                />
                            </div>
                        </div>
                    </Panel>

                    <Separator className={"flex flex-row justify-center h-4 my-1 outline-none bg-bg-2/50 hover:bg-bg-2"}>
                        <MdOutlineDragIndicator color={"gray"} className={"rotate-90"}/>
                    </Separator>

                    <Panel
                        id={"chat"}
                        minSize={"100px"}
                    >
                        <div className={"flex flex-col rounded-lg h-full bg-bg-2 border border-white/10 p-1"}>
                            <h3 className={"text-base font-semibold text-center pt-1 text-gray-300 uppercase "}>Chat</h3>
                            <Chatroom
                                gameId={gameId}
                            />
                        </div>
                    </Panel>
                </Group>


            </div>
        </div>
    </div>)
}


export default Play;